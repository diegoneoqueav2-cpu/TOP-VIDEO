import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const GREEN = "#39ff82";
const ITEMS = [
  { text: "RESOLUÇÃO", start: 42 },
  { text: "QUALIDADE À NOITE", start: 82 },
  { text: "ÂNGULO DE VISÃO", start: 122 },
  { text: "RECURSOS DE CADA MODELO", start: 162 },
];

const CameraReveal: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({
    frame: frame - 2,
    fps,
    config: { damping: 11, stiffness: 115, mass: 0.7 },
  });
  const opacity = interpolate(frame, [0, 8, 22], [0, 1, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const scale = interpolate(p, [0, 1], [0.25, 1]);
  const rotate = interpolate(p, [0, 1], [-18, 0]);
  const glow = interpolate(frame, [8, 20, 32], [0, 1, 0.45], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <div style={{
      position: "absolute", top: 95, left: 390, width: 300, height: 205,
      opacity, transform: `scale(${scale}) rotate(${rotate}deg)`,
      filter: `drop-shadow(0 0 ${12 + glow * 22}px rgba(57,255,130,${0.35 + glow * 0.55}))`,
    }}>
      <svg viewBox="0 0 300 205" width="100%" height="100%">
        <defs>
          <linearGradient id="cameraBody" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#ffffff"/>
            <stop offset="1" stopColor="#b9c9bf"/>
          </linearGradient>
          <linearGradient id="lens" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#6de5ff"/>
            <stop offset=".45" stopColor="#173d50"/>
            <stop offset="1" stopColor="#07151d"/>
          </linearGradient>
        </defs>
        <path d="M60 70 L25 92 L25 145 L62 158Z" fill="#d5e0d9" stroke={GREEN} strokeWidth="5"/>
        <rect x="52" y="48" width="190" height="112" rx="25" fill="url(#cameraBody)" stroke={GREEN} strokeWidth="6"/>
        <path d="M85 48 L105 25 L174 25 L195 48" fill="#dce7df" stroke={GREEN} strokeWidth="5" strokeLinejoin="round"/>
        <circle cx="143" cy="104" r="48" fill="#10251b" stroke="#effff4" strokeWidth="7"/>
        <circle cx="143" cy="104" r="36" fill="url(#lens)" stroke={GREEN} strokeWidth="4"/>
        <circle cx="132" cy="91" r="10" fill="#fff" opacity=".65"/>
        <circle cx="143" cy="104" r="13" fill="#07151d"/>
        <circle cx="215" cy="68" r="7" fill={GREEN}/>
        <path d="M82 173 L230 173" stroke={GREEN} strokeWidth="5" strokeLinecap="round"/>
      </svg>
    </div>
  );
};

const NeonTitle: React.FC<{ text: string; start: number; index: number }> = ({ text, start, index }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const localFrame = frame - start;
  const progress = spring({
    frame: localFrame,
    fps,
    config: { damping: 16, stiffness: 105, mass: 0.8 },
  });
  const opacity = interpolate(localFrame, [0, 9], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const rise = interpolate(progress, [0, 1], [100, 0]);
  const scale = interpolate(progress, [0, 1], [0.94, 1]);
  const top = 390 + index * 315;

  return (
    <div style={{
      position: "absolute",
      left: 105,
      top,
      width: 870,
      height: 190,
      boxSizing: "border-box",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "22px 30px",
      border: "3px solid rgba(57,255,130,.98)",
      borderRadius: 22,
      background: "rgba(4,28,15,.97)",
      opacity,
      transform: `translateY(${rise}px) scale(${scale})`,
      boxShadow: "0 0 9px rgba(57,255,130,.95), 0 0 25px rgba(57,255,130,.55), inset 0 0 18px rgba(57,255,130,.13), 0 12px 0 rgba(0,65,29,.95), 0 22px 34px rgba(0,0,0,.3)",
    }}>
      <div style={{
        width: "100%",
        color: "#fff",
        textAlign: "center",
        fontFamily: "Arial, Helvetica, sans-serif",
        fontSize: text.length > 20 ? 47 : text.length > 15 ? 53 : 61,
        fontWeight: 900,
        letterSpacing: 1,
        lineHeight: 1.08,
        textShadow: "0 2px 0 #b9ffd0, 0 4px 0 #247a45, 0 7px 0 #123d25, 0 0 12px rgba(255,255,255,.28)",
      }}>{text}</div>
    </div>
  );
};

export const ProfessorSpecs: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#041b10", overflow: "hidden" }}>
      <CameraReveal />
      {ITEMS.map((item, index) => (
        <NeonTitle key={item.text} text={item.text} start={item.start} index={index} />
      ))}
    </AbsoluteFill>
  );
};
