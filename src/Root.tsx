import React from "react";
import { Composition } from "remotion";
import { VideoComposition } from "./VideoComposition";
import { MotionDemo } from "./MotionDemo";
import { CowStory } from "./CowStory";
import { EditedVideo } from "./EditedVideo";

type EditedVideoProps = {
  durationInFrames: number;
  fps: number;
  width: number;
  height: number;
  captions: Array<{ text: string; startSeconds: number; endSeconds: number; style?: "white" | "white_yellow" | "green"; position?: "top" | "center" | "bottom" }>;
  graphics: Array<{ text: string; startSeconds: number; endSeconds: number; style?: "white" | "white_yellow" | "green"; position?: "top" | "center" | "bottom"; kind?: string }>;
};

export const Root: React.FC = () => {
  return (
    <>
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
      <Composition id="CowStory" component={CowStory} durationInFrames={360} fps={30} width={1080} height={1920} />
      <Composition
        id="MotionDemo"
        component={MotionDemo}
        durationInFrames={180}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="EditedVideo"
        component={EditedVideo}
        durationInFrames={900}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{
          durationInFrames: 900,
          fps: 30,
          width: 1080,
          height: 1920,
          captions: [],
          graphics: [],
        }}
        calculateMetadata={({ props }) => ({
          durationInFrames: props.durationInFrames,
          fps: props.fps,
          width: props.width,
          height: props.height,
        })}
      />
    </>
  );
};
