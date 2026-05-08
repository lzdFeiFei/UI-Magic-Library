"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, Float, Html, useTexture } from "@react-three/drei";
import { AnimatePresence, motion, type Variants } from "motion/react";
import { Camera, Compass, Map, Navigation, Scale, Target, User } from "lucide-react";
import * as THREE from "three";
import { PLANETS, type MoonData, type Planet } from "./data";

type Props = {
  config: Record<string, string | number | boolean>;
};

const atmosphereVertexShader = `
  varying vec3 vNormal;
  varying vec3 vViewPosition;
  varying vec3 vWorldPosition;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    vViewPosition = -mvPosition.xyz;
    vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const atmosphereFragmentShader = `
  uniform vec3 color;
  uniform float time;
  varying vec3 vNormal;
  varying vec3 vViewPosition;
  varying vec3 vWorldPosition;

  float fluidNoise(vec3 p) {
    float n = sin(p.x * 4.0 + time) * sin(p.y * 4.4 + time * 0.8) * cos(p.z * 4.0 - time * 0.5);
    n += sin(p.x * 8.0 - time * 1.2) * cos(p.y * 8.0 + time) * sin(p.z * 8.0) * 0.5;
    return n * 0.5 + 0.5;
  }

  void main() {
    vec3 normal = normalize(vNormal);
    vec3 viewDir = normalize(vViewPosition);
    float NdotV = max(dot(normal, viewDir), 0.0);
    float baseRim = pow(1.0 - NdotV, 3.5);
    float hotRim = pow(1.0 - NdotV, 7.0) * 1.5;
    float noise = fluidNoise(vWorldPosition * 1.5);
    float intensity = (baseRim * 0.4) + (hotRim * noise * 1.8);
    float scanline = sin(gl_FragCoord.y * 4.0 - time * 8.0) * 0.05;
    intensity += scanline * baseRim;
    vec3 finalColor = color * intensity * 2.5;
    gl_FragColor = vec4(finalColor, intensity);
  }
`;

const dragVelocity = { x: 0, y: 0 };
let isDragging = false;

const staggerListVariants: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.08 },
  },
  exit: {
    transition: { staggerChildren: 0.08, staggerDirection: 1 },
  },
};

const staggerItemVariants: Variants = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.3, ease: "easeOut" } },
  exit: { opacity: 0, x: 20, transition: { duration: 0.2, ease: "easeIn" } },
};

function StaticBase() {
  const ticks = 48;

  return (
    <group position={[0, -3.2, 0]}>
      <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <torusGeometry args={[3.2, 0.12, 32, 64]} />
        <meshStandardMaterial color="#ffffff" roughness={0.4} />
      </mesh>

      <mesh position={[0, -0.05, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[3.2, 64]} />
        <meshStandardMaterial color="#e2e8f0" roughness={0.8} transparent opacity={0.5} />
      </mesh>

      <mesh position={[0, -0.04, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[2.6, 2.64, 64]} />
        <meshBasicMaterial color="#f5b041" transparent opacity={0.8} />
      </mesh>

      <mesh position={[0, -0.04, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[2.1, 2.12, 64]} />
        <meshBasicMaterial color="#48c9b0" transparent opacity={0.6} />
      </mesh>

      {Array.from({ length: ticks }).map((_, i) => {
        const angle = (i / ticks) * Math.PI * 2;
        const radius = 1.7;

        return (
          <group key={i} rotation={[0, -angle, 0]}>
            <mesh position={[radius, -0.04, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[0.08, 0.02]} />
              <meshBasicMaterial color="#ef476f" transparent opacity={0.8} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

function InteractiveControls() {
  const { gl } = useThree();

  useEffect(() => {
    let lastX = 0;
    let lastY = 0;

    const pointerDown = (event: PointerEvent) => {
      isDragging = true;
      lastX = event.clientX;
      lastY = event.clientY;
    };
    const pointerMove = (event: PointerEvent) => {
      if (!isDragging) return;
      dragVelocity.x = (event.clientX - lastX) * 0.005;
      dragVelocity.y = (event.clientY - lastY) * 0.005;
      lastX = event.clientX;
      lastY = event.clientY;
    };
    const pointerUp = () => {
      isDragging = false;
    };

    gl.domElement.addEventListener("pointerdown", pointerDown);
    window.addEventListener("pointermove", pointerMove);
    window.addEventListener("pointerup", pointerUp);

    return () => {
      isDragging = false;
      gl.domElement.removeEventListener("pointerdown", pointerDown);
      window.removeEventListener("pointermove", pointerMove);
      window.removeEventListener("pointerup", pointerUp);
    };
  }, [gl]);

  useFrame(() => {
    if (!isDragging) {
      dragVelocity.x *= 0.95;
      dragVelocity.y *= 0.95;
    }
  });

  return null;
}

function MoonRender({ moon, active }: { moon: MoonData; active: boolean }) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * moon.speed * 0.15;
    }
  });

  return (
    <group rotation={[moon.inclination, 0, 0]}>
      <group ref={groupRef}>
        <mesh position={[moon.orbitRadius, 0, 0]}>
          <sphereGeometry args={[moon.size, 32, 32]} />
          <meshStandardMaterial color={moon.color} roughness={0.6} />
          {active && (
            <Html distanceFactor={8} center position={[0, moon.size + 0.2, 0]} zIndexRange={[100, 0]}>
              <div className="flex flex-col items-center pointer-events-none whitespace-nowrap opacity-80" style={{ textShadow: "0 2px 4px rgba(0,0,0,0.8)" }}>
                <div className="text-white font-bold text-xs tracking-widest">{moon.name}</div>
                <div className="text-sky-200 text-[8px] mt-0.5 uppercase tracking-wider font-medium">
                  Orbit: {moon.orbitRadius}U / Speed: {moon.speed}
                </div>
              </div>
            </Html>
          )}
        </mesh>
      </group>

      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[moon.orbitRadius - 0.01, moon.orbitRadius + 0.01, 64]} />
        <meshBasicMaterial color={moon.color} transparent opacity={0.25} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

function SinglePlanet({ planet, index, isActive }: { planet: Planet; index: number; isActive: boolean }) {
  const haloColor = useMemo(() => new THREE.Color(planet.haloColor), [planet.haloColor]);
  const texture = useTexture(planet.textureUrl);
  const dragGroup = useRef<THREE.Group>(null);
  const rotatingGroup = useRef<THREE.Group>(null);
  const atmosphereMaterialRef = useRef<THREE.ShaderMaterial>(null);
  const uniforms = useMemo(() => ({ color: { value: haloColor }, time: { value: 0 } }), [haloColor]);

  useEffect(() => {
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.needsUpdate = true;
  }, [texture]);

  useFrame((state, delta) => {
    if (atmosphereMaterialRef.current) {
      atmosphereMaterialRef.current.uniforms.time.value = state.clock.elapsedTime;
    }
    if (!rotatingGroup.current || !dragGroup.current) return;

    if (!isDragging) {
      rotatingGroup.current.rotation.y += delta * 0.15;
      if (isActive) {
        dragGroup.current.rotation.y += dragVelocity.x;
        dragGroup.current.rotation.x += dragVelocity.y;
      }
    } else if (isActive) {
      dragGroup.current.rotation.y += dragVelocity.x;
      dragGroup.current.rotation.x += dragVelocity.y;
    } else {
      rotatingGroup.current.rotation.y += delta * 0.15;
    }

    dragGroup.current.rotation.x = THREE.MathUtils.clamp(dragGroup.current.rotation.x, -Math.PI / 4, Math.PI / 4);
  });

  return (
    <group position={[-index * 25, -index * 15, 0]}>
      <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.5}>
        <group ref={dragGroup}>
          <group ref={rotatingGroup}>
            <mesh receiveShadow castShadow>
              <sphereGeometry args={[2.2, 64, 64]} />
              <meshStandardMaterial color="white" map={texture} roughness={0.7} />
            </mesh>
            <mesh scale={1.04}>
              <sphereGeometry args={[2.2, 64, 64]} />
              <shaderMaterial
                ref={atmosphereMaterialRef}
                vertexShader={atmosphereVertexShader}
                fragmentShader={atmosphereFragmentShader}
                uniforms={uniforms}
                transparent
                blending={THREE.AdditiveBlending}
                depthWrite={false}
                side={THREE.FrontSide}
              />
            </mesh>
          </group>
          <mesh scale={1.12}>
            <sphereGeometry args={[2.2, 32, 32]} />
            <meshBasicMaterial color={haloColor} transparent opacity={0.03} blending={THREE.AdditiveBlending} depthWrite={false} />
          </mesh>
        </group>
        {planet.moons?.map((moon) => (
          <MoonRender key={moon.name} moon={moon} active={isActive} />
        ))}
      </Float>
    </group>
  );
}

function PlanetCarousel({ activeIndex }: { activeIndex: number }) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    groupRef.current.position.x = THREE.MathUtils.lerp(groupRef.current.position.x, activeIndex * 25, delta * 3.5);
    groupRef.current.position.y = THREE.MathUtils.lerp(groupRef.current.position.y, activeIndex * 15, delta * 3.5);
  });

  return (
    <group ref={groupRef}>
      {PLANETS.map((planet, index) => (
        <SinglePlanet key={planet.id} planet={planet} index={index} isActive={index === activeIndex} />
      ))}
    </group>
  );
}

export default function AerisPlanetExplorerDemo(_: Props) {
  const [activePlanet, setActivePlanet] = useState<Planet>(PLANETS[0]);
  const activeIndex = PLANETS.findIndex((planet) => planet.id === activePlanet.id);

  return (
    <div className="h-[min(760px,calc(100vh-120px))] min-h-[620px] w-full overflow-hidden flex bg-[#f0f2f5] font-sans text-slate-800 p-4 gap-4 relative max-[760px]:h-[760px] max-[760px]:min-h-[760px]">
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(255,255,255,0.4)_0%,_transparent_70%)] opacity-80" />
        <Canvas camera={{ position: [0, 1.5, 9], fov: 45 }} onCreated={({ camera }) => camera.lookAt(0, 0, 0)}>
          <ambientLight intensity={0.5} />
          <directionalLight position={[5, 10, 5]} intensity={1.5} castShadow shadow-mapSize={1024} />
          <Environment preset="city" />
          <StaticBase />
          <InteractiveControls />
          <Suspense fallback={null}>
            <PlanetCarousel activeIndex={activeIndex} />
          </Suspense>
        </Canvas>
      </div>

      <div className="w-[320px] flex flex-col z-10 gap-4 max-[1200px]:w-[280px] max-[760px]:absolute max-[760px]:left-3 max-[760px]:right-3 max-[760px]:top-3 max-[760px]:w-auto max-[760px]:max-h-[190px] max-[760px]:overflow-hidden">
        <div className="bg-white rounded-[24px] shadow-[0_4px_20px_rgb(0,0,0,0.03)] p-6 flex flex-col shrink-0 max-[760px]:hidden">
          <div className="flex items-center gap-4 pl-2">
            <div className="w-10 h-10 rounded-full border-[2.5px] border-[#14b8a6] relative flex flex-col items-center justify-center shrink-0">
              <div className="w-2 h-2 bg-[#14b8a6] rounded-full absolute -top-[5px]" />
              <div className="w-2.5 h-2.5 bg-[#14b8a6] rounded-full" />
              <div className="absolute w-[50px] h-[50px] border-[1.5px] border-[#14b8a6] rounded-full top-[50%] left-[50%] -translate-x-[50%] -translate-y-[50%] opacity-30" />
            </div>
            <div>
              <h1 className="text-[22px] font-black tracking-[0.2em] text-[#14b8a6] uppercase leading-none">AERIS</h1>
              <p className="text-[9px] uppercase font-bold tracking-[0.2em] text-slate-400 mt-2">Explore the Expanse</p>
            </div>
          </div>
        </div>

        <div className="flex-1 bg-white rounded-[24px] shadow-[0_4px_20px_rgb(0,0,0,0.03)] flex flex-col min-h-0 overflow-hidden">
          <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar p-4 max-[760px]:flex max-[760px]:space-y-0 max-[760px]:gap-3 max-[760px]:overflow-x-auto max-[760px]:overflow-y-hidden">
            {PLANETS.map((planet) => {
              const isActive = planet.id === activePlanet.id;
              return (
                <button
                  key={planet.id}
                  onClick={() => setActivePlanet(planet)}
                  className={`w-full text-left p-3 rounded-[16px] transition-all duration-300 relative flex items-center gap-4 group overflow-hidden max-[760px]:min-w-[230px] ${
                    isActive ? "bg-white shadow-sm border border-[#14b8a6]" : "bg-white border border-slate-100 hover:border-slate-200"
                  }`}
                  type="button"
                >
                  {isActive && (
                    <div className="absolute right-0 top-0 bottom-0 w-8 bg-[#14b8a6] flex items-center justify-center rounded-r-[16px] z-10">
                      <span
                        className="text-[9px] font-bold text-white uppercase tracking-widest whitespace-nowrap"
                        style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
                      >
                        SELECTED
                      </span>
                    </div>
                  )}
                  <div className="w-[52px] h-[52px] rounded-full bg-slate-100/80 flex items-center justify-center shrink-0 overflow-hidden ml-1 border border-slate-100">
                    <div
                      className="w-[42px] h-[42px] rounded-full border border-black/5"
                      style={{
                        background: `url(${planet.textureUrl}), linear-gradient(135deg, ${planet.baseColor}, ${planet.haloColor})`,
                        backgroundSize: "150%",
                        backgroundPosition: "center",
                      }}
                    />
                  </div>
                  <div className="flex-1 pr-8 flex flex-col justify-center">
                    <div className="font-bold tracking-[0.15em] text-slate-800 text-sm">{planet.name}</div>
                    <div className="text-[10px] text-slate-400 mt-1 capitalize">{planet.subtitle}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-[24px] shadow-[0_4px_20px_rgb(0,0,0,0.03)] p-6 shrink-0 flex flex-col justify-center max-[760px]:hidden">
          <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 tracking-[0.2em] uppercase mb-5">
            <div className="flex items-center gap-2">
              <Camera className="w-4 h-4" /> Expedition Log
            </div>
            <span className="text-slate-400 tracking-wider">12 / 48</span>
          </div>
          <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-[#14b8a6] rounded-full" style={{ width: "25%" }} />
          </div>
        </div>
      </div>

      <div className="flex-1 relative z-10 pointer-events-none">
        <div className="absolute top-8 left-8 max-[760px]:top-[190px] max-[760px]:left-4 max-[760px]:right-4">
          <div className="flex items-center gap-4 mb-3">
            <Target className="w-8 h-8 text-[#f4a261]" />
            <AnimatePresence mode="wait">
              <motion.h1
                key={activePlanet.name}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
                className="text-6xl max-[760px]:text-[34px] font-black tracking-tight text-teal-600 uppercase"
              >
                {activePlanet.name}
              </motion.h1>
            </AnimatePresence>
          </div>
          <AnimatePresence mode="wait">
            <motion.div key={activePlanet.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pl-12 max-[760px]:pl-0">
              <p className="text-[14px] uppercase tracking-[0.3em] text-slate-500 mb-6">{activePlanet.subtitle}</p>
              <p className="text-sm text-slate-600 leading-relaxed max-w-sm mb-6">{activePlanet.desc}</p>

              <div className="flex flex-wrap gap-3">
                {activePlanet.tags.map((tag) => (
                  <div key={tag.text} className="flex items-center gap-2 px-4 py-2 bg-white/60 backdrop-blur-md rounded-full shadow-sm text-xs font-bold text-slate-600 tracking-wider">
                    <tag.icon className="w-4 h-4 text-teal-500" />
                    {tag.text}
                  </div>
                ))}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="absolute top-6 right-6 text-right max-[760px]:hidden">
          <div className="text-[10px] font-bold tracking-widest uppercase text-slate-400 mb-1">Sector AERIS-01</div>
          <div className="text-[10px] font-bold tracking-widest uppercase text-slate-400 mb-2">Heliocentric Dist 0.12 PX</div>
          <div className="text-xs font-bold tracking-widest uppercase text-teal-500">
            Scan <span className="text-slate-800">Active</span>
          </div>
        </div>

        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center p-2 bg-white/80 backdrop-blur-xl rounded-full shadow-lg pointer-events-auto border border-white max-[760px]:w-[calc(100%-24px)] max-[760px]:justify-between">
          <button className="flex items-center gap-2 px-6 py-3 text-slate-600 hover:text-slate-900 font-bold text-xs transition-colors tracking-widest uppercase max-[760px]:px-2 max-[760px]:text-[10px]" type="button">
            <Scale className="w-4 h-4" /> Compare
          </button>
          <button className="flex items-center gap-2 px-8 py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-full font-bold text-xs transition-colors shadow-lg shadow-teal-500/30 tracking-widest uppercase mx-2 max-[760px]:px-4 max-[760px]:text-[10px]" type="button">
            <Compass className="w-4 h-4" /> Explore
          </button>
          <button className="flex items-center gap-2 px-6 py-3 text-slate-600 hover:text-slate-900 font-bold text-xs transition-colors tracking-widest uppercase max-[760px]:px-2 max-[760px]:text-[10px]" type="button">
            <Navigation className="w-4 h-4" /> Route
          </button>
        </div>
      </div>

      <div className="w-[380px] flex flex-col gap-4 z-10 overflow-hidden max-[1200px]:absolute max-[1200px]:right-4 max-[1200px]:bottom-4 max-[1200px]:w-[min(360px,calc(100%-32px))] max-[1200px]:max-h-[48%] max-[760px]:left-3 max-[760px]:right-3 max-[760px]:bottom-[86px] max-[760px]:w-auto max-[760px]:max-h-[230px]">
        <div className="bg-white rounded-[24px] p-4 flex items-center justify-between shadow-sm max-[1200px]:hidden">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center border-2 border-white shadow-sm overflow-hidden text-slate-500">
              <User size={24} />
            </div>
            <div>
              <div className="text-sm font-black tracking-widest text-slate-800 uppercase">AURORA-7</div>
              <div className="text-[10px] text-slate-400 font-bold tracking-widest uppercase mt-1 flex items-center gap-2">
                <span className="text-teal-600">Level 28</span> 6,420 / 9,000 XP
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto space-y-4 custom-scrollbar pb-2">
          <div className="bg-white rounded-[24px] p-6 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-[10px] font-bold tracking-[0.2em] text-slate-400 uppercase">Planet Overview</h3>
              <div className="w-1.5 h-1.5 bg-teal-400 rounded-full" />
            </div>
            <AnimatePresence mode="wait">
              <motion.div key={activePlanet.id} variants={staggerListVariants} initial="hidden" animate="visible" exit="exit" className="space-y-1">
                {activePlanet.stats.map((stat) => (
                  <motion.div
                    key={stat.label}
                    variants={staggerItemVariants}
                    className="flex items-start gap-4 border-b border-slate-50 pb-3 pt-3 last:border-0 last:pb-0 font-sans"
                  >
                    <div className="text-slate-400 mt-[2px]">
                      <stat.icon className="w-4 h-4 stroke-[2]" />
                    </div>
                    <div className="flex-1 flex flex-col gap-2">
                      <div className="flex justify-between items-center w-full">
                        <span className="text-[10px] font-bold tracking-[0.2em] text-slate-500 uppercase">{stat.label}</span>
                        <span className="text-xs font-bold text-slate-800 text-right">{stat.value}</span>
                      </div>
                      <div className="flex gap-1 w-[140px]">
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => {
                          const isDifficulty = stat.label.includes("DIFFICULTY");
                          const isFilled = i <= (stat.level || 0);
                          let color = "bg-slate-100";
                          if (isFilled) {
                            color = isDifficulty ? "bg-[#f59e0b]" : "bg-[#14b8a6]";
                          }
                          return <div key={i} className={`h-[3px] flex-1 rounded-full ${color}`} />;
                        })}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="bg-white rounded-[24px] p-6 shadow-sm">
            <h3 className="text-[10px] font-bold tracking-[0.2em] text-slate-400 mb-6 uppercase">Highlights & Missions</h3>
            <AnimatePresence mode="wait">
              <motion.div key={activePlanet.id} variants={staggerListVariants} initial="hidden" animate="visible" exit="exit" className="space-y-2">
                {activePlanet.missions.map((mission) => (
                  <motion.div
                    key={mission.id}
                    variants={staggerItemVariants}
                    className="p-3 bg-white hover:bg-slate-50 rounded-2xl transition-colors cursor-pointer border border-slate-100 flex items-center justify-between group"
                  >
                    <div className="flex gap-4 items-center">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: mission.color }}>
                        <Map className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-slate-800 tracking-wider uppercase mb-1">{mission.title}</h4>
                        <p className="text-[10px] text-slate-500 leading-relaxed max-w-[180px]">{mission.desc}</p>
                      </div>
                    </div>
                    <div className="text-slate-300 group-hover:text-slate-500">
                      <Navigation className="w-4 h-4 rotate-90" />
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="bg-[#f8f9fa] rounded-2xl p-4 border border-slate-100 flex items-start gap-3">
            <Compass className="w-5 h-5 text-slate-400 flex-shrink-0" />
            <div>
              <p className="text-[10px] text-slate-500 leading-relaxed font-semibold">Use the compare tool to view planetary data side by side.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
