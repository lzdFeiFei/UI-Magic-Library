import {
  AlertTriangle,
  ArrowDown,
  Cloud,
  Droplets,
  Moon,
  Target,
  Thermometer,
  Waves,
  type LucideIcon,
} from "lucide-react";

export interface PlanetMission {
  id: number;
  title: string;
  desc: string;
  color: string;
  isHighlight?: boolean;
}

export interface PlanetStat {
  label: string;
  value: string;
  icon: LucideIcon;
  level?: number;
}

export interface MoonData {
  name: string;
  size: number;
  color: string;
  orbitRadius: number;
  speed: number;
  inclination: number;
}

export interface Planet {
  id: string;
  name: string;
  subtitle: string;
  desc: string;
  baseColor: string;
  haloColor: string;
  textureUrl: string;
  textureRotation?: number;
  tags: { icon: LucideIcon; text: string }[];
  stats: PlanetStat[];
  missions: PlanetMission[];
  moons?: MoonData[];
}

export const PLANETS: Planet[] = [
  {
    id: "vultron",
    name: "VULTRON",
    subtitle: "THE ASHEN ANVIL",
    desc: "A scorching, cratered world orbiting dangerously close to its dying star.",
    baseColor: "#e07a5f",
    haloColor: "#f4a261",
    textureUrl: "/planet0.png",
    textureRotation: 1.35,
    tags: [
      { icon: Droplets, text: "SULFUR TRACE" },
      { icon: Thermometer, text: "+290 °C" },
      { icon: Moon, text: "2 MOONS" },
    ],
    stats: [
      { label: "GRAVITY", value: "0.45 g", icon: ArrowDown, level: 3 },
      { label: "ATMOSPHERE", value: "Sulfur Trace", icon: Cloud, level: 2 },
      { label: "SURFACE TEMP.", value: "+290 °C", icon: Thermometer, level: 8 },
      { label: "MOON COUNT", value: "2", icon: Target, level: 2 },
      { label: "MAGNETIC FIELD", value: "Stellar", icon: Waves, level: 7 },
      { label: "EXPLORATION DIFFICULTY", value: "Extreme", icon: AlertTriangle, level: 7 },
    ],
    missions: [
      { id: 1, title: "CINDER TREK", desc: "Cross the basin.", color: "#9ca3af" },
      { id: 2, title: "SHADOW HUNT", desc: "Investigate anomaly.", color: "#34d399", isHighlight: true },
    ],
    moons: [
      { name: "Pyra", size: 0.15, color: "#fca311", orbitRadius: 3.5, speed: 1.2, inclination: 0.2 },
      { name: "Ignis", size: 0.08, color: "#e5e5e5", orbitRadius: 4.8, speed: 0.7, inclination: -0.4 },
    ],
  },
  {
    id: "syran",
    name: "SYRAN",
    subtitle: "THE POISON PEARL",
    desc: "Enshrouded in iridescent jade clouds, a world of crushing pressure.",
    baseColor: "#2a9d8f",
    haloColor: "#48bfe3",
    textureUrl: "/planet1.png",
    textureRotation: 0.4,
    tags: [
      { icon: Droplets, text: "98% ACID" },
      { icon: Thermometer, text: "+112 °C" },
      { icon: Moon, text: "1 MOON" },
    ],
    stats: [
      { label: "GRAVITY", value: "1.05 g", icon: ArrowDown, level: 4 },
      { label: "ATMOSPHERE", value: "98% Acid", icon: Cloud, level: 6 },
      { label: "SURFACE TEMP.", value: "+112 °C", icon: Thermometer, level: 5 },
      { label: "MOON COUNT", value: "1", icon: Target, level: 1 },
      { label: "MAGNETIC FIELD", value: "None", icon: Waves, level: 0 },
      { label: "EXPLORATION DIFFICULTY", value: "Extreme", icon: AlertTriangle, level: 7 },
    ],
    missions: [{ id: 1, title: "VAPOR DRIFT", desc: "Float a probe.", color: "#34d399" }],
    moons: [{ name: "Phos", size: 0.2, color: "#bde0fe", orbitRadius: 4.2, speed: 0.9, inclination: 0.5 }],
  },
  {
    id: "aerilion",
    name: "AERILION",
    subtitle: "THE CRADLE",
    desc: "A thriving pale aqua world. Violet flora and bioluminescent oceans.",
    baseColor: "#8ecae6",
    haloColor: "#bde0fe",
    textureUrl: "/planet2.png",
    textureRotation: -0.55,
    tags: [
      { icon: Droplets, text: "OXIDIZED MIX" },
      { icon: Thermometer, text: "+18 °C" },
      { icon: Moon, text: "3 MOONS" },
    ],
    stats: [
      { label: "GRAVITY", value: "0.92 g", icon: ArrowDown, level: 4 },
      { label: "ATMOSPHERE", value: "Oxidized", icon: Cloud, level: 4 },
      { label: "SURFACE TEMP.", value: "+18 °C", icon: Thermometer, level: 3 },
      { label: "MOON COUNT", value: "3", icon: Target, level: 3 },
      { label: "MAGNETIC FIELD", value: "Strong", icon: Waves, level: 5 },
      { label: "EXPLORATION DIFFICULTY", value: "Easy", icon: AlertTriangle, level: 2 },
    ],
    missions: [{ id: 1, title: "ABYSSAL SWEEP", desc: "Document reefs.", color: "#60a5fa" }],
    moons: [
      { name: "Lunaris Prime", size: 0.25, color: "#f8f9fa", orbitRadius: 3.8, speed: 1.1, inclination: 0.1 },
      { name: "Thalassa", size: 0.12, color: "#caf0f8", orbitRadius: 5.5, speed: 0.6, inclination: -0.2 },
      { name: "Cymopoleia", size: 0.09, color: "#e0b1cb", orbitRadius: 6.8, speed: 0.4, inclination: 0.3 },
    ],
  },
];
