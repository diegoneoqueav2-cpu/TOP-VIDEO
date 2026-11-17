import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { access, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const exec = promisify(execFile);
const OUTPUTS = { "9:16": [1080, 1920], "16:9": [1920, 1080], "1:1": [1080, 1080] };

async function run(command, args, timeout = 30 * 60 * 1000) {
  try { return await exec(command, args, { timeout, maxBuffer: 16 * 1024 * 1024 }); }
  catch (error) {
    const wrapped = new Error("Falha ao renderizar o vídeo com FFmpeg.");
    wrapped.publicMessage = String(error.stderr || error.message || "").slice(-1200);
    wrapped.cause = error;
    throw wrapped;
  }
}
const clamp = (value, duration) => Math.max(0, Math.min(duration, Number(value)));
const fmt = (value) => Number(value).toFixed(3);

export function buildKeptSegments(edits, duration) {
  const explicit = edits.filter((item) => item.type === "keep" || item.type === "trim");
  let ranges;
  if (explicit.length) {
    ranges = explicit.map((item) => [clamp(item.startSeconds, duration), clamp(item.endSeconds, duration)]);
  } else {
    const removed = edits.filter((item) => item.type === "remove")
      .map((item) => [clamp(item.startSeconds, duration), clamp(item.endSeconds, duration)])
      .sort((a, b) => a[0] - b[0]);
    ranges = [];
    let cursor = 0;
    for (const [start, end] of removed) {
      if (start > cursor) ranges.push([cursor, start]);
      cursor = Math.max(cursor, end);
    }
    if (cursor < duration) ranges.push([cursor, duration]);
  }
  const merged = [];
  for (const range of ranges.filter(([a, b]) => b - a >= 0.08).sort((a, b) => a[0] - b[0])) {
    const last = merged.at(-1);
    if (last && range[0] <= last[1] + 0.02) last[1] = Math.max(last[1], range[1]);
    else merged.push([...range]);
  }
  if (!merged.length) throw new Error("O plano removeu todo o vídeo. Ajuste os cortes antes de renderizar.");
  let outputStart = 0;
  return merged.map(([sourceStart, sourceEnd]) => {
    const segment = { sourceStart, sourceEnd, outputStart };
    outputStart += sourceEnd - sourceStart;
    return segment;
  });
}

function escapePath(value) {
  return value.replace(/\\/g, "\\\\").replace(/:/g, "\\:").replace(/'/g, "\\'");
}
function overlayWindows(item, segments) {
  return segments.flatMap((segment) => {
    const start = Math.max(Number(item.startSeconds), segment.sourceStart);
    const end = Math.min(Number(item.endSeconds), segment.sourceEnd);
    return end > start ? [{ start: segment.outputStart + start - segment.sourceStart, end: segment.outputStart + end - segment.sourceStart }] : [];
  });
}
async function findFont() {
  for (const font of [
    "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
    "/usr/share/fonts/truetype/liberation2/LiberationSans-Bold.ttf",
    "/System/Library/Fonts/Supplemental/Arial Bold.ttf"
  ]) {
    try { await access(font); return font; } catch {}
  }
  throw new Error("Instale DejaVu Sans ou Liberation Sans no servidor para renderizar as legendas.");
}

export async function renderApprovedPlan({ sourcePath, outputPath, jobDir, plan }) {
  const probeResult = await run("ffprobe", ["-v", "error", "-show_entries", "format=duration:stream=codec_type", "-of", "json", sourcePath]);
  const probe = JSON.parse(probeResult.stdout);
  const duration = Number(probe.format?.duration || plan.source.durationSeconds);
  if (!Number.isFinite(duration) || duration <= 0 || duration > 1800) throw new Error("Duração de vídeo inválida.");
  const segments = buildKeptSegments(plan.edits, duration);
  const totalDuration = segments.reduce((sum, item) => sum + item.sourceEnd - item.sourceStart, 0);
  const hasAudio = probe.streams?.some((stream) => stream.codec_type === "audio");
  const [width, height] = OUTPUTS[plan.aspectRatio] || OUTPUTS["9:16"];
  const fps = [24, 25, 30, 60].includes(plan.fps) ? plan.fps : 30;
  const font = escapePath(await findFont());
  const filters = [];
  const videoInputs = [];
  const audioInputs = [];

  segments.forEach((segment, index) => {
    const v = "vseg" + index;
    filters.push("[0:v:0]trim=start=" + fmt(segment.sourceStart) + ":end=" + fmt(segment.sourceEnd) + ",setpts=PTS-STARTPTS[" + v + "]");
    videoInputs.push("[" + v + "]");
    if (hasAudio) {
      const a = "aseg" + index;
      filters.push("[0:a:0]atrim=start=" + fmt(segment.sourceStart) + ":end=" + fmt(segment.sourceEnd) + ",asetpts=PTS-STARTPTS[" + a + "]");
      audioInputs.push("[" + a + "]");
    }
  });
  if (segments.length === 1) {
    filters.push(videoInputs[0] + "null[vjoined]");
    if (hasAudio) filters.push(audioInputs[0] + "anull[ajoined]");
  } else {
    const concatInputs = segments.map((_, index) => "[" + "vseg" + index + "]" + (hasAudio ? "[aseg" + index + "]" : "")).join("");
    filters.push(concatInputs + "concat=n=" + segments.length + ":v=1:a=" + (hasAudio ? 1 : 0) + "[vjoined]" + (hasAudio ? "[ajoined]" : ""));
  }
  filters.push("[vjoined]scale=" + width + ":" + height + ":force_original_aspect_ratio=increase,crop=" + width + ":" + height + ",setsar=1,fps=" + fps + "[vscaled]");

  let current = "vscaled";
  let overlayIndex = 0;
  const items = [
    ...plan.captions.map((item) => ({ ...item, overlayType: "caption" })),
    ...plan.graphics.map((item) => ({ ...item, overlayType: "graphic" }))
  ];
  for (const item of items) {
    const windows = overlayWindows(item, segments);
    if (!windows.length || !String(item.text || "").trim()) continue;
    const textFile = path.join(jobDir, "overlay-" + overlayIndex + ".txt");
    await writeFile(textFile, String(item.text).replace(/\r/g, "").slice(0, 180), { mode: 0o600 });
    const next = "vlay" + overlayIndex;
    const position = item.position || "bottom";
    const y = position === "top" ? "h*0.12" : position === "center" ? "(h-text_h)/2" : "h*0.80-text_h";
    const isCaption = item.overlayType === "caption";
    const color = item.style === "green" ? "#8BE0A5" : item.style === "white_yellow" ? "#FFD84D" : "white";
    const size = Math.round(width * (isCaption ? 0.047 : item.kind === "title" ? 0.064 : 0.043));
    const draws = windows.map((window) => {
      const start = fmt(window.start);
      const end = fmt(window.end);
      const alpha = "if(lt(t," + start + "+0.18),(t-" + start + ")/0.18,if(gt(t," + end + "-0.18),(" + end + "-t)/0.18,1))";
      return "drawtext=fontfile='" + font + "':textfile='" + escapePath(textFile) + "':reload=0:expansion=none:fontcolor=" + color + ":fontsize=" + size + ":x=(w-text_w)/2:y=" + y + ":box=1:boxcolor=black@0.48:boxborderw=" + Math.round(width * 0.025) + ":alpha='" + alpha + "':enable='between(t," + start + "," + end + ")'";
    });
    filters.push("[" + current + "]" + draws.join(",") + "[" + next + "]");
    current = next;
    overlayIndex++;
  }
  filters.push("[" + current + "]format=yuv420p[vout]");
  if (hasAudio) {
    if (plan.audio?.noiseReduction) filters.push("[ajoined]afftdn=nf=-25[aout]");
  }
  const filterPath = path.join(jobDir, "render-filter.txt");
  await writeFile(filterPath, filters.join(";\n"), { mode: 0o600 });
  const args = ["-y", "-i", sourcePath, "-filter_complex_script", filterPath, "-map", "[vout]"];
  if (hasAudio) args.push("-map", plan.audio?.noiseReduction ? "[aout]" : "[ajoined]");
  args.push("-c:v", "libx264", "-preset", "veryfast", "-crf", "20", "-r", String(fps), "-pix_fmt", "yuv420p");
  if (hasAudio) args.push("-c:a", "aac", "-b:a", "160k");
  args.push("-movflags", "+faststart", "-t", fmt(totalDuration), outputPath);
  await mkdir(path.dirname(outputPath), { recursive: true });
  await run("ffmpeg", args);
  return {
    durationSeconds: Number(totalDuration.toFixed(2)), width, height, fps,
    keptSegments: segments.length, captionsRendered: plan.captions.length, graphicsRendered: plan.graphics.length,
    warnings: [
      ...(plan.assetSuggestions?.length ? ["Assets sugeridos (imagens, ilustrações e 3D) ainda não são gerados automaticamente nesta versão."] : []),
      ...(plan.audio?.music && plan.audio.music !== "none" ? ["Trilha musical separada ainda não é adicionada nesta versão."] : [])
    ]
  };
}
