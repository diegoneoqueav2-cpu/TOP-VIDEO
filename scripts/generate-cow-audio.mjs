import { mkdir, writeFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";

const dir = "public/audio";
await mkdir(dir, { recursive: true });
execFileSync("espeak-ng", [
  "-v", "pt-br", "-s", "142", "-p", "48", "-a", "185",
  "-w", `${dir}/vaca-vitoria-narracao.wav`,
  "Era uma vez uma vaca Vitória... Soltou um peido! ... Acabou a história!"
]);

// Trilha instrumental original, alegre e simples, sintetizada em PCM WAV.
const rate = 44100;
const seconds = 12;
const samples = new Int16Array(rate * seconds);
const notes = [523.25,659.25,783.99,659.25,587.33,698.46,880,698.46,523.25,659.25,783.99,1046.5];
const beat = 0.5;
for (let i=0; i<samples.length; i++) {
  const t=i/rate;
  const noteIndex=Math.floor(t/beat)%notes.length;
  const local=t%beat;
  const envelope=Math.min(1,local*18)*Math.min(1,(beat-local)*8);
  const melody=Math.sin(2*Math.PI*notes[noteIndex]*t);
  const bass=Math.sin(2*Math.PI*(notes[noteIndex]/2)*t)*0.35;
  const pluck=Math.sin(2*Math.PI*notes[noteIndex]*2*t)*0.12;
  samples[i]=Math.max(-32768,Math.min(32767,(melody+bass+pluck)*envelope*3600));
}
const header=Buffer.alloc(44);
header.write("RIFF",0); header.writeUInt32LE(36+samples.length*2,4);
header.write("WAVE",8); header.write("fmt ",12); header.writeUInt32LE(16,16);
header.writeUInt16LE(1,20); header.writeUInt16LE(1,22);
header.writeUInt32LE(rate,24); header.writeUInt32LE(rate*2,28);
header.writeUInt16LE(2,32); header.writeUInt16LE(16,34);
header.write("data",36); header.writeUInt32LE(samples.length*2,40);
await writeFile(`${dir}/vaca-vitoria-musica.wav`, Buffer.concat([header,Buffer.from(samples.buffer)]));
console.log("Áudios da Vaca Vitória criados.");
