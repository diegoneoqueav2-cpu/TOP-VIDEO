import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { mkdtemp, readFile, rm, stat } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import Ajv2020 from "ajv/dist/2020.js";
import { TOP_VIDEO_EDITOR_PROFILE } from "./editor-profile.mjs";

const exec = promisify(execFile);
const MAX_AUDIO_BYTES = 24 * 1024 * 1024;
const MAX_FRAMES = 20;

async function run(command, args) {
  try {
    return await exec(command, args, { timeout: 180000, maxBuffer: 12 * 1024 * 1024 });
  } catch (error) {
    const wrapped = new Error("FFmpeg/FFprobe não conseguiu processar este arquivo.");
    wrapped.publicMessage = "Confirme que FFmpeg e FFprobe estão instalados e que o vídeo é válido.";
    wrapped.cause = error;
    throw wrapped;
  }
}

async function transcribe(audioPath, apiKey) {
  const info = await stat(audioPath);
  if (!info.size) return { text: "", status: "no_audio", warning: "O vídeo não contém áudio reconhecível." };
  if (info.size > MAX_AUDIO_BYTES) {
    return { text: "", status: "skipped_size", warning: "Áudio acima de 24 MB; a transcrição foi pulada para evitar uma chamada fora do limite." };
  }

  const audio = await readFile(audioPath);
  const form = new FormData();
  form.append("file", new Blob([audio], { type: "audio/mpeg" }), "audio.mp3");
  form.append("model", "gpt-transcribe");
  form.append("response_format", "json");
  form.append("languages[]", "pt");

  const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}` },
    body: form
  });
  if (!response.ok) {
    const detail = (await response.text()).slice(0, 500);
    return {
      text: "",
      status: "failed",
      warning: `A transcrição falhou (HTTP ${response.status}). ${detail}`
    };
  }
  const result = await response.json();
  return { text: String(result.text || "").slice(0, 30000), status: "completed", warning: null };
}

function buildFrameTimes(duration) {
  const count = Math.min(MAX_FRAMES, Math.max(2, Math.ceil(duration / 3)));
  if (count === 1) return [0];
  return Array.from({ length: count }, (_, index) =>
    Number((Math.max(0, duration - 0.05) * index / (count - 1)).toFixed(2))
  );
}

export async function analyzeVideo({ sourcePath, instruction, aspectRatio, schemaPath, apiKey, model }) {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), "top-video-analysis-"));
  try {
    const { stdout: probe } = await run("ffprobe", [
      "-v", "error", "-show_entries", "format=duration:stream=codec_type,width,height,r_frame_rate",
      "-of", "json", sourcePath
    ]);
    const metadata = JSON.parse(probe);
    const duration = Number(metadata.format?.duration);
    if (!Number.isFinite(duration) || duration <= 0 || duration > 1800) {
      throw new Error("Duração inválida ou acima de 30 minutos.");
    }
    const videoStream = metadata.streams?.find(stream => stream.codec_type === "video");
    if (!videoStream) throw new Error("O arquivo não contém uma faixa de vídeo.");

    const frameTimes = buildFrameTimes(duration);
    const frames = [];
    for (let i = 0; i < frameTimes.length; i++) {
      const second = frameTimes[i];
      const output = path.join(tempDir, `frame-${i}.jpg`);
      await run("ffmpeg", [
        "-y", "-ss", second.toFixed(2), "-i", sourcePath, "-frames:v", "1",
        "-vf", "scale=1024:-2:force_original_aspect_ratio=decrease", "-q:v", "4", output
      ]);
      frames.push({
        second,
        data: (await readFile(output)).toString("base64")
      });
    }

    const audioPath = path.join(tempDir, "audio.mp3");
    let audioResult = { text: "", status: "unavailable", warning: null };
    try {
      await run("ffmpeg", [
        "-y", "-i", sourcePath, "-vn", "-ac", "1", "-ar", "16000", "-b:a", "48k", audioPath
      ]);
      audioResult = await transcribe(audioPath, apiKey);
    } catch (error) {
      audioResult = {
        text: "",
        status: "failed",
        warning: error?.publicMessage || "Não foi possível extrair o áudio do vídeo."
      };
    }

    const schema = JSON.parse(await readFile(schemaPath, "utf8"));
    const prompt = `${TOP_VIDEO_EDITOR_PROFILE.userTemplate}\n\nVocê deve ENTENDER o vídeo antes de sugerir qualquer edição.

MODO: HÍBRIDO. Preserve a filmagem original e proponha inserções de ilustrações, imagens e motion graphics somente quando agregarem clareza ou impacto. Não substitua a cena original sem motivo.

INSTRUÇÕES DO USUÁRIO:
${instruction}

DADOS TÉCNICOS:
- Duração exata: ${duration.toFixed(2)} segundos.
- Resolução: ${videoStream.width || "desconhecida"}x${videoStream.height || "desconhecida"}.
- FPS informado pelo arquivo: ${videoStream.r_frame_rate || "desconhecido"}.
- Formato de saída: ${aspectRatio}.
- Foram enviados ${frames.length} quadros distribuídos ao longo do vídeo. Cada imagem vem acompanhada do segundo exato em que foi capturada.
- Transcrição do áudio (${audioResult.status}): ${audioResult.text || "(nenhuma fala transcrita)"}.

REGRAS DE ANÁLISE:
1. Descreva somente o que é possível observar ou ouvir. Diferencie fatos visíveis de hipóteses.
2. Divida o vídeo em cenas ou momentos coerentes. Use tempos aproximados, mas sempre dentro da duração real.
3. Para cada cena, explique o que aparece, quem ou o que está em destaque, o enquadramento, a ação/movimento observável e a oportunidade de edição.
4. Observe mudanças de câmera, cortes, movimento, objetos importantes, textos na tela, iluminação e continuidade.
5. Use a transcrição para identificar falas e sugerir legendas curtas e fiéis. Não invente falas. Se não houver transcrição, não crie legendas faladas.
6. Sugira cortes apenas quando houver motivo claro (pausa longa, repetição, erro evidente ou trecho sem valor). Na dúvida, preserve.
7. Sugira elementos gráficos com posição e duração. Não cubra rostos, produtos ou elementos essenciais.
8. Quando sugerir um asset, descreva exatamente o que deve ser criado e como se integra à filmagem. Um objeto 3D é uma sugestão, não afirme que já existe.
9. Distribua os elementos no tempo e evite excesso de efeitos. Priorize edição limpa, natural e profissional.
10. Gere somente um PLANO PARA APROVAÇÃO HUMANA. Não renderize nem execute alterações.

RETORNE SOMENTE JSON VÁLIDO, sem markdown, sem texto antes ou depois, com todos estes campos:
{
  "version": 1,
  "mode": "hybrid",
  "aspectRatio": "${aspectRatio}",
  "fps": 30,
  "source": { "durationSeconds": ${duration.toFixed(2)} },
  "analysis": {
    "summary": "resumo objetivo do conteúdo e da intenção do vídeo",
    "scenes": [{
      "startSeconds": 0,
      "endSeconds": 3,
      "description": "descrição concreta da cena",
      "visualElements": ["elementos realmente observados"],
      "editingOpportunity": "o que vale ou não vale fazer nesta parte"
    }]
  },
  "edits": [{ "type": "keep", "startSeconds": 0, "endSeconds": 3, "reason": "motivo" }],
  "captions": [{ "text": "fala fiel à transcrição", "startSeconds": 0, "endSeconds": 2, "style": "white_yellow" }],
  "graphics": [{ "kind": "callout", "text": "texto curto", "startSeconds": 1, "endSeconds": 3, "position": "bottom" }],
  "assetSuggestions": [{ "kind": "2d_motion", "prompt": "descrição visual do elemento a criar", "startSeconds": 2, "endSeconds": 4, "reason": "por que ajuda" }],
  "audio": { "noiseReduction": false, "music": "none", "musicVolume": 0.15 }
}

LIMITES DO JSON:
- Use somente os tipos e valores aceitos pelo schema.
- Para edits.type use keep, remove ou trim.
- Para captions.style use white, white_yellow ou green.
- Para graphics.kind use title, lower_third, callout, arrow, shape ou simple_2d.
- Para assetSuggestions.kind use image, illustration, 2d_motion ou 3d_object.
- Não ultrapasse ${duration.toFixed(2)} segundos.
- Se uma categoria não for necessária, retorne lista vazia.
- Use no máximo 40 cenas, 100 edits, 300 legendas, 100 gráficos e 30 sugestões de assets.`;

    const content = [
      { type: "text", text: prompt },
      ...frames.flatMap(frame => [
        { type: "text", text: `QUADRO DO VÍDEO — capturado em ${frame.second.toFixed(2)} segundos:` },
        {
          type: "image_url",
          image_url: { url: `data:image/jpeg;base64,${frame.data}`, detail: "high" }
        }
      ])
    ];

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        temperature: 0.1,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: TOP_VIDEO_EDITOR_PROFILE.system + "\n\nResponda com JSON válido, sem inventar observações e respeitando rigorosamente os limites temporais." },
          { role: "user", content }
        ]
      })
    });
    if (!response.ok) {
      const errorBody = await response.text();
      const error = new Error("A IA não conseguiu interpretar o vídeo.");
      error.publicMessage = response.status === 401
        ? "A chave OPENAI_API_KEY é inválida."
        : `Falha no serviço de IA (HTTP ${response.status}). ${errorBody.slice(0, 300)}`;
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
      error.publicMessage = ajv.errors?.slice(0, 8)
        .map(item => `${item.instancePath || "/"} ${item.message}`).join("; ");
      throw error;
    }

    const timedCollections = [
      ["scenes", plan.analysis.scenes],
      ["edits", plan.edits],
      ["captions", plan.captions],
      ["graphics", plan.graphics],
      ["assetSuggestions", plan.assetSuggestions]
    ];
    for (const [name, items] of timedCollections) {
      for (const item of items) {
        if (item.startSeconds >= duration || item.endSeconds > duration || item.endSeconds <= item.startSeconds) {
          throw new Error(`A IA gerou tempos inválidos em ${name}; refaça a análise.`);
        }
      }
    }

    return {
      plan,
      transcript: audioResult.text,
      notes: {
        sampledFrames: frames.length,
        frameTimes,
        durationSeconds: duration,
        resolution: videoStream.width && videoStream.height ? `${videoStream.width}x${videoStream.height}` : null,
        fps: videoStream.r_frame_rate || null,
        model,
        audioStatus: audioResult.status,
        warnings: audioResult.warning ? [audioResult.warning] : [],
        humanApprovalRequired: true,
        limitation: "Análise baseada em quadros amostrados e transcrição; não é uma leitura contínua de todos os frames."
      }
    };
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
}
