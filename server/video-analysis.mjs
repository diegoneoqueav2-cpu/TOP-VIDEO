import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { mkdtemp, readFile, readdir, rm, stat } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import Ajv2020 from "ajv/dist/2020.js";

const exec = promisify(execFile);
const MAX_AUDIO_BYTES = 24 * 1024 * 1024;
const MAX_FRAMES = 8;

async function run(command, args) {
  try {
    return await exec(command, args, { timeout: 120000, maxBuffer: 8 * 1024 * 1024 });
  } catch (error) {
    const wrapped = new Error("FFmpeg/FFprobe não conseguiu processar este arquivo.");
    wrapped.publicMessage = "Confirme que FFmpeg e FFprobe estão instalados e que o vídeo é válido.";
    throw wrapped;
  }
}

async function transcribe(audioPath, apiKey) {
  try {
    const info = await stat(audioPath);
    if (!info.size || info.size > MAX_AUDIO_BYTES) return "";
    const audio = await readFile(audioPath);
    const form = new FormData();
    form.append("file", new Blob([audio], { type: "audio/mpeg" }), "audio.mp3");
    form.append("model", "whisper-1");
    form.append("language", "pt");
    form.append("response_format", "text");
    const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}` },
      body: form
    });
    if (!response.ok) throw new Error("Falha na transcrição de áudio.");
    return (await response.text()).slice(0, 30000);
  } catch (error) {
    if (error?.message === "Falha na transcrição de áudio.") throw error;
    return "";
  }
}

export async function analyzeVideo({ sourcePath, instruction, aspectRatio, schemaPath, apiKey, model }) {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), "top-video-analysis-"));
  try {
    const { stdout: probe } = await run("ffprobe", [
      "-v", "error", "-show_entries", "format=duration", "-of", "default=noprint_wrappers=1:nokey=1", sourcePath
    ]);
    const duration = Number(probe.trim());
    if (!Number.isFinite(duration) || duration <= 0 || duration > 1800) {
      throw new Error("Duração inválida ou acima de 30 minutos.");
    }

    const frameCount = Math.min(MAX_FRAMES, Math.max(1, Math.ceil(duration / 8)));
    const frames = [];
    for (let i = 0; i < frameCount; i++) {
      const second = frameCount === 1 ? 0 : (duration - 0.1) * i / (frameCount - 1);
      const output = path.join(tempDir, `frame-${i}.jpg`);
      await run("ffmpeg", [
        "-y", "-ss", second.toFixed(2), "-i", sourcePath, "-frames:v", "1",
        "-vf", "scale=768:-2", "-q:v", "5", output
      ]);
      frames.push({
        second: Number(second.toFixed(2)),
        data: (await readFile(output)).toString("base64")
      });
    }

    const audioPath = path.join(tempDir, "audio.mp3");
    let transcript = "";
    try {
      await run("ffmpeg", ["-y", "-i", sourcePath, "-vn", "-ac", "1", "-ar", "16000", "-b:a", "48k", audioPath]);
      transcript = await transcribe(audioPath, apiKey);
    } catch {
      transcript = "";
    }

    const schema = JSON.parse(await readFile(schemaPath, "utf8"));
    const content = [
      {
        type: "text",
        text: `Você é o diretor de edição do TOP VIDEO. Analise os quadros amostrados e a transcrição de um vídeo real. Modo obrigatório: HÍBRIDO. Preserve a identidade e a continuidade da filmagem original; proponha inserções pontuais de imagens/ilustrações e motion graphics quando ajudarem a explicar ou valorizar o que está acontecendo. Não invente fatos, marcas, pessoas ou falas. Os tempos devem ficar dentro de 0 e ${duration.toFixed(2)} segundos. Gere um plano para aprovação humana, não execute a edição. Instrução do usuário: ${instruction}\nFormato: ${aspectRatio}. Duração: ${duration.toFixed(2)}s. Quadros: ${frames.map(f => f.second + "s").join(", ")}. Transcrição: ${transcript || "(sem transcrição disponível)"}.\nRetorne SOMENTE JSON válido com esta estrutura: {version:1,mode:"hybrid",aspectRatio,fps,source:{durationSeconds},analysis:{summary,scenes:[{startSeconds,endSeconds,description,visualElements,editingOpportunity}]},edits:[{type,startSeconds,endSeconds,reason}],captions:[{text,startSeconds,endSeconds,style}],graphics:[{kind,text,startSeconds,endSeconds,position}],assetSuggestions:[{kind,prompt,startSeconds,endSeconds,reason}],audio:{noiseReduction,music,musicVolume}}. Use apenas valores permitidos pelo schema. Para edits, use keep/remove/trim. Para captions style: white/white_yellow/green. Para graphics kind: title/lower_third/callout/arrow/shape/simple_2d. Para assets kind: image/illustration/2d_motion/3d_object. Não remova trechos sem justificativa clara. Se houver dúvida, preserve o trecho.`
      },
      ...frames.map(frame => ({
        type: "image_url",
        image_url: { url: `data:image/jpeg;base64,${frame.data}`, detail: "low" }
      }))
    ];

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        temperature: 0.2,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: "Você transforma análise audiovisual em planos de edição estruturados. Nunca retorne código executável." },
          { role: "user", content }
        ]
      })
    });
    if (!response.ok) {
      const errorBody = await response.text();
      const error = new Error("A IA não conseguiu interpretar o vídeo.");
      error.publicMessage = response.status === 401 ? "A chave OPENAI_API_KEY é inválida." : `Falha no serviço de IA (HTTP ${response.status}).`;
      error.cause = errorBody.slice(0, 500);
      throw error;
    }
    const payload = await response.json();
    const raw = payload.choices?.[0]?.message?.content;
    if (!raw) throw new Error("A IA retornou uma resposta vazia.");
    const plan = JSON.parse(raw);
    const ajv = new Ajv2020({ allErrors: true, strict: false });
    const valid = ajv.validate(schema, plan);
    if (!valid) {
      const error = new Error("O plano gerado não passou na validação.");
      error.publicMessage = ajv.errors?.slice(0, 5).map(e => `${e.instancePath || "/"} ${e.message}`).join("; ");
      throw error;
    }
    return {
      plan,
      transcript,
      notes: {
        sampledFrames: frames.length,
        durationSeconds: duration,
        model,
        humanApprovalRequired: true
      }
    };
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
}
