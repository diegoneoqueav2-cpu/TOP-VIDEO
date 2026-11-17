import React from "react";
import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  Easing,
} from "remotion";

const CubeFace: React.FC<{
  label: string;
  transform: string;
  background: string;
}> = ({ label, transform, background }) => (
  <div
    style={{
      position: "absolute",
      inset: 0,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      backfaceVisibility: "hidden",
      transform,
      background,
      border: "2px solid rgba(255,255,255,.65)",
      color: "#ffffff",
      fontSize: 34,
      fontWeight: 800,
      letterSpacing: 5,
      boxShadow: "inset 0 0 45px rgba(255,255,255,.12)",
    }}
  >
    {label}
  </div>
);

export const MotionDemo: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / 30;

  const titleOpacity = interpolate(frame, [0, 18, 105, 132], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const titleY = interpolate(frame, [0, 24], [55, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  const cubeRotationY = interpolate(frame, [0, 180], [-28, 332], {
    extrapolateRight: "extend",
  });
  const cubeRotationX = interpolate(frame, [0, 180], [18, 378], {
    extrapolateRight: "extend",
  });
  const cubeScale = interpolate(frame, [0, 30, 180], [0.65, 1, 1.12], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const orbit = interpolate(frame, [0, 180], [0, 360]);

  return (
    <AbsoluteFill
      style={{
        background: "radial-gradient(circle at 50% 43%, #183c29 0%, #0b1d13 48%, #050b07 100%)",
        color: "white",
        fontFamily: "Arial, sans-serif",
        overflow: "hidden",
      }}
    >
      {/* Soft animated 2D background shapes */}
      <div
        style={{
          position: "absolute",
          width: 760,
          height: 760,
          borderRadius: "50%",
          border: "2px solid rgba(117,236,157,.16)",
          left: "50%",
          top: "43%",
          transform: `translate(-50%, -50%) rotate(${orbit}deg) scale(.9)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          width: 570,
          height: 570,
          borderRadius: "50%",
          border: "1px solid rgba(117,236,157,.22)",
          left: "50%",
          top: "43%",
          transform: `translate(-50%, -50%) rotate(-${orbit * 0.7}deg) scale(1.08)`,
        }}
      />

      {/* Animated 2D accent strokes */}
      {[0, 1, 2, 3].map((item) => {
        const x = 110 + item * 245;
        const rise = interpolate((frame + item * 17) % 90, [0, 90], [70, -70]);
        return (
          <div
            key={item}
            style={{
              position: "absolute",
              left: x,
              top: 780 + rise,
              width: 7,
              height: 110,
              borderRadius: 20,
              background: "linear-gradient(180deg, transparent, #7bea9e, transparent)",
              opacity: 0.55,
              transform: `rotate(${item % 2 ? 18 : -18}deg)`,
            }}
          />
        );
      })}

      {/* 3D cube built with CSS perspective and six faces */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "43%",
          width: 270,
          height: 270,
          perspective: 1000,
          transform: "translate(-50%, -50%)",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            transformStyle: "preserve-3d",
            transform: `scale(${cubeScale}) rotateX(${cubeRotationX}deg) rotateY(${cubeRotationY}deg)`,
          }}
        >
          <CubeFace label="TOP" transform="translateZ(135px)" background="linear-gradient(135deg,#38b96b,#126438)" />
          <CubeFace label="VIDEO" transform="rotateY(180deg) translateZ(135px)" background="linear-gradient(135deg,#1d8a4d,#0b3d26)" />
          <CubeFace label="MOTION" transform="rotateY(90deg) translateZ(135px)" background="linear-gradient(135deg,#64d98b,#16814a)" />
          <CubeFace label="IA" transform="rotateY(-90deg) translateZ(135px)" background="linear-gradient(135deg,#247e4b,#0b2919)" />
          <CubeFace label="CREATE" transform="rotateX(90deg) translateZ(135px)" background="linear-gradient(135deg,#3da96a,#145332)" />
          <CubeFace label="EDIT" transform="rotateX(-90deg) translateZ(135px)" background="linear-gradient(135deg,#1b7040,#092617)" />
        </div>
      </div>

      {/* Main 2D typography */}
      <div
        style={{
          position: "absolute",
          top: 145,
          left: 70,
          right: 70,
          textAlign: "center",
          opacity: titleOpacity,
          transform: `translateY(${titleY}px)`,
        }}
      >
        <div
          style={{
            color: "#8beaab",
            fontSize: 25,
            fontWeight: 700,
            letterSpacing: 10,
            marginBottom: 25,
          }}
        >
          SEU ESTÚDIO CRIATIVO
        </div>
        <div
          style={{
            fontSize: 82,
            lineHeight: 0.98,
            fontWeight: 900,
            letterSpacing: -3,
            textShadow: "0 10px 35px rgba(0,0,0,.35)",
          }}
        >
          IDEIAS EM
          <br />
          <span style={{ color: "#7bea9e" }}>MOVIMENTO.</span>
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          bottom: 205,
          left: 90,
          right: 90,
          textAlign: "center",
          opacity: interpolate(frame, [35, 55, 180], [0, 1, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
        }}
      >
        <div style={{ fontSize: 31, color: "#e5f6eb", letterSpacing: 2 }}>
          CRIAÇÃO 2D • PROFUNDIDADE 3D
        </div>
        <div style={{ marginTop: 18, fontSize: 24, color: "#8beaab" }}>
          TOP VIDEO — ANIMAÇÃO EM AÇÃO
        </div>
      </div>
    </AbsoluteFill>
  );
};
