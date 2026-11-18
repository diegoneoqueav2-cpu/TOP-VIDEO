import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { readFile } from "node:fs/promises";
import Ajv2020 from "ajv/dist/2020.js";

const exec = promisify(execFile);

export async function validateEditPlan({ editPlan, schemaPath, sourcePath, expectedAspectRatio }) {
  if (!editPlan || typeof editPlan !== "object" || Array.isArray(editPlan)) {
    const error = new Error("Envie o objeto editPlan completo.");
    error.publicMessage = error.message;
    throw error;
  }

  const schema = JSON.parse(await readFile(schemaPath, "utf8"));
  const ajv = new Ajv2020({ allErrors: true, strict: false });
  const validate = ajv.compile(schema);
  if (!validate(editPlan)) {
    const details = (validate.errors || []).slice(0, 10)
      .map(item => `${item.instancePath || "/"} ${item.message}`).join("; ");
    const error = new Error("Plano fora do schema.");
    error.publicMessage = details;
    throw error;
  }

  if (editPlan.aspectRatio !== expectedAspectRatio) {
    const error = new Error("O formato do plano não corresponde ao formato escolhido no envio.");
    error.publicMessage = error.message;
    throw error;
  }

  const { stdout } = await exec("ffprobe", [
    "-v", "error", "-show_entries", "format=duration:stream=codec_type,width,height,r_frame_rate",
    "-of", "json", sourcePath
  ], { timeout: 30000, maxBuffer: 2 * 1024 * 1024 });
  const metadata = JSON.parse(stdout);
  const durationSeconds = Number(metadata.format?.duration);
  const video = metadata.streams?.find(stream => stream.codec_type === "video");
  if (!Number.isFinite(durationSeconds) || durationSeconds <= 0 || !video) {
    const error = new Error("Não foi possível confirmar a duração e a faixa de vídeo do arquivo original.");
    error.publicMessage = error.message;
    throw error;
  }

  if (Math.abs(editPlan.source.durationSeconds - durationSeconds) > 1.25) {
    const error = new Error("A duração informada no plano não corresponde ao vídeo enviado.");
    error.publicMessage = error.message;
    throw error;
  }

  const collections = [
    ["analysis.scenes", editPlan.analysis.scenes],
    ["edits", editPlan.edits],
    ["captions", editPlan.captions],
    ["graphics", editPlan.graphics],
    ["assetSuggestions", editPlan.assetSuggestions]
  ];
  for (const [name, items] of collections) {
    for (const item of items) {
      if (item.startSeconds >= durationSeconds || item.endSeconds > durationSeconds + 0.05 || item.endSeconds <= item.startSeconds) {
        const error = new Error(`Tempos inválidos em ${name}.`);
        error.publicMessage = `O intervalo ${item.startSeconds}s–${item.endSeconds}s em ${name} ultrapassa a duração real ou está invertido.`;
        throw error;
      }
    }
  }

  return {
    durationSeconds: Number(durationSeconds.toFixed(2)),
    resolution: video.width && video.height ? `${video.width}x${video.height}` : null,
    fps: video.r_frame_rate || null,
    summary: "Schema, proporção e intervalos conferidos contra o vídeo original."
  };
}
