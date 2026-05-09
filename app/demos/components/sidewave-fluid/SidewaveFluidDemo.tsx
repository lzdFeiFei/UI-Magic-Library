"use client";

import { useEffect, useMemo, useRef } from "react";
import webGLFluidSimulation from "webgl-fluid";

type Props = {
  config: Record<string, string | number | boolean>;
};

const svgBackground = `
<svg width="1920" height="1080" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#df72d4" />
      <stop offset="50%" stop-color="#f091de" />
      <stop offset="100%" stop-color="#e274d4" />
    </linearGradient>
    <filter id="glow1" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="30" result="blur" />
      <feMerge>
        <feMergeNode in="blur" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
    <filter id="glow2" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="15" result="blur" />
      <feMerge>
        <feMergeNode in="blur" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
  </defs>
  <rect width="1920" height="1080" fill="url(#bg)" />
  <g>
    <rect x="-100" y="250" width="2120" height="40" fill="#ffffff" opacity="0.9" filter="url(#glow1)" />
    <rect x="-100" y="260" width="2120" height="20" fill="#ffffff" opacity="1" filter="url(#glow2)" />
    <rect x="-100" y="450" width="2120" height="25" fill="#ffffff" opacity="0.7" filter="url(#glow1)" />
    <rect x="-100" y="455" width="2120" height="10" fill="#ffffff" opacity="0.9" filter="url(#glow2)" />
    <rect x="-100" y="850" width="2120" height="60" fill="#ffffff" opacity="0.6" filter="url(#glow1)" />
    <rect x="-100" y="865" width="2120" height="15" fill="#ffffff" opacity="0.8" filter="url(#glow2)" />
  </g>
</svg>
`;

export default function SidewaveFluidDemo({ config }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const bgUrl = useMemo(() => {
    return `data:image/svg+xml;base64,${btoa(svgBackground.trim())}`;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const stage = stageRef.current;

    if (!canvas || !stage) {
      return;
    }

    const resizeCanvas = () => {
      const rect = stage.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);

      canvas.width = Math.max(1, Math.floor(rect.width * dpr));
      canvas.height = Math.max(1, Math.floor(rect.height * dpr));
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
    };

    resizeCanvas();
    const resizeObserver = new ResizeObserver(resizeCanvas);
    resizeObserver.observe(stage);
    window.addEventListener("resize", resizeCanvas);

    webGLFluidSimulation(canvas, {
      TRIGGER: "hover",
      IMMEDIATE: true,
      AUTO: false,
      SIM_RESOLUTION: 128,
      DYE_RESOLUTION: 1024,
      CAPTURE_RESOLUTION: 512,
      DENSITY_DISSIPATION: 1.5,
      VELOCITY_DISSIPATION: 0.1,
      PRESSURE: 0.8,
      PRESSURE_ITERATIONS: 25,
      CURL: 35,
      SPLAT_RADIUS: Number(config.splatRadius ?? 0.25),
      SPLAT_FORCE: Number(config.splatForce ?? 6000),
      SPLAT_COUNT: 3,
      SHADING: true,
      COLORFUL: true,
      COLOR_UPDATE_SPEED: 10,
      PAUSED: false,
      TRANSPARENT: true,
      BLOOM: true,
      BLOOM_ITERATIONS: 8,
      BLOOM_RESOLUTION: 256,
      BLOOM_INTENSITY: 0.8,
      BLOOM_THRESHOLD: 0.6,
      BLOOM_SOFT_KNEE: 0.7,
      SUNRAYS: true,
      SUNRAYS_RESOLUTION: 196,
      SUNRAYS_WEIGHT: 1.0,
    });

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", resizeCanvas);
    };
  }, [config.splatForce, config.splatRadius]);

  return (
    <div
      ref={stageRef}
      style={{
        backgroundImage: `url(${bgUrl})`,
        backgroundColor: "#df72d4",
        backgroundPosition: "center",
        backgroundSize: "cover",
        height: "100%",
        minHeight: 520,
        overflow: "hidden",
        position: "relative",
        userSelect: "none",
        width: "100%",
      }}
    >
      <div
        aria-hidden="true"
        style={{
          alignItems: "center",
          color: "rgba(255, 255, 255, 0.88)",
          display: "flex",
          flexDirection: "column",
          inset: 0,
          justifyContent: "center",
          mixBlendMode: "overlay",
          pointerEvents: "none",
          position: "absolute",
          textAlign: "center",
          textShadow: "0 20px 48px rgba(120, 24, 108, 0.45)",
          zIndex: 1,
        }}
      >
        <h2
          style={{
            fontSize: "clamp(48px, 12vw, 128px)",
            fontWeight: 900,
            letterSpacing: 0,
            lineHeight: 0.9,
          }}
        >
          SIDEWAVE
        </h2>
        <p
          style={{
            fontSize: "clamp(16px, 3vw, 28px)",
            fontWeight: 300,
            letterSpacing: "0.24em",
            marginTop: 16,
          }}
        >
          ORDER IN FLUX
        </p>
      </div>
      <canvas
        ref={canvasRef}
        style={{
          cursor: "crosshair",
          display: "block",
          inset: 0,
          position: "absolute",
          touchAction: "none",
          zIndex: 0,
        }}
      />
    </div>
  );
}
