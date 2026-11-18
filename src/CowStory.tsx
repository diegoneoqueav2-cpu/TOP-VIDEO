import React from "react";
import { AbsoluteFill, Audio, Easing, interpolate, staticFile, useCurrentFrame } from "remotion";

const clamp = { extrapolateLeft: "clamp" as const, extrapolateRight: "clamp" as const };

// Ilustração vetorial 2D em perfil lateral. A mesma vaca é usada do começo ao fim.
const Cow: React.FC<{ frame: number; small?: boolean }> = ({ frame, small = false }) => {
  const walkOn = frame < 188 ? 1 : 0;
  const stride = Math.sin(frame / 3.1) * 24 * walkOn;
  const strideBack = Math.sin(frame / 3.1 + Math.PI) * 24 * walkOn;
  const bob = Math.abs(Math.sin(frame / 3.1)) * 7 * walkOn;
  const tail = Math.sin(frame / 5) * 18;
  const x = interpolate(frame, [0, 178, 210, 360], [-270, 70, 70, 70], clamp);
  const scale = small ? 0.62 : 1;
  return (
    <div style={{ position: "absolute", left: "50%", top: small ? "57%" : "51%", width: 620, height: 390,
      transform: `translate(-50%,-50%) translateX(${x}px) scale(${scale}) translateY(${bob}px)` }}>
      <svg width="620" height="390" viewBox="0 0 620 390" style={{ overflow: "visible" }}>
        <ellipse cx="310" cy="354" rx="235" ry="17" fill="#234b35" opacity=".14"/>
        {/* pernas do lado de trás */}
        <g stroke="#273b32" strokeWidth="10" strokeLinecap="round">
          <g transform={`rotate(${strideBack} 205 270)`}><path d="M205 255 L195 340" fill="none"/><path d="M177 342 Q195 350 213 341 L213 354 L177 354Z" fill="#e9b2a5"/></g>
          <g transform={`rotate(${stride} 285 270)`}><path d="M285 255 L295 340" fill="none"/><path d="M278 342 Q296 350 313 341 L313 354 L278 354Z" fill="#e9b2a5"/></g>
        </g>
        {/* corpo */}
        <path d="M118 130 C135 82 218 65 326 78 C405 86 444 130 447 205 C450 269 395 302 294 302 L174 292 C112 278 86 223 96 174Z"
          fill="#fffaf0" stroke="#273b32" strokeWidth="11" strokeLinejoin="round"/>
        {/* manchas */}
        <path d="M155 119 C185 91 235 104 239 139 C243 172 206 191 172 179 C145 169 135 141 155 119Z" fill="#273b32"/>
        <path d="M300 205 C322 174 375 177 393 207 C411 237 384 268 346 267 C311 266 284 236 300 205Z" fill="#273b32"/>
        <path d="M392 105 C421 110 440 138 440 166 C416 172 394 157 385 137Z" fill="#273b32"/>
        {/* pescoço e cabeça de perfil */}
        <path d="M393 132 C431 102 473 105 505 129 C532 151 532 207 506 235 C482 261 439 251 416 224Z"
          fill="#fffaf0" stroke="#273b32" strokeWidth="11"/>
        <path d="M473 190 C510 174 553 184 568 208 C582 232 563 259 533 262 L477 248 C457 236 455 205 473 190Z"
          fill="#f1aaa3" stroke="#273b32" strokeWidth="10"/>
        <ellipse cx="542" cy="222" rx="7" ry="9" fill="#273b32"/>
        <ellipse cx="570" cy="222" rx="6" ry="8" fill="#273b32"/>
        {/* olho e sobrancelha */}
        <ellipse cx="484" cy="157" rx="9" ry="14" fill="#273b32"/>
        <circle cx="487" cy="153" r="3" fill="#fff"/>
        <path d="M470 133 Q485 123 499 132" fill="none" stroke="#273b32" strokeWidth="6" strokeLinecap="round"/>
        {/* orelha, chifre e topete */}
        <path d="M438 126 Q405 91 379 112 Q389 144 431 151Z" fill="#f0b0a7" stroke="#273b32" strokeWidth="9"/>
        <path d="M460 116 Q448 76 468 59 Q485 84 479 119Z" fill="#f3d7a0" stroke="#273b32" strokeWidth="8"/>
        <path d="M497 124 Q516 91 541 105 Q532 133 505 145Z" fill="#f0b0a7" stroke="#273b32" strokeWidth="8"/>
        {/* cauda animada */}
        <path d={`M111 151 Q72 130 61 ${105 + tail} Q49 ${83 + tail} 32 ${95 + tail}`} fill="none" stroke="#273b32" strokeWidth="9" strokeLinecap="round"/>
        <path d={`M34 ${94 + tail} Q13 ${82 + tail} 10 ${110 + tail} Q28 ${119 + tail} 40 ${102 + tail}Z`} fill="#273b32"/>
        {/* pernas da frente */}
        <g stroke="#273b32" strokeWidth="10" strokeLinecap="round">
          <g transform={`rotate(${stride} 400 270)`}><path d="M400 260 L390 340" fill="none"/><path d="M371 342 Q390 350 408 341 L408 354 L371 354Z" fill="#e9b2a5"/></g>
          <g transform={`rotate(${strideBack} 448 264)`}><path d="M448 252 L459 340" fill="none"/><path d="M441 342 Q460 350 477 341 L477 354 L441 354Z" fill="#e9b2a5"/></g>
        </g>
      </svg>
    </div>
  );
};

export const CowStory: React.FC = () => {
  const f = useCurrentFrame();
  const scene = (a: number, b: number) => interpolate(f, [a, a + 12, b - 12, b], [0, 1, 1, 0], clamp);
  const pop = interpolate(f, [0, 18, 30], [.75, 1.05, 1], { ...clamp, easing: Easing.out(Easing.back(1.5)) });
  const blast = interpolate(f, [198, 207, 229, 252], [0, 1, 1, 0], clamp);
  const endScale = interpolate(f, [270, 294], [.75, 1], { ...clamp, easing: Easing.out(Easing.back(1.2)) });
  const shake = f > 198 && f < 245 ? Math.sin(f * 1.7) * 8 : 0;
  return (
    <AbsoluteFill style={{ background: "linear-gradient(180deg,#b9e9ff 0%,#e8f7df 57%,#8bd078 57%,#4b9f58 100%)", fontFamily: "Arial, sans-serif", overflow: "hidden" }}>
      <Audio src={staticFile("audio/vaca-vitoria-narracao.wav")} volume={1}/>
      <Audio src={staticFile("audio/vaca-vitoria-musica.wav")} volume={0.16}/>
      <div style={{ position:"absolute", top:105, left:0, right:0, textAlign:"center", fontSize:25, fontWeight:800, letterSpacing:6, color:"#286846" }}>UMA HISTÓRIA BEM CURTINHA</div>
      <div style={{ position:"absolute", top:230, left:"8%", width:150, height:48, borderRadius:50, background:"rgba(255,255,255,.78)" }}/>
      <div style={{ position:"absolute", top:260, right:"10%", width:190, height:56, borderRadius:50, background:"rgba(255,255,255,.78)" }}/>
      <div style={{ position:"absolute", bottom:390, left:-80, width:1250, height:100, borderRadius:"50%", background:"#65b95e" }}/>
      <div style={{ position:"absolute", bottom:295, left:0, right:0, textAlign:"center", opacity:scene(0,105), transform:`scale(${pop})` }}>
        <div style={{ fontSize:68, fontWeight:900, color:"#174c32", textShadow:"0 4px #fff" }}>ERA UMA VEZ...</div>
      </div>
      <Cow frame={f}/>
      <div style={{ position:"absolute", top:320, left:0, right:0, textAlign:"center", opacity:scene(92,190) }}>
        <div style={{ display:"inline-block", padding:"18px 32px", background:"#fff", borderRadius:28, border:"5px solid #24563a", fontSize:52, fontWeight:900, color:"#24563a", boxShadow:"0 10px 0 rgba(28,76,48,.16)" }}>VACA VITÓRIA</div>
      </div>
      <div style={{ position:"absolute", top:280, left:"56%", opacity:blast, transform:`translateX(${shake}px) scale(${.6+blast*.4})`, background:"#fff", border:"5px solid #24563a", borderRadius:28, padding:"16px 24px", fontSize:34, fontWeight:900, color:"#24563a" }}>PRRRRT! 💨</div>
      <div style={{ position:"absolute", left:"38%", top:"43%", fontSize:190, opacity:blast, transform:`translate(${blast*75}px,-${blast*45}px) rotate(-18deg) scale(${blast})`, filter:"drop-shadow(0 8px 0 rgba(255,255,255,.7))" }}>💥</div>
      <div style={{ position:"absolute", left:"48%", top:"57%", fontSize:115, opacity:blast, transform:`translateX(${blast*125}px) scale(${blast})` }}>💨</div>
      <div style={{ position:"absolute", bottom:260, left:0, right:0, textAlign:"center", fontSize:64, fontWeight:900, color:"#fff", textShadow:"0 5px 0 #24563a", opacity:scene(185,270) }}>SOLTOU UM PEIDO!</div>
      {/* Cena final separada: a mesma personagem reaparece menor num cartão de encerramento. */}
      <div style={{ position:"absolute", inset:0, background:"linear-gradient(160deg,#fff3c7,#d8f4d1)", opacity:scene(270,360) }}/>
      <div style={{ position:"absolute", top:210, left:0, right:0, textAlign:"center", fontSize:28, fontWeight:800, letterSpacing:5, color:"#34734a", opacity:scene(275,360) }}>E FOI ASSIM QUE...</div>
      <div style={{ position:"absolute", top:330, left:0, right:0, textAlign:"center", fontSize:76, fontWeight:1000, color:"#24563a", textShadow:"0 5px #fff", opacity:scene(275,360), transform:`scale(${endScale})` }}>ACABOU A HISTÓRIA!</div>
      <div style={{ position:"absolute", bottom:145, left:0, right:0, textAlign:"center", fontSize:46, fontWeight:900, color:"#fff", textShadow:"0 4px #24563a", opacity:interpolate(f,[322,345],[0,1],clamp) }}>FIM. 🐮</div>
      <div style={{ position:"absolute", bottom:35, left:0, right:0, textAlign:"center", fontSize:18, fontWeight:700, color:"#34734a", letterSpacing:4, opacity:interpolate(f,[330,355],[0,1],clamp) }}>UMA HISTÓRIA DA VACA VITÓRIA</div>
    </AbsoluteFill>
  );
};
