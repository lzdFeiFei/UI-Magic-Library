"use client";

import grainUrl from "./grain.webp";

type Props = {
  config: Record<string, string | number | boolean>;
};

export default function GrainyGradientDemo({ config }: Props) {
  const colorA = typeof config.colorA === "string" ? config.colorA : "#7c3aed";
  const colorB = typeof config.colorB === "string" ? config.colorB : "#182fff";
  const noiseSize = typeof config.noiseSize === "number" ? config.noiseSize : 500;
  const noiseOpacity = typeof config.noiseOpacity === "number" ? config.noiseOpacity : 1;
  const noiseBrightness = typeof config.noiseBrightness === "number" ? config.noiseBrightness : 3;

  return (
    <div className="demo-stage">
      <div
        className="grainy-card"
        style={{
          background: `linear-gradient(135deg, ${colorA}, ${colorB})`,
          boxShadow: "0 8px 32px rgba(31, 38, 135, 0.5)",
        }}
      >
        <div
          className="grainy-overlay"
          style={{
            backgroundImage: `url(${grainUrl.src})`,
            backgroundSize: `${noiseSize}px ${noiseSize}px`,
            opacity: noiseOpacity,
            filter: `brightness(${noiseBrightness})`,
          }}
        />
        <span className="grainy-label">Content</span>
      </div>
    </div>
  );
}
