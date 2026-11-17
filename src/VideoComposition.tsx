import React from "react";
import {
  AbsoluteFill,
  OffthreadVideo,
  Sequence,
  useCurrentFrame,
  interpolate,
} from "remotion";

type Props = {
  title: string;
  subtitle: string;
  videoSrc: string;
};

export const VideoComposition: React.FC<Props> = ({
  title,
  subtitle,
  videoSrc,
}) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 18, 100, 130], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const titleY = interpolate(frame, [0, 24], [35, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ backgroundColor: "#101812", fontFamily: "Arial, sans-serif" }}>
      {videoSrc ? (
        <OffthreadVideo
          src={videoSrc}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      ) : (
        <AbsoluteFill
          style={{
            background: "linear-gradient(145deg, #10251a 0%, #07110b 100%)",
            justifyContent: "center",
            alignItems: "center",
          }}
        />
      )}
      <AbsoluteFill
        style={{
          background: "linear-gradient(180deg, rgba(0,0,0,.45) 0%, transparent 38%, transparent 65%, rgba(0,0,0,.55) 100%)",
        }}
      />
      <Sequence from={0} durationInFrames={150}>
        <AbsoluteFill
          style={{
            justifyContent: "flex-start",
            alignItems: "center",
            padding: "150px 72px 0",
            opacity,
            transform: `translateY(${titleY}px)`,
          }}
        >
          <div
            style={{
              color: "white",
              fontSize: 68,
              fontWeight: 800,
              lineHeight: 1.08,
              textAlign: "center",
              textShadow: "0 4px 18px rgba(0,0,0,.45)",
              maxWidth: 900,
            }}
          >
            {title}
          </div>
          <div
            style={{
              marginTop: 24,
              color: "#8BE0A5",
              fontSize: 34,
              fontWeight: 600,
              textAlign: "center",
              textShadow: "0 3px 12px rgba(0,0,0,.5)",
            }}
          >
            {subtitle}
          </div>
        </AbsoluteFill>
      </Sequence>
    </AbsoluteFill>
  );
};
