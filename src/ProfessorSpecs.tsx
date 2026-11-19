import React from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const GREEN = "#39ff82";
const ITEMS = [
  { text: "RESOLUÇÃO", start: 12, x: 95, y: 300 },
  { text: "QUALIDADE À NOITE", start: 57, x: 145, y: 635 },
  { text: "ÂNGULO DE VISÃO", start: 102, x: 195, y: 970 },
  { text: "RECURSOS DE CADA MODELO", start: 147, x: 145, y: 1305 },
];

const NeonTitle: React.FC<{
  text: string;
  start: number;
  x: number;
  y: number;
}> = ({ text, start, x, y }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const localFrame = frame - start;
  const progress = spring({
    frame: localFrame,
    fps,
    config: { damping: 17, stiffness: 105, mass: 0.85 },
  });

  const opacity = interpolate(localFrame, [0, 9], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const rise = interpolate(progress, [0, 1], [125, 0]);
  const scale = interpolate(progress, [0, 1], [0.92, 1]);

  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: 840,
        height: 190,
        boxSizing: "border-box",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px 34px",
        border: "3px solid rgba(57,255,130,0.98)",
        borderRadius: 24,
        background: "rgba(4, 28, 15, 0.96)",
        opacity,
        transform: `translateY(${rise}px) scale(${scale})`,
        boxShadow: [
          "0 0 8px rgba(57,255,130,.95)",
          "0 0 22px rgba(57,255,130,.55)",
          "inset 0 0 18px rgba(57,255,130,.12)",
          "0 13px 0 rgba(0,65,29,.95)",
          "0 22px 35px rgba(0,0,0,.32)",
        ].join(", "),
      }}
    >
      <div
        style={{
          width: "100%",
          color: "#ffffff",
          textAlign: "center",
          fontFamily: "Arial, Helvetica, sans-serif",
          fontSize: text.length > 20 ? 49 : 59,
          fontWeight: 900,
          letterSpacing: text.length > 20 ? 0 : 1.5,
          lineHeight: 1.08,
          whiteSpace: "normal",
          textShadow: [
            "0 2px 0 #b9ffd0",
            "0 4px 0 #247a45",
            "0 7px 0 #123d25",
            "0 0 12px rgba(255,255,255,.28)",
          ].join(", "),
        }}
      >
        {text}
      </div>
    </div>
  );
};

export const ProfessorSpecs: React.FC = () => {
  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#041b10",
        overflow: "hidden",
      }}
    >
      {ITEMS.map((item) => (
        <NeonTitle key={item.text} {...item} />
      ))}
    </AbsoluteFill>
  );
};
