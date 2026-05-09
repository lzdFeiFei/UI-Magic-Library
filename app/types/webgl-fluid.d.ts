declare module "webgl-fluid" {
  type FluidConfig = Record<string, boolean | number | string>;

  export default function webGLFluidSimulation(canvas: HTMLCanvasElement, config?: FluidConfig): void;
}
