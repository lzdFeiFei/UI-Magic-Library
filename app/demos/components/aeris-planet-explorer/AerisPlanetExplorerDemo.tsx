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
  visible: { transition: { staggerChildren: 0.08 } },
  exit: { transition: { staggerChildren: 0.08, staggerDirection: 1 } },
};

const staggerItemVariants: Variants = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.3, ease: "easeOut" } },
  exit: { opacity: 0, x: 20, transition: { duration: 0.2, ease: "easeIn" } },
};

function StaticBase() {
  return (
    <group position={[0, -3.2, 0]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
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
      {Array.from({ length: 48 }).map((_, i) => (
        <group key={i} rotation={[0, -(i / 48) * Math.PI * 2, 0]}>
          <mesh position={[1.7, -0.04, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[0.08, 0.02]} />
            <meshBasicMaterial color="#ef476f" transparent opacity={0.8} />
          </mesh>
        </group>
      ))}
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
          {active ? (
            <Html distanceFactor={8} center position={[0, moon.size + 0.2, 0]} zIndexRange={[100, 0]}>
              <div className="aeris-moon-label">
                <div className="aeris-moon-name">{moon.name}</div>
                <div className="aeris-moon-meta">
                  Orbit: {moon.orbitRadius}U / Speed: {moon.speed}
                </div>
              </div>
            </Html>
          ) : null}
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
          <group ref={rotatingGroup} rotation={[0, planet.textureRotation ?? 0, 0]}>
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
    <div className="aeris-root">
      <div className="aeris-canvas-layer">
        <div className="aeris-canvas-glow" />
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

      <div className="aeris-left aeris-panel-stack">
        <section className="aeris-card aeris-brand-card">
          <div className="aeris-orbit-mark">
            <span />
          </div>
          <div>
            <h2>AERIS</h2>
            <p>Explore the Expanse</p>
          </div>
        </section>

        <section className="aeris-card aeris-planet-list">
          {PLANETS.map((planet) => {
            const isActive = planet.id === activePlanet.id;
            return (
              <button
                className={`aeris-planet-button${isActive ? " is-active" : ""}`}
                key={planet.id}
                onClick={() => setActivePlanet(planet)}
                type="button"
              >
                <span className="aeris-thumb-shell">
                  <span
                    className="aeris-thumb"
                    style={{ backgroundImage: `url(${planet.textureUrl}), linear-gradient(135deg, ${planet.baseColor}, ${planet.haloColor})` }}
                  />
                </span>
                <span className="aeris-planet-copy">
                  <strong>{planet.name}</strong>
                  <span>{planet.subtitle}</span>
                </span>
                {isActive ? <span className="aeris-selected">Selected</span> : null}
              </button>
            );
          })}
        </section>

        <section className="aeris-card aeris-log-card">
          <div className="aeris-card-kicker">
            <span>
              <Camera size={16} /> Expedition Log
            </span>
            <span>12 / 48</span>
          </div>
          <div className="aeris-progress">
            <span />
          </div>
        </section>
      </div>

      <main className="aeris-center">
        <div className="aeris-title-block">
          <div className="aeris-title-row">
            <Target size={32} />
            <AnimatePresence mode="wait">
              <motion.h1
                key={activePlanet.name}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
              >
                {activePlanet.name}
              </motion.h1>
            </AnimatePresence>
          </div>
          <AnimatePresence mode="wait">
            <motion.div key={activePlanet.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="aeris-description">
              <p className="aeris-subtitle">{activePlanet.subtitle}</p>
              <p>{activePlanet.desc}</p>
              <div className="aeris-tags">
                {activePlanet.tags.map((tag) => (
                  <span key={tag.text}>
                    <tag.icon size={16} />
                    {tag.text}
                  </span>
                ))}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="aeris-sector">
          <span>Sector AERIS-01</span>
          <span>Heliocentric Dist 0.12 PX</span>
          <strong>
            Scan <b>Active</b>
          </strong>
        </div>

        <div className="aeris-action-bar">
          <button type="button">
            <Scale size={16} /> Compare
          </button>
          <button className="is-primary" type="button">
            <Compass size={16} /> Explore
          </button>
          <button type="button">
            <Navigation size={16} /> Route
          </button>
        </div>
      </main>

      <aside className="aeris-right aeris-panel-stack">
        <section className="aeris-card aeris-user-card">
          <span className="aeris-avatar">
            <User size={24} />
          </span>
          <div>
            <strong>AURORA-7</strong>
            <p>
              <span>Level 28</span> 6,420 / 9,000 XP
            </p>
          </div>
        </section>

        <section className="aeris-scroll-stack">
          <div className="aeris-card">
            <div className="aeris-card-heading">
              <h3>Planet Overview</h3>
              <span />
            </div>
            <AnimatePresence mode="wait">
              <motion.div
                key={activePlanet.id}
                className="aeris-stat-list"
                variants={staggerListVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                {activePlanet.stats.map((stat) => (
                  <motion.div className="aeris-stat" key={stat.label} variants={staggerItemVariants}>
                    <stat.icon size={16} />
                    <div>
                      <div className="aeris-stat-top">
                        <span>{stat.label}</span>
                        <strong>{stat.value}</strong>
                      </div>
                      <div className="aeris-meter">
                        {Array.from({ length: 8 }).map((__, i) => (
                          <span
                            className={i < (stat.level ?? 0) ? (stat.label.includes("DIFFICULTY") ? "is-warning" : "is-filled") : ""}
                            key={i}
                          />
                        ))}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="aeris-card">
            <h3 className="aeris-section-title">Highlights & Missions</h3>
            <AnimatePresence mode="wait">
              <motion.div
                key={activePlanet.id}
                className="aeris-mission-list"
                variants={staggerListVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                {activePlanet.missions.map((mission) => (
                  <motion.button className="aeris-mission" key={mission.id} type="button" variants={staggerItemVariants}>
                    <span className="aeris-mission-icon" style={{ backgroundColor: mission.color }}>
                      <Map size={20} />
                    </span>
                    <span>
                      <strong>{mission.title}</strong>
                      <small>{mission.desc}</small>
                    </span>
                    <Navigation size={16} />
                  </motion.button>
                ))}
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="aeris-info-strip">
            <Compass size={20} />
            <p>Use the compare tool to view planetary data side by side.</p>
          </div>
        </section>
      </aside>
    </div>
  );
}
