"use client";

import GrainyGradientDemo from "./grainy-gradient/GrainyGradientDemo";
import ThreeParticleDemo from "./threejs-particles/ThreeParticleDemo";
import BasePayPatternDemo from "./base-pay-pattern/BasePayPatternDemo";
import AerisPlanetExplorerDemo from "./aeris-planet-explorer/AerisPlanetExplorerDemo";
import RippleRefractionDemo from "./ripple-refraction/RippleRefractionDemo";
import SidewaveFluidDemo from "./sidewave-fluid/SidewaveFluidDemo";
import IndigoLaboratoryDemo from "./indigo-laboratory/IndigoLaboratoryDemo";
import type { ComponentType } from "react";

export const demoComponents: Record<string, ComponentType<{ config: Record<string, string | number | boolean> }>> = {
  "grainy-gradient": GrainyGradientDemo,
  "threejs-particles": ThreeParticleDemo,
  "base-pay-pattern": BasePayPatternDemo,
  "aeris-planet-explorer": AerisPlanetExplorerDemo,
  "ripple-refraction": RippleRefractionDemo,
  "sidewave-fluid": SidewaveFluidDemo,
  "indigo-laboratory": IndigoLaboratoryDemo,
};
