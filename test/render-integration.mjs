import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { mkdtemp, stat, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { renderApprovedPlan } from "../server/render-worker.mjs";

const exec = promisify(execFile);
const tempDir = await mkdtemp(path.join(os.tmpdir(), "top-video-render-test-"));
const sourcePath = path.join(tempDir, "source.mp4");
const outputPath = path.join(tempDir, "final.mp4");

try {
  await exec("ffmpeg", [
    "-y",
    "-f", "lavfi", "-i", "testsrc=size=320x240:rate=30",
    "-f", "lavfi", "-i", "sine=frequency=880:sample_rate=44100",
    "-t", "2",
    "-c:v", "libx264", "-pix_fmt", "yuv420p",
    "-c:a", "aac", "-shortest",
    sourcePath
  ]);

  const plan = {
    aspectRatio: "9:16",
    fps: 30,
    source: { durationSeconds: 2 },
    edits: [{ type: "keep", startSeconds: 0, endSeconds: 2 }],
    captions: [{ text: "TESTE TOP VIDEO", startSeconds: 0.2, endSeconds: 1.8, style: "white_yellow" }],
    graphics: [{ kind: "title", text: "REMOTION", startSeconds: 0.4, endSeconds: 1.6, position: "top" }],
    audio: { noiseReduction: false, music: "none" },
    mode: "hybrid",
    assetSuggestions: []
  };

  const result = await renderApprovedPlan({
    sourcePath,
    outputPath,
    jobDir: tempDir,
    plan
  });

  const output = await stat(outputPath);
  if (!output.size) throw new Error("O MP4 final foi criado vazio.");

  const { stdout } = await exec("ffprobe", [
    "-v", "error",
    "-show_entries", "stream=codec_type,width,height:format=duration",
    "-of", "json",
    outputPath
  ]);
  const metadata = JSON.parse(stdout);
  const video = metadata.streams.find((stream) => stream.codec_type === "video");
  if (!video || video.width !== 1080 || video.height !== 1920) {
    throw new Error("A saída não tem a resolução vertical 1080x1920 esperada.");
  }
  if (result.renderer !== "Remotion + FFmpeg") {
    throw new Error("O renderizador Remotion não foi usado.");
  }

  console.log("Renderização integrada aprovada:", JSON.stringify({
    bytes: output.size,
    width: video.width,
    height: video.height,
    duration: metadata.format.duration,
    renderer: result.renderer
  }));
} finally {
  await rm(tempDir, { recursive: true, force: true });
}
