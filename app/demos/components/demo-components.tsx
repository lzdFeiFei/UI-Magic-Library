"use client";

import GrainyGradientDemo from "./grainy-gradient/GrainyGradientDemo";
import ThreeParticleDemo from "./threejs-particles/ThreeParticleDemo";
import BasePayPatternDemo from "./base-pay-pattern/BasePayPatternDemo";
import AerisPlanetExplorerDemo from "./aeris-planet-explorer/AerisPlanetExplorerDemo";
import type { ComponentType } from "react";

export const demoComponents: Record<string, ComponentType<{ config: Record<string, string | number | boolean> }>> = {
  "grainy-gradient": GrainyGradientDemo,
  "threejs-particles": ThreeParticleDemo,
  "base-pay-pattern": BasePayPatternDemo,
  "aeris-planet-explorer": AerisPlanetExplorerDemo,
};
