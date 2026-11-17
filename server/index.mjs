import Fastify from "fastify";
import multipart from "@fastify/multipart";
import { randomUUID, timingSafeEqual } from "node:crypto";
import { mkdir, readFile, writeFile, rm } from "node:fs/promises";
import path from "node:path";

const app = Fastify({ logger: true, bodyLimit: 1024 * 1024 });
const PORT = Number(process.env.PORT || 8787);
const HOST = process.env.HOST || "0.0.0.0";
const TOKEN = process.env.TOP_VIDEO_API_TOKEN || "";
const STORAGE_DIR = path.resolve(process.env.TOP_VIDEO_STORAGE || "./storage/jobs");
const MAX_FILE_BYTES = 100 * 1024 * 1024;

if (!TOKEN || TOKEN.length < 24) {
  throw new Error("Defina TOP_VIDEO_API_TOKEN com pelo menos 24 caracteres antes de iniciar a API.");
}

await mkdir(STORAGE_DIR, { recursive: true });
await app.register(multipart, {
  limits: { fileSize: MAX_FILE_BYTES, files: 1, fields: 8, parts: 9 }
});

function authorized(request) {
  const header = request.headers.authorization || "";
  const supplied = header.startsWith("Bearer ") ? header.slice(7) : "";
  const a = Buffer.from(supplied);
  const b = Buffer.from(TOKEN);
  return a.length === b.length && timingSafeEqual(a, b);
}

app.addHook("preHandler", async (request, reply) => {
  if (request.url === "/health") return;
  if (!authorized(request)) {
    return reply.code(401).send({ error: "Não autorizado." });
  }
});

app.get("/health", async () => ({
  status: "ok",
  service: "top-video-api",
  stage: "private-upload-foundation"
}));

app.post("/api/jobs", async (request, reply) => {
  let videoBuffer;
  let originalName = "video";
  let mimeType = "";
  let instruction = "";
  let aspectRatio = "9:16";
  let approvalRequired = true;

  try {
    for await (const part of request.parts()) {
      if (part.type === "file") {
        if (part.fieldname !== "video") {
          return reply.code(400).send({ error: "O arquivo deve usar o campo 'video'." });
        }
        mimeType = part.mimetype;
        originalName = path.basename(part.filename || "video").slice(0, 180);
        videoBuffer = await part.toBuffer();
      } else if (part.type === "field") {
        if (part.fieldname === "instruction") instruction = String(part.value || "").trim();
        if (part.fieldname === "aspectRatio") aspectRatio = String(part.value || "9:16");
        if (part.fieldname === "approvalRequired") approvalRequired = String(part.value) !== "false";
      }
    }
  } catch (error) {
    const tooLarge = error?.code === "FST_REQ_FILE_TOO_LARGE";
    return reply.code(tooLarge ? 413 : 400).send({
      error: tooLarge ? "Vídeo maior que o limite de 100 MB." : "Não foi possível receber o arquivo."
    });
  }

  if (!videoBuffer?.length) {
    return reply.code(400).send({ error: "Envie um vídeo no campo 'video'." });
  }
  const allowedTypes = new Set(["video/mp4", "video/quicktime", "video/webm", "video/x-matroska"]);
  if (!allowedTypes.has(mimeType)) {
    return reply.code(415).send({ error: "Formato não aceito. Use MP4, MOV, WebM ou MKV." });
  }
  if (!instruction || instruction.length > 4000) {
    return reply.code(400).send({ error: "Escreva instruções de até 4.000 caracteres." });
  }
  if (!["9:16", "16:9", "1:1"].includes(aspectRatio)) {
    return reply.code(400).send({ error: "Formato de saída inválido." });
  }

  const id = randomUUID();
  const jobDir = path.join(STORAGE_DIR, id);
  await mkdir(jobDir, { recursive: true });
  const ext = ({ "video/mp4": ".mp4", "video/quicktime": ".mov", "video/webm": ".webm", "video/x-matroska": ".mkv" })[mimeType];
  const sourcePath = path.join(jobDir, "source" + ext);
  const createdAt = new Date().toISOString();
  const job = {
    id,
    status: "uploaded",
    originalName,
    mimeType,
    sizeBytes: videoBuffer.length,
    instruction,
    aspectRatio,
    approvalRequired,
    createdAt,
    sourceFile: path.basename(sourcePath),
    note: "Arquivo recebido. A análise por IA e a renderização ainda não estão conectadas."
  };

  try {
    await writeFile(sourcePath, videoBuffer, { flag: "wx", mode: 0o600 });
    await writeFile(path.join(jobDir, "job.json"), JSON.stringify(job, null, 2), { mode: 0o600 });
  } catch (error) {
    await rm(jobDir, { recursive: true, force: true });
    throw error;
  }

  return reply.code(201).send({
    jobId: id,
    status: job.status,
    sizeBytes: job.sizeBytes,
    createdAt,
    nextStep: "planning_not_connected"
  });
});

app.get("/api/jobs/:id", async (request, reply) => {
  const id = request.params.id;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return reply.code(400).send({ error: "ID inválido." });
  try {
    const raw = await readFile(path.join(STORAGE_DIR, id, "job.json"), "utf8");
    const { sourceFile, ...publicJob } = JSON.parse(raw);
    return publicJob;
  } catch {
    return reply.code(404).send({ error: "Trabalho não encontrado." });
  }
});

app.delete("/api/jobs/:id", async (request, reply) => {
  const id = request.params.id;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return reply.code(400).send({ error: "ID inválido." });
  const jobDir = path.join(STORAGE_DIR, id);
  try {
    await readFile(path.join(jobDir, "job.json"), "utf8");
    await rm(jobDir, { recursive: true, force: true });
    return reply.code(200).send({ deleted: true, jobId: id });
  } catch {
    return reply.code(404).send({ error: "Trabalho não encontrado." });
  }
});

app.setErrorHandler((error, request, reply) => {
  request.log.error(error);
  if (!reply.sent) reply.code(500).send({ error: "Erro interno da API." });
});

try {
  await app.listen({ port: PORT, host: HOST });
} catch (error) {
  app.log.error(error);
  process.exit(1);
}
