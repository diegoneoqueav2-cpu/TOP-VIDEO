import React from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const GREEN = "#087a35";
const DARK = "#064d27";

const Professor: React.FC<{ frame: number; active: number }> = ({ frame, active }) => {
  const sway = Math.sin(frame / 18) * 1.2;
  const armAngle = [-8, -1, 7, 14][Math.max(0, active)] ?? 0;
  return (
    <svg viewBox="0 0 470 1320" style={{ width: "100%", height: "100%", overflow: "visible" }}>
      <defs>
        <linearGradient id="vest" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor="#23834a" /><stop offset="1" stopColor="#064523" />
        </linearGradient>
        <linearGradient id="skin" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor="#ffd4a4" /><stop offset="1" stopColor="#d98b55" />
        </linearGradient>
        <linearGradient id="hair" x1="0" x2="0.8" y1="0" y2="1">
          <stop offset="0" stopColor="#fff" /><stop offset="1" stopColor="#c9c9c9" />
        </linearGradient>
        <filter id="softShadow" x="-30%" y="-30%" width="160%" height="170%">
          <feDropShadow dx="0" dy="16" stdDeviation="12" floodColor="#123d25" floodOpacity=".2" />
        </filter>
      </defs>
      <g transform={`rotate(${sway} 235 650)`} filter="url(#softShadow)">
        {/* legs and shoes */}
        <path d="M145 1000 L125 1190 Q120 1225 155 1230 L215 1230 L225 1198 L207 1000Z" fill="#9a7046" />
        <path d="M260 1000 L285 1185 Q290 1220 325 1220 L380 1210 L375 1180 L335 990Z" fill="#a47a50" />
        <path d="M118 1190 Q80 1200 80 1240 Q82 1270 190 1270 Q220 1265 210 1230 L160 1210Z" fill="#282a2b" />
        <path d="M286 1180 Q260 1205 275 1240 Q300 1270 405 1250 Q430 1235 390 1200 L340 1190Z" fill="#282a2b" />
        <path d="M90 1245 L198 1245 M286 1230 L400 1225" stroke="#f4f4f4" strokeWidth="9" strokeLinecap="round" />
        {/* torso */}
        <path d="M100 570 Q235 520 370 575 L395 1015 Q240 1080 75 1015Z" fill="#f2eee5" />
        <path d="M112 620 Q235 565 358 620 L365 1015 Q240 1065 90 1015Z" fill="url(#vest)" />
        <path d="M190 610 L235 690 L280 610" fill="none" stroke="#f4f0e8" strokeWidth="22" strokeLinejoin="round" />
        <path d="M235 700 L235 1000" stroke="#c4e0cc" strokeWidth="5" opacity=".7" />
        {/* left arm */}
        <path d="M112 670 Q55 760 85 900 Q95 935 135 915 L175 875 Q155 780 185 700Z" fill="url(#skin)" />
        {/* head and neck */}
        <path d="M195 510 L195 600 Q235 635 280 600 L275 510Z" fill="url(#skin)" />
        <ellipse cx="235" cy="330" rx="160" ry="190" fill="url(#skin)" />
        {/* ears */}
        <ellipse cx="78" cy="350" rx="35" ry="58" fill="#e7a474" />
        <ellipse cx="392" cy="350" rx="35" ry="58" fill="#e7a474" />
        {/* hair */}
        <path d="M78 345 Q40 190 155 135 Q220 75 310 120 Q420 130 400 300 Q370 230 330 220 Q245 175 180 220 Q125 245 78 345Z" fill="url(#hair)" stroke="#bcbcbc" strokeWidth="7" />
        <path d="M105 230 Q160 115 270 145 Q330 150 375 225 M90 275 Q110 170 205 125" fill="none" stroke="#fff" strokeWidth="15" strokeLinecap="round" opacity=".8" />
        {/* beard */}
        <path d="M100 390 Q125 480 185 520 Q235 585 290 520 Q355 480 370 390 Q350 490 235 505 Q125 490 100 390Z" fill="#f7f7f4" stroke="#d4d4d0" strokeWidth="6" />
        <path d="M145 455 Q235 525 325 455" fill="none" stroke="#deded9" strokeWidth="8" />
        {/* eyebrows */}
        <path d="M130 285 Q170 260 205 282 M265 282 Q305 260 340 285" stroke="#99918a" strokeWidth="13" strokeLinecap="round" fill="none" />
        {/* eyes */}
        <ellipse cx="175" cy="330" rx="22" ry="30" fill="#fff" /><ellipse cx="295" cy="330" rx="22" ry="30" fill="#fff" />
        <circle cx="180" cy="335" r="12" fill="#4b3020" /><circle cx="290" cy="335" r="12" fill="#4b3020" />
        <circle cx="184" cy="330" r="4" fill="#fff" /><circle cx="294" cy="330" r="4" fill="#fff" />
        {/* glasses */}
        <g fill="none" stroke="#262626" strokeWidth="12">
          <circle cx="175" cy="330" r="53" /><circle cx="295" cy="330" r="53" />
          <path d="M228 325 Q235 315 242 325 M122 315 L95 300 M348 315 L380 300" />
        </g>
        {/* nose and smile */}
        <path d="M230 345 Q205 390 235 397 Q258 400 267 383" fill="none" stroke="#bd7950" strokeWidth="9" strokeLinecap="round" />
        <path d="M185 440 Q235 470 285 438" fill="none" stroke="#7b4034" strokeWidth="10" strokeLinecap="round" />
        <path d="M198 443 Q235 458 273 443" fill="none" stroke="#fff" strokeWidth="9" strokeLinecap="round" />
        {/* pointing arm animated */}
        <g transform={`rotate(${armAngle} 320 690)`}>
          <path d="M335 675 Q390 625 405 555 L425 455 Q430 425 450 430 Q466 438 455 465 L440 550 Q430 660 385 745 L350 770Z" fill="url(#skin)" stroke="#c78355" strokeWidth="5" />
          <path d="M445 452 Q465 420 478 400 Q486 385 500 395 Q510 405 497 425 L465 475" fill="url(#skin)" stroke="#c78355" strokeWidth="5" strokeLinecap="round" />
          <path d="M430 545 Q465 555 475 580" fill="none" stroke="#c78355" strokeWidth="6" strokeLinecap="round" />
        </g>
      </g>
    </svg>
  );
};

const CameraIcon: React.FC = () => (
  <svg viewBox="0 0 220 150" width="190" height="130">
    <defs><linearGradient id="cam" x1="0" x2="1"><stop stopColor="#fff"/><stop offset="1" stopColor="#d8dce0"/></linearGradient></defs>
    <path d="M145 82 L205 105 L205 125 L140 110Z" fill="#b8bec4"/>
    <path d="M30 40 Q30 22 52 22 L172 22 Q190 22 190 42 L190 105 Q190 120 172 120 L48 120 Q30 120 30 102Z" fill="url(#cam)" stroke="#b5bbc0" strokeWidth="5"/>
    <path d="M30 42 L12 58 L12 96 L30 105Z" fill="#e6e9ec" stroke="#b5bbc0" strokeWidth="4"/>
    <circle cx="85" cy="72" r="36" fill="#30373b"/><circle cx="85" cy="72" r="25" fill="#101820"/><circle cx="85" cy="72" r="12" fill="#3f738a"/>
    {[0,1,2,3,4,5,6,7].map(i=><circle key={i} cx={85+29*Math.cos(i*Math.PI/4)} cy={72+29*Math.sin(i*Math.PI/4)} r="3.5" fill="#f3f4f5"/>)}
  </svg>
);

const items = [
  { text: "RESOLUÇÃO", sub: "Imagem nítida em cada detalhe", start: 18 },
  { text: "QUALIDADE\nÀ NOITE", sub: "Veja com clareza mesmo no escuro", start: 72 },
  { text: "ÂNGULO DE VISÃO", sub: "Mais área monitorada", start: 126 },
  { text: "RECURSOS DE CADA\nMODELO", sub: "A escolha certa para cada necessidade", start: 180 },
];

export const ProfessorSpecs: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const active = items.reduce((n, item, i) => frame >= item.start ? i : n, -1);

  return (
    <AbsoluteFill style={{ backgroundColor: "#fff", fontFamily: "Arial, sans-serif", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: 34, right: 35, opacity: 0.98 }}>
        <CameraIcon />
      </div>
      <div style={{ position: "absolute", top: 75, left: 54, color: GREEN, fontSize: 25, fontWeight: 900, letterSpacing: 5 }}>
        TOP IP • GUIA DE CÂMERAS
      </div>
      <div style={{ position: "absolute", left: -28, bottom: 20, width: 500, height: 1370 }}>
        <Professor frame={frame} active={Math.max(0, active)} />
      </div>
      <div style={{ position: "absolute", top: 310, right: 42, width: 575, display: "flex", flexDirection: "column", gap: 32 }}>
        {items.map((item, i) => {
          const progress = spring({ frame: frame - item.start, fps, config: { damping: 15, stiffness: 120, mass: 0.8 } });
          const opacity = interpolate(frame, [item.start, item.start + 12], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          const y = interpolate(progress, [0, 1], [65, 0]);
          const isActive = active === i;
          return (
            <div key={item.text} style={{
              opacity,
              transform: `translateY(${y}px) scale(${isActive ? 1.025 : 1})`,
              background: "#fff",
              border: `2px solid ${isActive ? "#a7d9b7" : "#e4eee7"}`,
              borderRadius: 22,
              padding: "22px 24px 18px",
              boxShadow: isActive ? "0 12px 30px rgba(0,100,45,.16)" : "0 7px 18px rgba(0,70,30,.07)",
            }}>
              <div style={{ color: GREEN, fontSize: 43, lineHeight: 1.02, fontWeight: 900, letterSpacing: -1, whiteSpace: "pre-line", textShadow: "0 3px 0 #d8eadf" }}>{item.text}</div>
              <div style={{ marginTop: 12, color: "#486353", fontSize: 19, fontWeight: 600 }}>{item.sub}</div>
              <div style={{ marginTop: 13, height: 5, width: 105, borderRadius: 10, background: "#91cf9e" }} />
            </div>
          );
        })}
      </div>
      <div style={{ position: "absolute", bottom: 55, right: 55, color: "#6d8b77", fontSize: 18, fontWeight: 700, letterSpacing: 2 }}>
        SEGURANÇA COMEÇA COM A ESCOLHA CERTA
      </div>
    </AbsoluteFill>
  );
};
