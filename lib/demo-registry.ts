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
];

export function getDemo(slug: string): DemoMeta | undefined {
  return demos.find((demo) => demo.slug === slug);
}
