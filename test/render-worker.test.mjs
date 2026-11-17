import test from "node:test";
import assert from "node:assert/strict";
import { buildKeptSegments } from "../server/render-worker.mjs";

test("mantém o vídeo inteiro quando não há cortes", () => {
  assert.deepEqual(buildKeptSegments([], 12), [
    { sourceStart: 0, sourceEnd: 12, outputStart: 0 }
  ]);
});

test("remove intervalos e recalcula o tempo de saída", () => {
  assert.deepEqual(buildKeptSegments([
    { type: "remove", startSeconds: 2, endSeconds: 4 },
    { type: "remove", startSeconds: 8, endSeconds: 10 }
  ], 12), [
    { sourceStart: 0, sourceEnd: 2, outputStart: 0 },
    { sourceStart: 4, sourceEnd: 8, outputStart: 2 },
    { sourceStart: 10, sourceEnd: 12, outputStart: 6 }
  ]);
});

test("usa somente os trechos explicitamente mantidos", () => {
  assert.deepEqual(buildKeptSegments([
    { type: "keep", startSeconds: 1, endSeconds: 3 },
    { type: "keep", startSeconds: 5, endSeconds: 7 }
  ], 9), [
    { sourceStart: 1, sourceEnd: 3, outputStart: 0 },
    { sourceStart: 5, sourceEnd: 7, outputStart: 2 }
  ]);
});

test("impede plano que elimina todo o vídeo", () => {
  assert.throws(() => buildKeptSegments([
    { type: "remove", startSeconds: 0, endSeconds: 10 }
  ], 10), /removeu todo o vídeo/);
});
