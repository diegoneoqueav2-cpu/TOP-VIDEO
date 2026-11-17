import Fastify from "fastify";
import multipart from "@fastify/multipart";
import { randomUUID, timingSafeEqual, createHmac } from "node:crypto";
import { mkdir, readFile, writeFile, rm } from "node:fs/promises";
import path from "node:path";
import { createReadStream } from "node:fs";

const app = Fastify({ logger: true, bodyLimit: 1024 * 1024 });
const PORT = Number(process.env.PORT || 8787);
const HOST = process.env.HOST || "0.0.0.0";
const TOKEN = process.env.TOP_VIDEO_API_TOKEN || "";
const STORAGE_DIR = path.resolve(process.env.TOP_VIDEO_STORAGE || "./storage/jobs");
const MAX_FILE_BYTES = 100 * 1024 * 1024;
const PUBLIC_URL = (process.env.TOP_VIDEO_PUBLIC_URL || "").replace(/\\/$/, "");
const SIGNED_FILE_TTL_SECONDS = 10 * 60;

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

function validSignedFileRequest(request) {
  const match = request.url.match(/^\\/api\\/jobs\\/([0-9a-f-]{36})\\/file\\?(.+)$/i);
  if (!match) return false;
  const params = new URLSearchParams(match[2]);
  const expires = Number(params.get("expires"));
  const signature = params.get("signature") || "";
  const now = Math.floor(Date.now() / 1000);
  if (!Number.isInteger(expires) || expires <= now || expires > now + SIGNED_FILE_TTL_SECONDS + 60) return false;
  const expected = createHmac("sha256", TOKEN).update(match[1] + ":" + expires).digest("hex");
  const a = Buffer.from(signature, "hex");
  const b = Buffer.from(expected, "hex");
  return a.length === b.length && timingSafeEqual(a, b);
}

async function readLimitedResponse(response) {
  const declaredSize = Number(response.headers.get("content-length") || 0);
  if (declaredSize > MAX_FILE_BYTES) throw new Error("Vídeo maior que o limite de 100 MB.");
  if (!response.body) throw new Error("O arquivo enviado pelo ChatGPT está vazio.");
  const reader = response.body.getReader();
  const chunks = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > MAX_FILE_BYTES) { await reader.cancel(); throw new Error("Vídeo maior que o limite de 100 MB."); }
    chunks.push(Buffer.from(value));
  }
  return Buffer.concat(chunks, total);
}

app.addHook("preHandler", async (request, reply) => {
  if (request.url === "/health") return;
  if (request.method === "GET" && request.url.includes("/file?") && validSignedFileRequest(request)) return;
  if (!authorized(request)) {
    return reply.code(401).send({ error: "Não autorizado." });
  }
});

app.get("/health", async () => ({
  status: "ok",
  service: "top-video-api",
  stage: "private-upload-and-ai-analysis"
}));

app.post("/api/jobs", async (request, reply) => {
  let videoBuffer;
  let originalName = "video";
  let mimeType = "";
  let instruction = "";
  let aspectRatio = "9:16";
  let approvalRequired = true;

  try {
    if (request.isMultipart()) {
      for await (const part of request.parts()) {
        if (part.type === "file") {
          if (part.fieldname !== "video") return reply.code(400).send({ error: "O arquivo deve usar o campo video." });
          mimeType = part.mimetype;
          originalName = path.basename(part.filename || "video").slice(0, 180);
          videoBuffer = await part.toBuffer();
        } else if (part.type === "field") {
          if (part.fieldname === "instruction") instruction = String(part.value || "").trim();
          if (part.fieldname === "aspectRatio") aspectRatio = String(part.value || "9:16");
          if (part.fieldname === "approvalRequired") approvalRequired = String(part.value) !== "false";
        }
      }
    } else {
      const body = request.body || {};
      instruction = String(body.instruction || "").trim();
      aspectRatio = String(body.aspectRatio || "9:16");
      approvalRequired = body.approvalRequired !== false;
      const refs = body.openaiFileIdRefs;
      if (!Array.isArray(refs) || refs.length !== 1 || !refs[0] || typeof refs[0] !== "object") {
        return reply.code(400).send({ error: "Envie exatamente um vídeo do ChatGPT em openaiFileIdRefs." });
      }
      const fileRef = refs[0];
      let downloadUrl;
      try { downloadUrl = new URL(fileRef.download_link); }
      catch { return reply.code(400).send({ error: "Referência de arquivo inválida." }); }
      if (downloadUrl.protocol !== "https:" || downloadUrl.hostname !== "files.oaiusercontent.com") {
        return reply.code(400).send({ error: "A referência deve ser um arquivo seguro enviado nesta conversa do ChatGPT." });
      }
      mimeType = String(fileRef.mime_type || "");
      originalName = path.basename(String(fileRef.name || "video")).slice(0, 180);
      const allowedTypes = new Set(["video/mp4", "video/quicktime", "video/webm", "video/x-matroska"]);
      if (!allowedTypes.has(mimeType)) return reply.code(415).send({ error: "Envie MP4, MOV, WebM ou MKV pelo ChatGPT." });
      const fileResponse = await fetch(downloadUrl, { signal: AbortSignal.timeout(60000), redirect: "error" });
      if (!fileResponse.ok) return reply.code(400).send({ error: "Não foi possível obter o vídeo anexado nesta conversa. Envie-o novamente." });
      videoBuffer = await readLimitedResponse(fileResponse);
    }
  } catch (error) {
    const tooLarge = error?.code === "FST_REQ_FILE_TOO_LARGE" || /maior que o limite/.test(error.message || "");
    return reply.code(tooLarge ? 413 : 400).send({ error: tooLarge ? "Vídeo maior que o limite de 100 MB." : "Não foi possível receber o arquivo." });
  }

  if (!videoBuffer?.length) return reply.code(400).send({ error: "Envie um vídeo no campo video ou em openaiFileIdRefs." });
  const allowedTypes = new Set(["video/mp4", "video/quicktime", "video/webm", "video/x-matroska"]);
  if (!allowedTypes.has(mimeType)) return reply.code(415).send({ error: "Formato não aceito. Use MP4, MOV, WebM ou MKV." });
  if (!instruction || instruction.length > 4000) return reply.code(400).send({ error: "Escreva instruções de até 4.000 caracteres." });
  if (!["9:16", "16:9", "1:1"].includes(aspectRatio)) return reply.code(400).send({ error: "Formato de saída inválido." });

  const id = randomUUID();
  const jobDir = path.join(STORAGE_DIR, id);
  await mkdir(jobDir, { recursive: true });
  const ext = ({ "video/mp4": ".mp4", "video/quicktime": ".mov", "video/webm": ".webm", "video/x-matroska": ".mkv" })[mimeType];
  const sourcePath = path.join(jobDir, "source" + ext);
  const createdAt = new Date().toISOString();
  const job = { id, status: "uploaded", originalName, mimeType, sizeBytes: videoBuffer.length, instruction, aspectRatio, approvalRequired, createdAt, sourceFile: path.basename(sourcePath), note: "Vídeo recebido. Execute a rota de análise para a IA interpretar o conteúdo e preparar um plano para aprovação." };
  try {
    await writeFile(sourcePath, videoBuffer, { flag: "wx", mode: 0o600 });
    await writeFile(path.join(jobDir, "job.json"), JSON.stringify(job, null, 2), { mode: 0o600 });
  } catch (error) {
    await rm(jobDir, { recursive: true, force: true });
    throw error;
  }
  return reply.code(201).send({ jobId: id, status: job.status, sizeBytes: job.sizeBytes, createdAt, nextStep: "analyze" });
});


app.post("/api/jobs/:id/analyze", async (request, reply) => {
  const id = request.params.id;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return reply.code(400).send({ error: "ID inválido." });
  if (!process.env.OPENAI_API_KEY) {
    return reply.code(503).send({ error: "Análise indisponível: configure OPENAI_API_KEY no servidor." });
  }
  try {
    const jobDir = path.join(STORAGE_DIR, id);
    const job = JSON.parse(await readFile(path.join(jobDir, "job.json"), "utf8"));
    const sourcePath = path.join(jobDir, job.sourceFile);
    const { analyzeVideo } = await import("./video-analysis.mjs");
    const result = await analyzeVideo({
      sourcePath,
      instruction: job.instruction,
      aspectRatio: job.aspectRatio,
      schemaPath: path.resolve("schemas/edit-plan.schema.json"),
      apiKey: process.env.OPENAI_API_KEY,
      model: process.env.OPENAI_VISION_MODEL || "gpt-4o-mini"
    });
    const updated = {
      ...job,
      status: job.approvalRequired ? "awaiting_approval" : "plan_ready",
      analysisCompletedAt: new Date().toISOString(),
      editPlan: result.plan,
      transcript: result.transcript,
      analysisNotes: result.notes,
      analysisWarnings: result.notes.warnings
    };
    await writeFile(path.join(jobDir, "job.json"), JSON.stringify(updated, null, 2), { mode: 0o600 });
    await writeFile(path.join(jobDir, "edit-plan.json"), JSON.stringify(result.plan, null, 2), { mode: 0o600 });
    return {
      jobId: id,
      status: updated.status,
      approvalRequired: job.approvalRequired,
      transcript: result.transcript,
      notes: result.notes,
      editPlan: result.plan
    };
  } catch (error) {
    request.log.error(error);
    return reply.code(422).send({
      error: "Não foi possível analisar o vídeo.",
      detail: error?.publicMessage || "Verifique FFmpeg, a chave da IA e os limites do arquivo."
    });
  }
});

app.post("/api/jobs/:id/command", async (request, reply) => {
  const id = request.params.id;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return reply.code(400).send({ error: "ID inválido." });
  const command = String(request.body?.instruction || "").trim();
  if (!command || command.length > 4000) return reply.code(400).send({ error: "Envie um comando de até 4.000 caracteres no campo instruction." });
  if (!process.env.OPENAI_API_KEY) return reply.code(503).send({ error: "Análise indisponível: configure OPENAI_API_KEY no servidor." });

  const jobDir = path.join(STORAGE_DIR, id);
  let job;
  try { job = JSON.parse(await readFile(path.join(jobDir, "job.json"), "utf8")); }
  catch { return reply.code(404).send({ error: "Trabalho não encontrado." }); }
  if (!job.editPlan || !["awaiting_approval", "plan_ready"].includes(job.status)) {
    return reply.code(409).send({ error: "É necessário ter um plano aguardando aprovação. Não é possível alterar um vídeo já renderizado ou em processamento." });
  }

  try {
    const { analyzeVideo } = await import("./video-analysis.mjs");
    const commandHistory = [...(job.commandHistory || []), { instruction: command, createdAt: new Date().toISOString() }].slice(-20);
    const combinedInstruction = [job.instruction, ...commandHistory.map((entry, index) => "Comando adicional " + (index + 1) + ": " + entry.instruction)].join("\n\n");
    const result = await analyzeVideo({
      sourcePath: path.join(jobDir, job.sourceFile),
      instruction: command,
      aspectRatio: job.aspectRatio,
      schemaPath: path.resolve("schemas/edit-plan.schema.json"),
      apiKey: process.env.OPENAI_API_KEY,
      model: process.env.OPENAI_VISION_MODEL || "gpt-4o-mini",
      previousPlan: job.editPlan,
      commandMode: true
    });
    const updated = {
      ...job,
      status: job.approvalRequired ? "awaiting_approval" : "plan_ready",
      commandHistory,
      analysisRevision: (job.analysisRevision || 1) + 1,
      latestCommand: command,
      analysisCompletedAt: new Date().toISOString(),
      editPlan: result.plan,
      transcript: result.transcript,
      analysisNotes: result.notes,
      analysisWarnings: result.notes.warnings
    };
    await writeFile(path.join(jobDir, "job.json"), JSON.stringify(updated, null, 2), { mode: 0o600 });
    await writeFile(path.join(jobDir, "edit-plan.json"), JSON.stringify(result.plan, null, 2), { mode: 0o600 });
    return { jobId: id, status: updated.status, approvalRequired: job.approvalRequired, analysisRevision: updated.analysisRevision, appliedCommand: command, transcript: result.transcript, notes: result.notes, editPlan: result.plan };
  } catch (error) {
    request.log.error(error);
    return reply.code(422).send({ error: "Não foi possível aplicar o comando ao plano.", detail: error?.publicMessage || "Verifique FFmpeg, a chave da IA e os limites do arquivo." });
  }
});
app.post("/api/jobs/:id/approve", async (request, reply) => {
  const id = request.params.id;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return reply.code(400).send({ error: "ID inválido." });
  const jobDir = path.join(STORAGE_DIR, id);
  let job;
  try {
    job = JSON.parse(await readFile(path.join(jobDir, "job.json"), "utf8"));
  } catch {
    return reply.code(404).send({ error: "Trabalho não encontrado." });
  }
  if (!job.editPlan || !["awaiting_approval", "plan_ready"].includes(job.status)) {
    return reply.code(409).send({ error: "Não há um plano pronto para aprovação neste trabalho." });
  }
  if (job.status === "rendering" || job.status === "completed") {
    return reply.code(409).send({ error: "Este trabalho já foi enviado para renderização ou concluído." });
  }

  const approved = {
    ...job,
    status: "rendering",
    approvedAt: new Date().toISOString(),
    renderStartedAt: new Date().toISOString(),
    renderError: null
  };
  await writeFile(path.join(jobDir, "job.json"), JSON.stringify(approved, null, 2), { mode: 0o600 });
  reply.code(202).send({ jobId: id, status: "rendering", message: "Plano aprovado. A renderização foi iniciada." });

  setImmediate(async () => {
    try {
      const { renderApprovedPlan } = await import("./render-worker.mjs");
      const outputFile = "final.mp4";
      const result = await renderApprovedPlan({
        sourcePath: path.join(jobDir, job.sourceFile),
        outputPath: path.join(jobDir, outputFile),
        jobDir,
        plan: job.editPlan
      });
      const latest = JSON.parse(await readFile(path.join(jobDir, "job.json"), "utf8"));
      await writeFile(path.join(jobDir, "job.json"), JSON.stringify({
        ...latest,
        status: "completed",
        renderCompletedAt: new Date().toISOString(),
        outputFile,
        renderResult: result
      }, null, 2), { mode: 0o600 });
    } catch (error) {
      request.log.error({ err: error, jobId: id }, "TOP VIDEO render failed");
      try {
        const latest = JSON.parse(await readFile(path.join(jobDir, "job.json"), "utf8"));
        await writeFile(path.join(jobDir, "job.json"), JSON.stringify({
          ...latest,
          status: "render_failed",
          renderFailedAt: new Date().toISOString(),
          renderError: error?.publicMessage || error.message || "Falha desconhecida na renderização."
        }, null, 2), { mode: 0o600 });
      } catch (writeError) {
        request.log.error(writeError);
      }
    }
  });
});

app.get("/api/jobs/:id/file-response", async (request, reply) => {
  const id = request.params.id;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return reply.code(400).send({ error: "ID inválido." });
  if (!PUBLIC_URL) return reply.code(503).send({ error: "Configure TOP_VIDEO_PUBLIC_URL com a URL HTTPS pública da API para entregar o MP4 ao ChatGPT." });
  try {
    const job = JSON.parse(await readFile(path.join(STORAGE_DIR, id, "job.json"), "utf8"));
    if (job.status !== "completed" || job.outputFile !== "final.mp4") return reply.code(409).send({ error: "O vídeo final ainda não está disponível." });
    const expires = Math.floor(Date.now() / 1000) + SIGNED_FILE_TTL_SECONDS;
    const signature = createHmac("sha256", TOKEN).update(id + ":" + expires).digest("hex");
    const url = PUBLIC_URL + "/api/jobs/" + id + "/file?expires=" + expires + "&signature=" + signature;
    return { openaiFileResponse: [url] };
  } catch { return reply.code(404).send({ error: "Trabalho não encontrado." }); }
});

app.get("/api/jobs/:id/file", async (request, reply) => {
  const id = request.params.id;
  if (!/^[0-9a-f-]{36}$/i.test(id) || !validSignedFileRequest(request)) return reply.code(401).send({ error: "Link de arquivo inválido ou expirado." });
  try {
    const job = JSON.parse(await readFile(path.join(STORAGE_DIR, id, "job.json"), "utf8"));
    if (job.status !== "completed" || job.outputFile !== "final.mp4") return reply.code(404).send({ error: "Vídeo final não encontrado." });
    return reply.type("video/mp4").header("Content-Disposition", "attachment; filename=TOP-VIDEO-final.mp4").send(createReadStream(path.join(STORAGE_DIR, id, "final.mp4")));
  } catch { return reply.code(404).send({ error: "Vídeo final não encontrado." }); }
});
app.get("/api/jobs/:id/download", async (request, reply) => {
  const id = request.params.id;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return reply.code(400).send({ error: "ID inválido." });
  try {
    const job = JSON.parse(await readFile(path.join(STORAGE_DIR, id, "job.json"), "utf8"));
    if (job.status !== "completed" || job.outputFile !== "final.mp4") {
      return reply.code(409).send({ error: "O vídeo final ainda não está disponível." });
    }
    const outputPath = path.join(STORAGE_DIR, id, "final.mp4");
    return reply.type("video/mp4").header("Content-Disposition", 'attachment; filename="TOP-VIDEO-final.mp4"').send(createReadStream(outputPath));
  } catch {
    return reply.code(404).send({ error: "Vídeo final ou trabalho não encontrado." });
  }
});

app.get("/api/jobs/:id", async (request, reply) => {
  const id = request.params.id;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return reply.code(400).send({ error: "ID inválido." });
  try {
    const raw = await readFile(path.join(STORAGE_DIR, id, "job.json"), "utf8");
    const { sourceFile, outputFile, ...publicJob } = JSON.parse(raw);
    if (outputFile === "final.mp4" && publicJob.status === "completed") publicJob.downloadPath = "/api/jobs/" + id + "/download";
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
