import {mkdir} from "node:fs/promises";
import {execFileSync} from "node:child_process";
await mkdir("public/audio",{recursive:true});
const text="Você sabia que tem câmera que parece até fofoqueira? O sujeito entra na loja achando que ninguém tá vendo... Mas olha só! Não dá nem pra pegar um bolinho na geladeira! E o funcionário? Acho que meu patrão me viu dormindo... Será? Câmera fofoqueira é assim: vê tudo! Proteja sua loja e monitore cada detalhe.";
execFileSync("python3",["-m","edge_tts","--voice","pt-BR-FranciscaNeural","--rate","+7%","--pitch","+1Hz","--text",text,"--write-media","public/audio/camera-fofoqueira.mp3"]);
execFileSync("ffmpeg",["-y","-i","public/audio/camera-fofoqueira.mp3","-af","loudnorm=I=-16:TP=-1.5:LRA=11","public/audio/camera-fofoqueira.wav"]);
console.log("Narração pt-BR criada.");
