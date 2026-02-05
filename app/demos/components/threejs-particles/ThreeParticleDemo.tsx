"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

type Props = {
  config: Record<string, string | number | boolean>;
};

type SceneState = {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  material: THREE.ShaderMaterial;
  points: THREE.Points;
  geometry: THREE.BufferGeometry;
  positions: Float32Array;
  speeds: Float32Array;
  scales: Float32Array;
  seeds: Float32Array;
  raf: number;
  clock: THREE.Clock;
};

const FIELD_WIDTH = 48;
const FIELD_HEIGHT = 34;
const FIELD_DEPTH = 32;

function createSnowflakeTexture() {
  const size = 64;
  const c = document.createElement("canvas");
  c.width = size;
  c.height = size;
  const ctx = c.getContext("2d");
  if (!ctx) return null;
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(0.35, "rgba(255,255,255,0.55)");
  g.addColorStop(0.65, "rgba(255,255,255,0.18)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(c);
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.generateMipmaps = false;
  return tex;
}

function buildParticles(count: number) {
  const positions = new Float32Array(count * 3);
  const speeds = new Float32Array(count);
  const scales = new Float32Array(count);
  const seeds = new Float32Array(count);

  for (let i = 0; i < count; i++) {
    const i3 = i * 3;
    positions[i3 + 0] = (Math.random() - 0.5) * FIELD_WIDTH;
    positions[i3 + 1] = (Math.random() - 0.5) * FIELD_HEIGHT;
    positions[i3 + 2] = (Math.random() - 0.5) * FIELD_DEPTH;
    speeds[i] = 0.35 + Math.random() * 0.55;
    scales[i] = 0.55 + Math.random() * 0.45;
    seeds[i] = Math.random() * 1000;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("aScale", new THREE.BufferAttribute(scales, 1));
  geometry.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 1));

  return { geometry, positions, speeds, scales, seeds };
}

export default function ThreeParticleDemo({ config }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stateRef = useRef<SceneState | null>(null);
  const speedRef = useRef(1);
  const parallaxRef = useRef(true);
  const densityRef = useRef(1200);
  const mouseRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 200);
    camera.position.set(0, 0, 22);

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
    renderer.setClearColor(0x000000, 0);

    const { geometry, positions, speeds, scales, seeds } = buildParticles(densityRef.current);

    const material = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.NormalBlending,
      uniforms: {
        uTime: { value: 0 },
        uPixelRatio: { value: 1 },
        uBaseSize: { value: 10.0 },
        uTexture: { value: createSnowflakeTexture() },
      },
      vertexShader: `
        uniform float uTime;
        uniform float uPixelRatio;
        uniform float uBaseSize;
        attribute float aScale;
        attribute float aSeed;
        varying float vTwinkle;
        void main() {
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_Position = projectionMatrix * mvPosition;
          float perspective = 28.0 / max(6.0, -mvPosition.z);
          gl_PointSize = clamp(uBaseSize * aScale * uPixelRatio * perspective, 1.0, 18.0);
          vTwinkle = 0.55 + 0.45 * sin(uTime * 1.6 + aSeed);
        }
      `,
      fragmentShader: `
        uniform sampler2D uTexture;
        varying float vTwinkle;
        void main() {
          vec4 tex = texture2D(uTexture, gl_PointCoord);
          float alpha = tex.a * vTwinkle;
          vec3 color = vec3(0.93, 0.97, 1.0);
          gl_FragColor = vec4(color, alpha);
        }
      `,
    });

    const points = new THREE.Points(geometry, material);
    scene.add(points);

    const clock = new THREE.Clock();

    const handleMouseMove = (event: MouseEvent) => {
      const nx = (event.clientX / window.innerWidth) * 2 - 1;
      const ny = (event.clientY / window.innerHeight) * 2 - 1;
      mouseRef.current.x = nx;
      mouseRef.current.y = ny;
    };

    const handleResize = () => {
      const w = canvas.parentElement?.clientWidth ?? window.innerWidth;
      const h = canvas.parentElement?.clientHeight ?? window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h, false);
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
      renderer.setPixelRatio(pixelRatio);
      material.uniforms.uPixelRatio.value = pixelRatio;
    };

    window.addEventListener("resize", handleResize, { passive: true });
    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    handleResize();

    const prefersReducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;

    const tick = () => {
      const current = stateRef.current;
      if (!current) return;

      const dt = Math.min(clock.getDelta(), 0.05);
      const speedMultiplier = (prefersReducedMotion ? 0.35 : 1) * speedRef.current;
      const t = clock.elapsedTime;

      material.uniforms.uTime.value = t;

      if (parallaxRef.current) {
        camera.position.x += (mouseRef.current.x * 1.2 - camera.position.x) * 0.05;
        camera.position.y += (mouseRef.current.y * 0.6 - camera.position.y) * 0.05;
      }
      camera.lookAt(0, 0, 0);

      const halfW = FIELD_WIDTH / 2;
      const halfH = FIELD_HEIGHT / 2;
      const halfD = FIELD_DEPTH / 2;
      const { positions, speeds, seeds, geometry } = current;

      for (let i = 0; i < densityRef.current; i++) {
        const i3 = i * 3;
        const driftX = Math.sin(t * 0.25 + seeds[i]) * 0.06;
        const driftZ = Math.cos(t * 0.2 + seeds[i]) * 0.02;
        positions[i3 + 0] += driftX * dt * 60 * speedMultiplier;
        positions[i3 + 2] += driftZ * dt * 60 * speedMultiplier;
        positions[i3 + 1] -= speeds[i] * dt * 2.2 * speedMultiplier;

        if (positions[i3 + 1] < -halfH) {
          positions[i3 + 1] = halfH + Math.random() * 2;
          positions[i3 + 0] += (Math.random() - 0.5) * 2.5;
          positions[i3 + 2] += (Math.random() - 0.5) * 1.5;
        }

        if (positions[i3 + 0] > halfW) positions[i3 + 0] = -halfW;
        if (positions[i3 + 0] < -halfW) positions[i3 + 0] = halfW;
        if (positions[i3 + 2] > halfD) positions[i3 + 2] = -halfD;
        if (positions[i3 + 2] < -halfD) positions[i3 + 2] = halfD;
      }

      geometry.attributes.position.needsUpdate = true;
      renderer.render(scene, camera);
      stateRef.current!.raf = requestAnimationFrame(tick);
    };

    stateRef.current = {
      scene,
      camera,
      renderer,
      material,
      points,
      geometry,
      positions,
      speeds,
      scales,
      seeds,
      raf: requestAnimationFrame(tick),
      clock,
    };

    return () => {
      const state = stateRef.current;
      if (!state) return;
      cancelAnimationFrame(state.raf);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
      state.geometry.dispose();
      state.material.dispose();
      state.renderer.dispose();
      stateRef.current = null;
    };
  }, []);

  useEffect(() => {
    const density = typeof config.density === "number" ? config.density : 1200;
    densityRef.current = Math.max(200, Math.min(3000, density));
    const state = stateRef.current;
    if (!state) return;

    const { geometry, positions, speeds, scales, seeds } = buildParticles(densityRef.current);
    state.points.geometry.dispose();
    state.points.geometry = geometry;
    state.geometry = geometry;
    state.positions = positions;
    state.speeds = speeds;
    state.scales = scales;
    state.seeds = seeds;
  }, [config.density]);

  useEffect(() => {
    const speed = typeof config.speed === "number" ? config.speed : 1;
    speedRef.current = Math.max(0.2, Math.min(2.5, speed));
  }, [config.speed]);

  useEffect(() => {
    const parallax = typeof config.parallax === "boolean" ? config.parallax : true;
    parallaxRef.current = parallax;
  }, [config.parallax]);

  return (
    <div className="demo-stage">
      <canvas ref={canvasRef} className="demo-canvas" aria-hidden="true" />
    </div>
  );
}
