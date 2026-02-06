"use client";

import { useEffect, useRef, useCallback } from "react";
import { FluidSimulation } from "./useFluidSimulation";
import { PatternRenderer } from "./PatternRenderer";
import pat3Url from "./pat3.png";
import pat7Url from "./pat7-colored.png";
import defaultImageUrl from "./default-old.webp";

type Props = {
  config: Record<string, string | number | boolean>;
};

export default function BasePayPatternDemo({ config }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fluidSimRef = useRef<FluidSimulation | null>(null);
  const patternRendererRef = useRef<PatternRenderer | null>(null);
  const mouseRef = useRef({ x: 0, y: 0, prevX: 0, prevY: 0 });
  const animationRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);

  const darkMode = config.darkMode === true;

  const resize = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas || !fluidSimRef.current) return;

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = 1.0 - (e.clientY - rect.top) / rect.height;

    mouseRef.current.prevX = mouseRef.current.x;
    mouseRef.current.prevY = mouseRef.current.y;
    mouseRef.current.x = x;
    mouseRef.current.y = y;

    const dx = (x - mouseRef.current.prevX) * 10;
    const dy = (y - mouseRef.current.prevY) * 10;

    if (Math.abs(dx) > 0.001 || Math.abs(dy) > 0.001) {
      fluidSimRef.current.splat(x, y, dx, dy);
    }
  }, []);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas || !fluidSimRef.current) return;

    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    const x = (touch.clientX - rect.left) / rect.width;
    const y = 1.0 - (touch.clientY - rect.top) / rect.height;

    mouseRef.current.prevX = mouseRef.current.x;
    mouseRef.current.prevY = mouseRef.current.y;
    mouseRef.current.x = x;
    mouseRef.current.y = y;

    const dx = (x - mouseRef.current.prevX) * 10;
    const dy = (y - mouseRef.current.prevY) * 10;

    if (Math.abs(dx) > 0.001 || Math.abs(dy) > 0.001) {
      fluidSimRef.current.splat(x, y, dx, dy);
    }
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext("webgl2", { antialias: false, alpha: false });
    if (!gl) {
      console.error("WebGL2 is not supported");
      return;
    }

    resize();

    // Initialize fluid simulation
    fluidSimRef.current = new FluidSimulation(gl, {
      simRes: 128,
      dyeRes: 512,
      densityDissipation: 0.95,
      velocityDissipation: 0.9,
      pressureIterations: 20,
      curl: 30,
      splatRadius: 0.003,
    });

    // Initialize pattern renderer
    patternRendererRef.current = new PatternRenderer(gl, {
      baseTileSize: 8,
      patternColumns: 4,
      altPatternColumns: 6,
      deformStrength: 0.05,
      darkMode,
      imageScale: 1.0,
      fadeThreshold: 0.1,
      fadeWidth: 0.05,
      altPatternOpacity: 1.0,
      enableFadeTransition: true,
    });

    // Load images
    const loadImages = async () => {
      try {
        // Load main image
        const image = new Image();
        image.crossOrigin = "anonymous";
        image.src = defaultImageUrl.src;
        await image.decode();
        patternRendererRef.current?.setImage(image);

        // Load gray pattern
        const patternImage = new Image();
        patternImage.src = pat3Url.src;
        await patternImage.decode();
        patternRendererRef.current?.setPatternAtlas(patternImage);
        if (patternRendererRef.current) {
          patternRendererRef.current.config.patternColumns = 4;
        }

        // Load colored pattern
        const altPatternImage = new Image();
        altPatternImage.src = pat7Url.src;
        await altPatternImage.decode();
        patternRendererRef.current?.setAltPatternAtlas(altPatternImage);
        if (patternRendererRef.current) {
          patternRendererRef.current.config.altPatternColumns = 6;
        }
      } catch (e) {
        console.error("Failed to load images:", e);
      }
    };

    loadImages();

    // Animation loop
    const loop = (time: number) => {
      const dt = Math.min((time - lastTimeRef.current) / 1000, 0.016);
      lastTimeRef.current = time;

      if (fluidSimRef.current && patternRendererRef.current) {
        fluidSimRef.current.step(dt);
        patternRendererRef.current.render(
          fluidSimRef.current.getDensityTexture(),
          time / 1000
        );
      }

      animationRef.current = requestAnimationFrame(loop);
    };

    animationRef.current = requestAnimationFrame(loop);

    // Event listeners
    window.addEventListener("resize", resize);
    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("touchmove", handleTouchMove, { passive: false });

    return () => {
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("mousemove", handleMouseMove);
      canvas.removeEventListener("touchmove", handleTouchMove);
      cancelAnimationFrame(animationRef.current);
    };
  }, [resize, handleMouseMove, handleTouchMove, darkMode]);

  // Update dark mode when config changes
  useEffect(() => {
    if (patternRendererRef.current) {
      patternRendererRef.current.config.darkMode = darkMode;
    }
  }, [darkMode]);

  return (
    <div className="demo-stage">
      <canvas
        ref={canvasRef}
        style={{
          width: "100%",
          height: "100%",
          display: "block",
          touchAction: "none",
        }}
      />
    </div>
  );
}
