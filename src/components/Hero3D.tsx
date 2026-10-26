"use client";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, Lightformer, Float } from "@react-three/drei";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";

function Bottle() {
  const g = useRef<THREE.Group>(null);
  const target = useRef({ x: 0, y: 0 });
  useEffect(() => {
    const m = (e: PointerEvent) => { target.current = { x: (e.clientX / innerWidth - 0.5) * 0.8, y: (e.clientY / innerHeight - 0.5) * 0.4 }; };
    addEventListener("pointermove", m); return () => removeEventListener("pointermove", m);
  }, []);
  useFrame((st, dt) => {
    if (!g.current) return;
    const sc = Math.min(scrollY / innerHeight, 1.5);
    g.current.rotation.y += dt * 0.35;
    g.current.rotation.x = THREE.MathUtils.lerp(g.current.rotation.x, target.current.y + sc * 0.4, 0.05);
    g.current.position.x = THREE.MathUtils.lerp(g.current.position.x, target.current.x, 0.05);
    st.camera.position.z = 6 - sc * 1.5; st.camera.position.y = 0.4 - sc * 0.6; st.camera.lookAt(0, 0, 0);
  });
  const glass = { transmission: 1, thickness: 0.8, roughness: 0.02, ior: 1.5, color: "#ffffff", transparent: true } as const;
  return (
    <Float speed={1.2} rotationIntensity={0.1} floatIntensity={0.4}>
      <group ref={g}>
        <mesh><boxGeometry args={[1.5, 2.1, 0.8]} /><meshPhysicalMaterial {...glass} /></mesh>
        <mesh scale={[0.9, 0.78, 0.82]} position={[0, -0.12, 0]}><boxGeometry args={[1.5, 2.1, 0.8]} /><meshPhysicalMaterial color="#c9a24a" roughness={0.1} transmission={0.6} thickness={0.5} /></mesh>
        <mesh position={[0, 1.3, 0]}><cylinderGeometry args={[0.28, 0.32, 0.5, 40]} /><meshStandardMaterial color="#b8924a" metalness={1} roughness={0.18} /></mesh>
        <mesh position={[0, 1.7, 0]}><cylinderGeometry args={[0.42, 0.42, 0.45, 48]} /><meshStandardMaterial color="#d8b765" metalness={1} roughness={0.12} /></mesh>
      </group>
    </Float>);
}
function Particles() {
  const ref = useRef<THREE.Points>(null);
  const pos = useMemo(() => Float32Array.from({ length: 240 }, () => (Math.random() - 0.5) * 8), []);
  useFrame((_, dt) => { if (ref.current) ref.current.rotation.y += dt * 0.03; });
  return <points ref={ref}><bufferGeometry><bufferAttribute attach="attributes-position" args={[pos, 3]} /></bufferGeometry><pointsMaterial size={0.03} color="#e8d9b0" transparent opacity={0.6} /></points>;
}
export function StaticBottle() {
  return (<div role="img" aria-label="Luxury perfume bottle" className="grid h-full w-full place-items-center">
    <svg viewBox="0 0 200 300" className="h-4/5"><rect x="80" y="10" width="40" height="40" fill="#d8b765" /><rect x="90" y="50" width="20" height="16" fill="#b8924a" />
      <rect x="40" y="66" width="120" height="210" rx="10" fill="#c9a24a" fillOpacity=".55" stroke="#e8d9b0" strokeWidth="2" /></svg></div>);
}
export default function Hero3D() {
  const [ok, setOk] = useState<boolean | null>(null);
  useEffect(() => {
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    let gl = false; try { const c = document.createElement("canvas"); gl = !!(c.getContext("webgl2") || c.getContext("webgl")); } catch {}
    setOk(gl && !reduce);
  }, []);
  if (!ok) return <StaticBottle />;
  return (
    <Canvas dpr={[1, 1.75]} camera={{ position: [0, 0.4, 6], fov: 35 }} aria-hidden="true" gl={{ antialias: true, alpha: true }}>
      <ambientLight intensity={0.3} /><spotLight position={[4, 6, 5]} angle={0.4} penumbra={1} intensity={60} color="#fff3d6" />
      <Environment resolution={256}>
        <Lightformer form="rect" intensity={4} position={[0, 5, -4]} scale={[10, 3, 1]} />
        <Lightformer form="rect" intensity={2} position={[-5, 1, 2]} scale={[2, 6, 1]} />
        <Lightformer form="rect" intensity={2} position={[5, 1, 2]} scale={[2, 6, 1]} />
      </Environment>
      <Bottle /><Particles />
    </Canvas>);
}
