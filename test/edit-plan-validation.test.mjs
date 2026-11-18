import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { validateEditPlan } from "../server/edit-plan-validation.mjs";

const exec = promisify(execFile);
const schemaPath = path.resolve("schemas/edit-plan.schema.json");

function validPlan(duration = 2) {
  return {
    version: 1,
    aspectRatio: "9:16",
    fps: 30,
    source: { durationSeconds: duration },
    edits: [{ type: "keep", startSeconds: 0, endSeconds: duration }],
    captions: [],
    graphics: [],
    audio: { noiseReduction: false, music: "none", musicVolume: 0.15 },
    mode: "hybrid",
    analysis: { summary: "Vídeo de teste.", scenes: [{
      startSeconds: 0, endSeconds: duration, description: "Cena de teste.",
      visualElements: ["Cena sintética"], editingOpportunity: "Manter a cena."
    }] },
    assetSuggestions: []
  };
}

test("aceita plano ChatGPT válido sem precisar de chave de API", async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), "top-video-plan-test-"));
  const sourcePath = path.join(dir, "source.mp4");
  try {
    await exec("ffmpeg", ["-y", "-f", "lavfi", "-i", "color=c=green:s=320x568:d=2", "-an", "-pix_fmt", "yuv420p", sourcePath]);
    const result = await validateEditPlan({
      editPlan: validPlan(),
      schemaPath,
      sourcePath,
      expectedAspectRatio: "9:16"
    });
    assert.equal(result.resolution, "320x568");
    assert.equal(result.summary.includes("conferidos"), true);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("rejeita plano com formato diferente do pedido", async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), "top-video-plan-test-"));
  const sourcePath = path.join(dir, "source.mp4");
  try {
    await exec("ffmpeg", ["-y", "-f", "lavfi", "-i", "color=c=green:s=320x568:d=2", "-an", "-pix_fmt", "yuv420p", sourcePath]);
    await assert.rejects(
      validateEditPlan({
        editPlan: validPlan(),
        schemaPath,
        sourcePath,
        expectedAspectRatio: "16:9"
      }),
      /formato do plano/
    );
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("rejeita plano incompleto pelo schema", async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), "top-video-plan-test-"));
  const sourcePath = path.join(dir, "source.mp4");
  try {
    await exec("ffmpeg", ["-y", "-f", "lavfi", "-i", "color=c=green:s=320x568:d=2", "-an", "-pix_fmt", "yuv420p", sourcePath]);
    await assert.rejects(
      validateEditPlan({
        editPlan: { version: 1, mode: "hybrid" },
        schemaPath,
        sourcePath,
        expectedAspectRatio: "9:16"
      }),
      /Plano fora do schema/
    );
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
