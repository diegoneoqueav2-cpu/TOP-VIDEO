import React from "react";
import { Composition } from "remotion";
import { VideoComposition } from "./VideoComposition";

export const Root: React.FC = () => {
  return (
    <Composition
      id="Main"
      component={VideoComposition}
      durationInFrames={900}
      fps={30}
      width={1080}
      height={1920}
      defaultProps={{
        title: "SUA IDEIA EM MOVIMENTO",
        subtitle: "TOP VIDEO — editor inteligente",
        videoSrc: "",
      }}
    />
  );
};
