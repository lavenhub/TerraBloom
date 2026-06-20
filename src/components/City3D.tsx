"use client";

/**
 * City3D — TerraBloom Living City Renderer
 *
 * Every visual parameter is driven by the CityRulebook (cityRules.ts).
 * Score 0 = ruined, polluted, dying. Score 100 = lush mega-city.
 * Each +1 score point produces exact, measurable changes per the rulebook.
 */

import { useRef, useMemo, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Sparkles, Cloud, Environment } from "@react-three/drei";
import * as THREE from "three";
import type { CityState } from "@/store/useTerraStore";
import { computeRules } from "@/lib/cityRules";
import type { CityRules } from "@/lib/cityRules";

// ── Seeded pseudo-random (deterministic layout) ────────────────────
function rng(seed: number, offset: number): number {
  const x = Math.sin(seed * 127.1 + offset * 311.7) * 43758.5453;
  return x - Math.floor(x);
}

// ─────────────────────────────────────────────────────────────────────
// BUILDING
// ─────────────────────────────────────────────────────────────────────
function Building({
  x, z, rules, idx,
}: {
  x: number; z: number; rules: CityRules; idx: number;
}) {
  const bodyRef  = useRef<THREE.Mesh>(null);
  const roofRef  = useRef<THREE.Mesh>(null);

  const height = rng(idx, 2) * rules.buildingMaxHeight + 0.4;
  const width  = 0.25 + rng(idx, 3) * 0.35 + (rules.score / 100) * 0.35;

  const bodyColor = useMemo(() =>
    new THREE.Color().setHSL(rules.buildingColorH, rules.buildingColorS, rules.buildingColorL),
    [rules.buildingColorH, rules.buildingColorS, rules.buildingColorL]
  );

  // Window glow: warm at high score, dull at low
  const windowColor = useMemo(() =>
    new THREE.Color().setHSL(
      0.10 + (rules.score / 100) * 0.06,
      0.5,
      0.45 + (rules.score / 100) * 0.25
    ), [rules.score]
  );

  const hasGarden = rng(idx, 4) < rules.rooftopGardenThreshold;
  const hasSolar  = rng(idx, 5) < rules.solarPanelThreshold;

  // Micro-float animation
  useFrame((state) => {
    if (bodyRef.current) {
      bodyRef.current.position.y =
        height / 2 + Math.sin(state.clock.elapsedTime * 0.25 + idx) * 0.008;
    }
  });

  const windowRows = Math.max(1, Math.floor(height * 2.2));

  return (
    <group position={[x, 0, z]}>
      {/* Main body */}
      <mesh ref={bodyRef} castShadow receiveShadow position={[0, height / 2, 0]}>
        <boxGeometry args={[width, height, width]} />
        <meshStandardMaterial color={bodyColor} roughness={0.65} metalness={0.08} />
      </mesh>

      {/* Window strips — front face */}
      {Array.from({ length: windowRows }).map((_, i) => (
        <mesh
          key={i}
          position={[0, 0.3 + i * (height / windowRows), width / 2 + 0.005]}
        >
          <planeGeometry args={[width * 0.55, 0.07]} />
          <meshStandardMaterial
            color={windowColor}
            emissive={windowColor}
            emissiveIntensity={0.55 + (rules.score / 100) * 0.3}
            transparent
            opacity={0.85}
          />
        </mesh>
      ))}

      {/* Rooftop garden */}
      {hasGarden && (
        <mesh position={[0, height + 0.05, 0]} ref={roofRef}>
          <boxGeometry args={[width * 0.92, 0.08, width * 0.92]} />
          <meshStandardMaterial
            color={new THREE.Color().setHSL(0.33, 0.75, 0.28 + (rules.score / 100) * 0.12)}
            roughness={0.92}
          />
        </mesh>
      )}

      {/* Solar panel */}
      {hasSolar && !hasGarden && (
        <mesh
          position={[0, height + 0.07, 0]}
          rotation={[-Math.PI / 7, 0, 0]}
        >
          <planeGeometry args={[width * 0.72, width * 0.52]} />
          <meshStandardMaterial
            color="#1a3050"
            emissive="#1e3a8a"
            emissiveIntensity={0.25 + (rules.score / 100) * 0.25}
            metalness={0.85}
            roughness={0.18}
          />
        </mesh>
      )}
    </group>
  );
}

// ─────────────────────────────────────────────────────────────────────
// TREE
// ─────────────────────────────────────────────────────────────────────
function Tree({ x, z, scale, rules }: { x: number; z: number; scale: number; rules: CityRules }) {
  const groupRef = useRef<THREE.Group>(null);
  const s = rules.score / 100;

  const leafColor = useMemo(() =>
    new THREE.Color().setHSL(rules.treeColorH, rules.treeColorS, rules.treeColorL),
    [rules.treeColorH, rules.treeColorS, rules.treeColorL]
  );
  const leafColorTop = useMemo(() =>
    new THREE.Color().setHSL(rules.treeColorH, rules.treeColorS + 0.1, rules.treeColorL + 0.08),
    [rules.treeColorH, rules.treeColorS, rules.treeColorL]
  );
  const trunkColor = new THREE.Color().setHSL(0.07, 0.35 + s * 0.15, 0.18 + s * 0.08);

  // Gentle sway
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.4 + x) * 0.025;
      groupRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.3 + z) * 0.015;
    }
  });

  return (
    <group ref={groupRef} position={[x, 0, z]} scale={scale}>
      {/* Trunk */}
      <mesh position={[0, 0.18, 0]} castShadow>
        <cylinderGeometry args={[0.045, 0.075, 0.36, 7]} />
        <meshStandardMaterial color={trunkColor} roughness={1} />
      </mesh>
      {/* Three canopy cones */}
      <mesh position={[0, 0.58, 0]} castShadow>
        <coneGeometry args={[0.38, 0.62, 9]} />
        <meshStandardMaterial color={leafColor} roughness={0.88} />
      </mesh>
      <mesh position={[0, 0.84, 0]} castShadow>
        <coneGeometry args={[0.26, 0.47, 9]} />
        <meshStandardMaterial color={leafColor} roughness={0.88} />
      </mesh>
      <mesh position={[0, 1.05, 0]} castShadow>
        <coneGeometry args={[0.16, 0.32, 9]} />
        <meshStandardMaterial color={leafColorTop} roughness={0.85} />
      </mesh>
    </group>
  );
}

// ─────────────────────────────────────────────────────────────────────
// WIND TURBINE
// ─────────────────────────────────────────────────────────────────────
function WindTurbine({ x, z, rules }: { x: number; z: number; rules: CityRules }) {
  const bladesRef = useRef<THREE.Group>(null);

  useFrame(() => {
    if (bladesRef.current) {
      bladesRef.current.rotation.z += rules.turbineSpeed;
    }
  });

  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 0.9, 0]}>
        <cylinderGeometry args={[0.035, 0.055, 1.8, 8]} />
        <meshStandardMaterial color="#d1d5db" metalness={0.35} roughness={0.55} />
      </mesh>
      <group ref={bladesRef} position={[0, 1.8, 0.06]}>
        {[0, 120, 240].map((angle, i) => (
          <mesh key={i} rotation={[0, 0, (angle * Math.PI) / 180]} position={[0, 0.32, 0]}>
            <boxGeometry args={[0.036, 0.65, 0.018]} />
            <meshStandardMaterial color="#f3f4f6" metalness={0.2} roughness={0.45} />
          </mesh>
        ))}
        <mesh>
          <sphereGeometry args={[0.065, 8, 8]} />
          <meshStandardMaterial color="#e5e7eb" metalness={0.5} roughness={0.35} />
        </mesh>
      </group>
    </group>
  );
}

// ─────────────────────────────────────────────────────────────────────
// SOLAR FIELD (ground panels, score ≥ 60)
// ─────────────────────────────────────────────────────────────────────
function SolarField({ x, z, rules }: { x: number; z: number; rules: CityRules }) {
  return (
    <group position={[x, 0.02, z]}>
      {[0, 0.55, 1.1].map((ox, i) => (
        <mesh key={i} position={[ox, 0.12, 0]} rotation={[-Math.PI / 5, 0, 0]}>
          <planeGeometry args={[0.45, 0.32]} />
          <meshStandardMaterial
            color="#1a2d4a"
            emissive="#1e3a8a"
            emissiveIntensity={0.18 + (rules.score / 100) * 0.22}
            metalness={0.9}
            roughness={0.12}
          />
        </mesh>
      ))}
    </group>
  );
}

// ─────────────────────────────────────────────────────────────────────
// LAKE
// ─────────────────────────────────────────────────────────────────────
function Lake({ rules }: { rules: CityRules }) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      const mat = meshRef.current.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity =
        0.05 + (rules.score / 100) * 0.15 +
        Math.sin(state.clock.elapsedTime * 0.7) * 0.03;
    }
  });

  if (!rules.lakePresent) return null;

  const waterColor = new THREE.Color().setHSL(
    rules.lakeClarityH, rules.lakeClarityS, rules.lakeClarityL
  );

  return (
    <mesh ref={meshRef} position={[-3.5, 0.008, 3.5]} rotation={[-Math.PI / 2, 0, 0]}>
      <circleGeometry args={[rules.lakeRadius, 48]} />
      <meshStandardMaterial
        color={waterColor}
        emissive={waterColor}
        emissiveIntensity={0.05}
        metalness={0.92}
        roughness={0.08}
        transparent
        opacity={0.88}
      />
    </mesh>
  );
}

// ─────────────────────────────────────────────────────────────────────
// POLLUTION HAZE
// ─────────────────────────────────────────────────────────────────────
function PollutionHaze({ rules }: { rules: CityRules }) {
  const ref = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.y += 0.0005;
      const mat = ref.current.material as THREE.MeshStandardMaterial;
      // Breathing effect
      mat.opacity =
        rules.hazeOpacity * (0.75 + Math.sin(state.clock.elapsedTime * 0.4) * 0.25);
    }
  });

  if (!rules.hazePresent || rules.hazeOpacity < 0.01) return null;

  return (
    <mesh ref={ref} position={[0, 2.8, 0]}>
      <sphereGeometry args={[8, 20, 10]} />
      <meshStandardMaterial
        color={new THREE.Color(0.30, 0.26, 0.20)}
        transparent
        opacity={rules.hazeOpacity}
        depthWrite={false}
        side={THREE.BackSide}
      />
    </mesh>
  );
}

// ─────────────────────────────────────────────────────────────────────
// GROUND + ROADS
// ─────────────────────────────────────────────────────────────────────
function Ground({ rules }: { rules: CityRules }) {
  const groundColor = new THREE.Color().setHSL(rules.groundH, rules.groundS, rules.groundL);
  const roadColor   = new THREE.Color().setHSL(0, 0, rules.roadLightness);

  const roads = [
    { rot: [-Math.PI / 2, 0, 0]           as [number,number,number], size: [0.65, 32] as [number,number] },
    { rot: [-Math.PI / 2, 0, Math.PI / 2] as [number,number,number], size: [0.65, 32] as [number,number] },
    { rot: [-Math.PI / 2, 0, Math.PI / 4] as [number,number,number], size: [0.45, 28] as [number,number] },
    { rot: [-Math.PI / 2, 0,-Math.PI / 4] as [number,number,number], size: [0.45, 28] as [number,number] },
  ];

  return (
    <group>
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.005, 0]}>
        <planeGeometry args={[36, 36]} />
        <meshStandardMaterial color={groundColor} roughness={0.96} />
      </mesh>
      {roads.map((r, i) => (
        <mesh key={i} rotation={r.rot} position={[0, 0.001, 0]}>
          <planeGeometry args={r.size} />
          <meshStandardMaterial color={roadColor} roughness={0.9} />
        </mesh>
      ))}
    </group>
  );
}

// ─────────────────────────────────────────────────────────────────────
// FULL SCENE
// ─────────────────────────────────────────────────────────────────────
function CityScene({ score }: { score: number }) {
  const rules = useMemo(() => computeRules(score), [score]);

  // ── Layout (deterministic, score-aware spread) ──────────────────
  const layout = useMemo(() => {
    // Buildings
    const buildings = Array.from({ length: rules.buildingCount }, (_, i) => {
      const angle  = rng(i, 10) * Math.PI * 2;
      const radius = rng(i, 11) * rules.buildingSpread;
      return { x: Math.cos(angle) * radius, z: Math.sin(angle) * radius, idx: i };
    });

    // Trees (placed outside building cluster when possible)
    const trees = Array.from({ length: rules.treeCount }, (_, i) => {
      const angle  = rng(i + 100, 20) * Math.PI * 2;
      const radius = rng(i + 100, 21) * rules.treeSpread;
      const scale  = rules.treeMinScale + rng(i + 100, 22) * (rules.treeMaxScale - rules.treeMinScale);
      return { x: Math.cos(angle) * radius, z: Math.sin(angle) * radius, scale };
    });

    // Turbines (placed on edges of city)
    const turbines = Array.from({ length: rules.turbineCount }, (_, i) => {
      const angle  = (i / Math.max(rules.turbineCount, 1)) * Math.PI * 2;
      const radius = rules.buildingSpread + 1.5 + rng(i + 200, 30) * 2;
      return { x: Math.cos(angle) * radius, z: Math.sin(angle) * radius };
    });

    // Solar fields (near turbines, score ≥ 60)
    const solarFields = Array.from({ length: rules.solarFieldCount }, (_, i) => {
      const angle  = (i / Math.max(rules.solarFieldCount, 1)) * Math.PI * 2 + 0.4;
      const radius = rules.buildingSpread * 0.7 + rng(i + 300, 40) * 2;
      return { x: Math.cos(angle) * radius, z: Math.sin(angle) * radius };
    });

    return { buildings, trees, turbines, solarFields };
  }, [rules]);

  // ── Sun colour ─────────────────────────────────────────────────
  const s = score / 100;
  const sunColor = new THREE.Color().setHSL(0.12, 0.40 + s * 0.30, 0.60 + s * 0.20);

  return (
    <>
      {/* ── LIGHTING ────────────────────────────────────────── */}
      <ambientLight intensity={rules.ambientIntensity} color="#d4edd4" />
      <directionalLight
        position={[12, 18, 6]}
        intensity={rules.sunIntensity}
        color={sunColor}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-far={40}
        shadow-camera-left={-15}
        shadow-camera-right={15}
        shadow-camera-top={15}
        shadow-camera-bottom={-15}
      />
      <directionalLight position={[-6, 6, -6]} intensity={0.25} color="#99ccff" />
      {rules.greenLightActive && (
        <pointLight
          position={[0, 6, 0]}
          intensity={rules.greenLightIntensity}
          color="#22c55e"
          distance={22}
          decay={2}
        />
      )}

      {/* ── GROUND + ROADS ──────────────────────────────────── */}
      <Ground rules={rules} />

      {/* ── BUILDINGS ───────────────────────────────────────── */}
      {layout.buildings.map((b, i) => (
        <Building key={i} x={b.x} z={b.z} rules={rules} idx={b.idx} />
      ))}

      {/* ── TREES ───────────────────────────────────────────── */}
      {layout.trees.map((t, i) => (
        <Tree key={i} x={t.x} z={t.z} scale={t.scale} rules={rules} />
      ))}

      {/* ── WIND TURBINES ───────────────────────────────────── */}
      {layout.turbines.map((t, i) => (
        <WindTurbine key={i} x={t.x} z={t.z} rules={rules} />
      ))}

      {/* ── SOLAR FIELDS ────────────────────────────────────── */}
      {layout.solarFields.map((sf, i) => (
        <SolarField key={i} x={sf.x} z={sf.z} rules={rules} />
      ))}

      {/* ── LAKE ────────────────────────────────────────────── */}
      <Lake rules={rules} />

      {/* ── POLLUTION HAZE ──────────────────────────────────── */}
      <PollutionHaze rules={rules} />

      {/* ── BIODIVERSITY PARTICLES ──────────────────────────── */}
      {rules.particlesActive && (
        <Sparkles
          count={rules.particleCount}
          scale={[rules.treeSpread * 1.8, 5, rules.treeSpread * 1.8]}
          size={1.2 + s * 0.8}
          speed={0.3 + s * 0.4}
          color={score >= 60 ? "#22c55e" : "#86efac"}
          opacity={0.4 + s * 0.3}
          position={[0, 1.5, 0]}
        />
      )}

      {/* ── CLOUDS ──────────────────────────────────────────── */}
      {rules.cloudCount >= 1 && (
        <Cloud position={[-5, 7, -9]} speed={0.08} opacity={rules.cloudOpacity} color="#e8f5e9" />
      )}
      {rules.cloudCount >= 2 && (
        <Cloud position={[5, 8, -11]} speed={0.06} opacity={rules.cloudOpacity * 0.8} color="#f0fdf4" />
      )}
      {rules.cloudCount >= 3 && (
        <Cloud position={[0, 9, -13]} speed={0.05} opacity={rules.cloudOpacity * 0.6} color="#ffffff" />
      )}
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────
// EXPORT
// ─────────────────────────────────────────────────────────────────────
interface City3DProps {
  cityState: CityState;
  interactive?: boolean;
  className?: string;
  cameraPosition?: [number, number, number];
}

export default function City3D({
  cityState,
  interactive = true,
  className = "",
  cameraPosition = [10, 7, 10],
}: City3DProps) {
  return (
    <div className={`w-full h-full ${className}`} style={{ background: "transparent" }}>
      <Canvas
        shadows
        camera={{ position: cameraPosition, fov: 48 }}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        style={{ background: "transparent" }}
      >
        <Suspense fallback={null}>
          <CityScene score={cityState.overallScore} />
          <Environment preset="night" />
          {interactive && (
            <OrbitControls
              enableZoom={false}
              enablePan={false}
              autoRotate
              autoRotateSpeed={0.4}
              maxPolarAngle={Math.PI / 2.1}
              minPolarAngle={Math.PI / 5}
            />
          )}
        </Suspense>
      </Canvas>
    </div>
  );
}
