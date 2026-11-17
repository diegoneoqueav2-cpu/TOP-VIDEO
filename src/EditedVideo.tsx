import React from "react";
import {
  AbsoluteFill,
  OffthreadVideo,
  interpolate,
  staticFile,
  useCurrentFrame,
} from "remotion";

type TimedText = {
  text: string;
  startSeconds: number;
  endSeconds: number;
  style?: "white" | "white_yellow" | "green";
  position?: "top" | "center" | "bottom";
  kind?: string;
};

type Props = {
  durationInFrames: number;
  fps: number;
  width: number;
  height: number;
  captions: TimedText[];
  graphics: TimedText[];
};

const AnimatedText: React.FC<{ item: TimedText; fps: number; width: number; caption?: boolean }> = ({
  item, fps, width, caption = false,
}) => {
  const frame = useCurrentFrame();
  const start = Math.max(0, Math.round(item.startSeconds * fps));
  const end = Math.max(start + 1, Math.round(item.endSeconds * fps));
  const opacity = interpolate(frame, [start, start + 6, end - 6, end], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const position = item.position || (caption ? "bottom" : "center");
  const color = item.style === "green" ? "#8BE0A5" : item.style === "white_yellow" ? "#FFD84D" : "#FFFFFF";
  const fontSize = Math.round(width * (caption ? 0.043 : item.kind === "title" ? 0.065 : 0.05));

  return (
    <div style={{
      position: "absolute",
      left: "7%",
      right: "7%",
      top: position === "top" ? "12%" : position === "center" ? "43%" : undefined,
      bottom: position === "bottom" ? (caption ? "12%" : "20%") : undefined,
      display: "flex",
      justifyContent: "center",
      opacity,
      transform: `translateY(${interpolate(frame, [start, start + 8], [18, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })}px)`,
    }}>
      <div style={{
        color,
        fontSize,
        fontWeight: 800,
        lineHeight: 1.12,
        textAlign: "center",
        padding: caption ? "12px 22px" : "18px 28px",
        borderRadius: 16,
        backgroundColor: caption ? "rgba(0,0,0,.58)" : "rgba(5,22,12,.68)",
        textShadow: "0 3px 12px rgba(0,0,0,.55)",
        borderBottom: caption ? "none" : "4px solid #45B96B",
        maxWidth: "100%",
      }}>{item.text}</div>
    </div>
  );
};

export const EditedVideo: React.FC<Props> = ({
  durationInFrames, fps, width, height, captions, graphics,
}) => (
  <AbsoluteFill style={{ backgroundColor: "#050b07", overflow: "hidden" }}>
    <OffthreadVideo
      src={staticFile("intermediate.mp4")}
      muted={false}
      style={{ width: "100%", height: "100%", objectFit: "cover" }}
    />
    {captions.map((item, index) => (
      <AnimatedText key={`caption-${index}`} item={item} fps={fps} width={width} caption />
    ))}
    {graphics.map((item, index) => (
      <AnimatedText key={`graphic-${index}`} item={item} fps={fps} width={width} />
    ))}
  </AbsoluteFill>
);
