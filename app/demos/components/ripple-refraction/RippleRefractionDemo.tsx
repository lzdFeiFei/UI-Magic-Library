"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

type Props = {
  config: Record<string, string | number | boolean>;
};

type Drop = {
  x: number;
  y: number;
  strength: number;
};

type SceneState = {
  renderer: THREE.WebGLRenderer;
  displayScene: THREE.Scene;
  simScene: THREE.Scene;
  camera: THREE.OrthographicCamera;
  displayMaterial: THREE.ShaderMaterial;
  simMaterial: THREE.ShaderMaterial;
  displayGeometry: THREE.PlaneGeometry;
  simGeometry: THREE.PlaneGeometry;
  sceneTexture: THREE.CanvasTexture;
  targetA: THREE.WebGLRenderTarget;
  targetB: THREE.WebGLRenderTarget;
  writeTarget: THREE.WebGLRenderTarget;
  readTarget: THREE.WebGLRenderTarget;
  drops: Drop[];
  raf: number;
};

const RIPPLE_RESOLUTION = 512;
const MAX_DROPS = 8;

function createSceneTexture() {
  const width = 1600;
  const height = 900;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  if (!ctx) return new THREE.CanvasTexture(canvas);

  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, "#8836ff");
  gradient.addColorStop(0.36, "#ca4bd2");
  gradient.addColorStop(0.68, "#ee67ae");
  gradient.addColorStop(1, "#564cf3");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  const glow = ctx.createRadialGradient(width * 0.53, height * 0.1, 20, width * 0.53, height * 0.1, width * 0.62);
  glow.addColorStop(0, "rgba(255,255,255,0.22)");
  glow.addColorStop(0.3, "rgba(255,118,236,0.22)");
  glow.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, width, height);

  ctx.save();
  ctx.globalCompositeOperation = "screen";
  for (let i = 0; i < 9; i += 1) {
    const y = height * (0.04 + i * 0.085);
    const bend = Math.sin(i * 1.31) * 120;
    ctx.beginPath();
    ctx.moveTo(-160, y + bend * 0.2);
    ctx.bezierCurveTo(width * 0.28, y - 130, width * 0.56, y + 92, width + 180, y - 12);
    ctx.lineWidth = i % 3 === 0 ? 6 : 2;
    ctx.strokeStyle = i % 3 === 0 ? "rgba(255,190,255,0.5)" : "rgba(255,255,255,0.22)";
    ctx.shadowColor = "#ffa4ff";
    ctx.shadowBlur = 18;
    ctx.stroke();
  }
  ctx.restore();

  ctx.fillStyle = "rgba(52,22,112,0.36)";
  ctx.beginPath();
  ctx.moveTo(0, height * 0.72);
  ctx.lineTo(width * 0.08, height * 0.63);
  ctx.lineTo(width * 0.22, height * 0.68);
  ctx.lineTo(width * 0.4, height * 0.62);
  ctx.lineTo(width * 0.55, height * 0.65);
  ctx.lineTo(width * 0.72, height * 0.59);
  ctx.lineTo(width, height * 0.67);
  ctx.lineTo(width, height);
  ctx.lineTo(0, height);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "rgba(22,10,62,0.3)";
  ctx.beginPath();
  ctx.moveTo(0, height * 0.88);
  ctx.quadraticCurveTo(width * 0.45, height * 0.76, width, height * 0.86);
  ctx.lineTo(width, height);
  ctx.lineTo(0, height);
  ctx.closePath();
  ctx.fill();

  ctx.save();
  ctx.translate(width * 0.58, height * 0.69);
  ctx.rotate(-0.08);
  const planet = ctx.createRadialGradient(-46, -55, 8, 0, 0, 174);
  planet.addColorStop(0, "#ff75ec");
  planet.addColorStop(0.32, "#2b135e");
  planet.addColorStop(0.72, "#070416");
  planet.addColorStop(1, "#ff2d66");
  ctx.fillStyle = planet;
  ctx.beginPath();
  ctx.ellipse(0, 0, 118, 210, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "#9d00ff";
  ctx.lineWidth = 7;
  for (let i = 0; i < 10; i += 1) {
    ctx.beginPath();
    ctx.ellipse(-74 + i * 11, 0, 20 + i * 15, 38 + i * 16, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();

  ctx.fillStyle = "rgba(255,255,255,0.95)";
  ctx.font = "900 106px Impact, Arial Black, sans-serif";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText("FEEL THE RIPPLE", width * 0.66, height * 0.52);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.generateMipmaps = false;
  return texture;
}

function createTarget() {
  return new THREE.WebGLRenderTarget(RIPPLE_RESOLUTION, RIPPLE_RESOLUTION, {
    type: THREE.HalfFloatType,
    format: THREE.RGBAFormat,
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter,
    wrapS: THREE.ClampToEdgeWrapping,
    wrapT: THREE.ClampToEdgeWrapping,
    depthBuffer: false,
    stencilBuffer: false,
  });
}

const vertexShader = `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

const simFragmentShader = `
  precision highp float;

  varying vec2 vUv;

  uniform sampler2D uPrevious;
  uniform vec2 uTexel;
  uniform vec2 uDrops[${MAX_DROPS}];
  uniform float uDropStrengths[${MAX_DROPS}];
  uniform int uDropCount;

  void main() {
    vec4 previous = texture2D(uPrevious, vUv);
    float height = previous.r;
    float velocity = previous.g;

    float left = texture2D(uPrevious, vUv - vec2(uTexel.x, 0.0)).r;
    float right = texture2D(uPrevious, vUv + vec2(uTexel.x, 0.0)).r;
    float bottom = texture2D(uPrevious, vUv - vec2(0.0, uTexel.y)).r;
    float top = texture2D(uPrevious, vUv + vec2(0.0, uTexel.y)).r;
    float laplacian = (left + right + bottom + top) * 0.25 - height;

    velocity += laplacian * 0.78;
    velocity *= 0.989;
    height += velocity;
    height *= 0.995;

    for (int i = 0; i < ${MAX_DROPS}; i++) {
      if (i >= uDropCount) break;

      vec2 delta = vUv - uDrops[i];
      float dist = length(delta);
      float impulse = exp(-dist * dist * 2600.0) * uDropStrengths[i];
      height += impulse;
    }

    gl_FragColor = vec4(height, velocity, 0.0, 1.0);
  }
`;

const displayFragmentShader = `
  precision highp float;

  varying vec2 vUv;

  uniform sampler2D uScene;
  uniform sampler2D uRipple;
  uniform vec2 uResolution;
  uniform float uIntensity;

  vec3 sampleScene(vec2 uv) {
    return texture2D(uScene, clamp(uv, 0.001, 0.999)).rgb;
  }

  void main() {
    vec2 texel = 1.0 / uResolution;
    float left = texture2D(uRipple, vUv - vec2(texel.x, 0.0)).r;
    float right = texture2D(uRipple, vUv + vec2(texel.x, 0.0)).r;
    float bottom = texture2D(uRipple, vUv - vec2(0.0, texel.y)).r;
    float top = texture2D(uRipple, vUv + vec2(0.0, texel.y)).r;
    float height = texture2D(uRipple, vUv).r;

    vec2 normal = vec2(left - right, bottom - top);
    vec2 distortion = normal * (0.07 + uIntensity * 0.00175);
    float edge = smoothstep(0.004, 0.045, length(normal));
    float body = smoothstep(0.004, 0.028, abs(height));

    vec3 color;
    color.r = sampleScene(vUv + distortion * 1.2).r;
    color.g = sampleScene(vUv + distortion).g;
    color.b = sampleScene(vUv + distortion * 0.72).b;

    color += vec3(0.86, 0.54, 1.0) * edge * 0.34;
    color += vec3(0.28, 0.1, 0.42) * body * 0.1;
    color -= vec3(0.04, 0.02, 0.08) * edge * 0.16;

    gl_FragColor = vec4(color, 1.0);
  }
`;

export default function RippleRefractionDemo({ config }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stateRef = useRef<SceneState | null>(null);
  const lastPointerRef = useRef<{ x: number; y: number; time: number } | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: false,
      powerPreference: "high-performance",
    });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.setClearColor(0x120824, 1);

    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const displayScene = new THREE.Scene();
    const simScene = new THREE.Scene();
    const sceneTexture = createSceneTexture();
    const targetA = createTarget();
    const targetB = createTarget();
    const dropValues = Array.from({ length: MAX_DROPS }, () => new THREE.Vector2(-10, -10));
    const strengthValues = new Float32Array(MAX_DROPS).fill(0);

    const simMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uPrevious: { value: targetA.texture },
        uTexel: { value: new THREE.Vector2(1 / RIPPLE_RESOLUTION, 1 / RIPPLE_RESOLUTION) },
        uDrops: { value: dropValues },
        uDropStrengths: { value: strengthValues },
        uDropCount: { value: 0 },
      },
      vertexShader,
      fragmentShader: simFragmentShader,
    });

    const displayMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uScene: { value: sceneTexture },
        uRipple: { value: targetA.texture },
        uResolution: { value: new THREE.Vector2(RIPPLE_RESOLUTION, RIPPLE_RESOLUTION) },
        uIntensity: { value: Number(config.intensity ?? 22) },
      },
      vertexShader,
      fragmentShader: displayFragmentShader,
    });

    const simGeometry = new THREE.PlaneGeometry(2, 2);
    const displayGeometry = new THREE.PlaneGeometry(2, 2);
    simScene.add(new THREE.Mesh(simGeometry, simMaterial));
    displayScene.add(new THREE.Mesh(displayGeometry, displayMaterial));

    const state: SceneState = {
      renderer,
      displayScene,
      simScene,
      camera,
      displayMaterial,
      simMaterial,
      displayGeometry,
      simGeometry,
      sceneTexture,
      targetA,
      targetB,
      writeTarget: targetB,
      readTarget: targetA,
      drops: [],
      raf: 0,
    };

    const queueDrop = (x: number, y: number, strength: number) => {
      const rect = canvas.getBoundingClientRect();
      state.drops.push({
        x: x / rect.width,
        y: 1 - y / rect.height,
        strength,
      });
      if (state.drops.length > MAX_DROPS) state.drops.splice(0, state.drops.length - MAX_DROPS);
    };

    const handlePointerMove = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      const now = performance.now();
      const last = lastPointerRef.current;

      if (!last) {
        queueDrop(x, y, 0.32);
      } else {
        const distance = Math.hypot(x - last.x, y - last.y);
        if (distance > 5 || now - last.time > 42) {
          const steps = Math.max(1, Math.min(6, Math.ceil(distance / 12)));
          const strength = Math.min(0.42, 0.2 + distance * 0.003);

          for (let i = 1; i <= steps; i += 1) {
            const t = i / steps;
            queueDrop(last.x + (x - last.x) * t, last.y + (y - last.y) * t, strength);
          }
        }
      }

      lastPointerRef.current = { x, y, time: now };
    };

    const handleResize = () => {
      const parent = canvas.parentElement;
      const width = parent?.clientWidth ?? window.innerWidth;
      const height = parent?.clientHeight ?? window.innerHeight;

      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.setSize(width, height, false);
    };

    const syncDrops = () => {
      const count = Math.min(state.drops.length, MAX_DROPS);
      state.simMaterial.uniforms.uDropCount.value = count;

      for (let i = 0; i < MAX_DROPS; i += 1) {
        const drop = state.drops[i];
        if (drop) {
          dropValues[i].set(drop.x, drop.y);
          strengthValues[i] = drop.strength;
        } else {
          dropValues[i].set(-10, -10);
          strengthValues[i] = 0;
        }
      }

      state.drops.length = 0;
    };

    const stepSimulation = () => {
      syncDrops();
      state.simMaterial.uniforms.uPrevious.value = state.readTarget.texture;

      renderer.setRenderTarget(state.writeTarget);
      renderer.render(state.simScene, state.camera);
      renderer.setRenderTarget(null);

      const nextRead = state.writeTarget;
      state.writeTarget = state.readTarget;
      state.readTarget = nextRead;
      state.displayMaterial.uniforms.uRipple.value = state.readTarget.texture;
    };

    const tick = () => {
      const current = stateRef.current;
      if (!current) return;

      stepSimulation();
      stepSimulation();
      renderer.render(displayScene, camera);
      current.raf = requestAnimationFrame(tick);
    };

    canvas.addEventListener("pointermove", handlePointerMove, { passive: true });
    window.addEventListener("resize", handleResize, { passive: true });
    handleResize();

    renderer.setRenderTarget(targetA);
    renderer.clear();
    renderer.setRenderTarget(targetB);
    renderer.clear();
    renderer.setRenderTarget(null);

    stateRef.current = state;
    queueDrop(canvas.clientWidth * 0.32, canvas.clientHeight * 0.36, 0.34);
    queueDrop(canvas.clientWidth * 0.47, canvas.clientHeight * 0.44, 0.28);
    state.raf = requestAnimationFrame(tick);

    return () => {
      const current = stateRef.current;
      if (!current) return;

      cancelAnimationFrame(current.raf);
      canvas.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("resize", handleResize);
      current.displayGeometry.dispose();
      current.simGeometry.dispose();
      current.displayMaterial.dispose();
      current.simMaterial.dispose();
      current.sceneTexture.dispose();
      current.targetA.dispose();
      current.targetB.dispose();
      current.renderer.dispose();
      stateRef.current = null;
    };
  }, []);

  useEffect(() => {
    const state = stateRef.current;
    if (!state) return;

    state.displayMaterial.uniforms.uIntensity.value = Number(config.intensity ?? 22);
  }, [config.intensity]);

  return (
    <div className="demo-stage ripple-refraction-stage">
      <canvas ref={canvasRef} className="demo-canvas ripple-refraction-canvas" aria-hidden="true" />
    </div>
  );
}
