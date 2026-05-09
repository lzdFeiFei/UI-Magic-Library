export type DemoControl =
  | {
      key: string;
      label: string;
      type: "range";
      min: number;
      max: number;
      step: number;
    }
  | {
      key: string;
      label: string;
      type: "color";
    }
  | {
      key: string;
      label: string;
      type: "select";
      options: { label: string; value: string }[];
    }
  | {
      key: string;
      label: string;
      type: "toggle";
    };

export type DemoMeta = {
  slug: string;
  title: string;
  description: string;
  tags: string[];
  defaultConfig?: Record<string, string | number | boolean>;
  controls?: DemoControl[];
};

export const demos: DemoMeta[] = [
  {
    slug: "grainy-gradient",
    title: "Grainy Gradient Background",
    description: "Textured gradient card with controllable colors and noise.",
    tags: ["css", "background", "texture"],
    defaultConfig: {
      colorA: "#7c3aed",
      colorB: "#182fff",
      noiseSize: 500,
      noiseOpacity: 1,
      noiseBrightness: 3,
    },
    controls: [
      { key: "colorA", label: "Gradient Color A", type: "color" },
      { key: "colorB", label: "Gradient Color B", type: "color" },
      { key: "noiseSize", label: "Noise Size", type: "range", min: 120, max: 900, step: 10 },
      { key: "noiseOpacity", label: "Noise Opacity", type: "range", min: 0.1, max: 1.2, step: 0.05 },
      { key: "noiseBrightness", label: "Noise Brightness", type: "range", min: 1, max: 4, step: 0.1 },
    ],
  },
  {
    slug: "threejs-particles",
    title: "Three.js Particle Background",
    description: "Snowfall particles with gentle parallax and glass overlay.",
    tags: ["threejs", "particles", "webgl"],
    defaultConfig: {
      speed: 1,
      density: 1200,
      parallax: true,
    },
    controls: [
      { key: "speed", label: "Speed", type: "range", min: 0.2, max: 2, step: 0.1 },
      { key: "density", label: "Particle Count", type: "range", min: 400, max: 2000, step: 50 },
      { key: "parallax", label: "Parallax", type: "toggle" },
    ],
  },
  {
    slug: "base-pay-pattern",
    title: "Base Pay Pattern Effect",
    description: "Interactive dot matrix pattern with fluid simulation, inspired by Base Pay.",
    tags: ["webgl", "fluid", "pattern", "interactive"],
    defaultConfig: {
      darkMode: false,
    },
    controls: [
      { key: "darkMode", label: "Dark Mode", type: "toggle" },
    ],
  },
  {
    slug: "aeris-planet-explorer",
    title: "AERIS Planet Explorer",
    description: "Interactive 3D planetary exploration dashboard with orbiting moons and mission panels.",
    tags: ["threejs", "dashboard", "3d", "interactive"],
  },
  {
    slug: "ripple-refraction",
    title: "Pointer Ripple Refraction",
    description: "Three.js shader ripples that refract a neon scene like liquid glass.",
    tags: ["threejs", "webgl", "ripple", "refraction"],
    defaultConfig: {
      intensity: 22,
    },
    controls: [
      { key: "intensity", label: "Refraction Strength", type: "range", min: 8, max: 44, step: 1 },
    ],
  },
  {
    slug: "sidewave-fluid",
    title: "Sidewave Fluid",
    description: "Hover-reactive WebGL fluid waves over a luminous SIDEWAVE poster scene.",
    tags: ["webgl", "fluid", "interactive", "poster"],
    defaultConfig: {
      splatRadius: 0.25,
      splatForce: 6000,
    },
    controls: [
      { key: "splatRadius", label: "Ripple Radius", type: "range", min: 0.08, max: 0.5, step: 0.01 },
      { key: "splatForce", label: "Wave Force", type: "range", min: 1500, max: 9000, step: 250 },
    ],
  },
  {
    slug: "indigo-laboratory",
    title: "Indigo Laboratory",
    description: "Immersive editorial chapter menu with magnetic links, splash reveal, and video-backed hover states.",
    tags: ["motion", "editorial", "landing", "interactive"],
  },
];

export function getDemo(slug: string): DemoMeta | undefined {
  return demos.find((demo) => demo.slug === slug);
}
