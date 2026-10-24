"use client";

/* R3F's frame loop intentionally mutates Three.js objects through refs. */
/* eslint-disable react-hooks/immutability */

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const sealVertex = `
  varying vec2 vUv;
  varying vec3 vNormal;
  void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const sealFragment = `
  uniform float uTime;
  uniform vec3 uEmber;
  varying vec2 vUv;
  varying vec3 vNormal;
  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float noise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1.0,0.0)), f.x), mix(hash(i + vec2(0.0,1.0)), hash(i + vec2(1.0,1.0)), f.x), f.y);
  }
  void main() {
    float edge = smoothstep(0.38, 0.50, length(vUv - 0.5));
    float grain = noise(vUv * 22.0 + uTime * 0.04) * 0.08;
    float crack = smoothstep(0.50, 0.57, noise(vUv * 10.0) + length(vUv - 0.5) * 0.35);
    vec3 wax = mix(vec3(0.22, 0.035, 0.018), uEmber * 0.55, 1.0 - edge);
    wax += grain - crack * 0.18;
    float light = 0.62 + 0.38 * max(dot(vNormal, normalize(vec3(-0.3, 0.7, 1.0))), 0.0);
    gl_FragColor = vec4(wax * light, 1.0);
  }
`;

function Embers({ count }: { count: number }) {
  const ref = useRef<THREE.Points>(null);
  const positions = useMemo(() => {
    const data = new Float32Array(count * 3);
    for (let i = 0; i < count; i += 1) {
      const seed = (i * 9301 + 49297) % 233280 / 233280;
      const seedY = (i * 49297 + 9301) % 233280 / 233280;
      const seedZ = (i * 23399 + 1721) % 233280 / 233280;
      data[i * 3] = (seed - 0.5) * 5.5;
      data[i * 3 + 1] = (seedY - 0.5) * 4.5;
      data[i * 3 + 2] = (seedZ - 0.5) * 2;
    }
    return data;
  }, [count]);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    ref.current.rotation.y = clock.getElapsedTime() * 0.025;
    ref.current.position.y = Math.sin(clock.getElapsedTime() * 0.35) * 0.08;
  });
  return <points ref={ref}><bufferGeometry><bufferAttribute attach="attributes-position" args={[positions, 3]} /></bufferGeometry><pointsMaterial color="#FF5A1F" size={0.025} transparent opacity={0.7} sizeAttenuation /></points>;
}

function SealObject({ onCrack }: { onCrack: () => void }) {
  const group = useRef<THREE.Group>(null);
  const rings = useRef<THREE.Group>(null);
  const material = useMemo(() => new THREE.ShaderMaterial({ uniforms: { uTime: { value: 0 }, uEmber: { value: new THREE.Color("#FF5A1F") } }, vertexShader: sealVertex, fragmentShader: sealFragment }), []);
  const { viewport } = useThree();
  const mouse = useRef({ x: 0, y: 0 });
  const target = useRef({ x: 0, y: 0 });
  useEffect(() => {
    const move = (event: MouseEvent) => {
      target.current.x = (event.clientX / window.innerWidth - 0.5) * 0.35;
      target.current.y = (event.clientY / window.innerHeight - 0.5) * 0.22;
    };
    window.addEventListener("mousemove", move, { passive: true });
    return () => window.removeEventListener("mousemove", move);
  }, []);
  useEffect(() => {
    if (!group.current) return;
    const context = gsap.context(() => {
      gsap.to(group.current!.scale, { x: 0.72, y: 0.72, z: 0.72, opacity: 0.2, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: 1 } });
    });
    return () => context.revert();
  }, []);
  useFrame(({ clock }) => {
    const time = clock.getElapsedTime();
    material.uniforms.uTime.value = time;
    mouse.current.x += (target.current.x - mouse.current.x) * 0.06;
    mouse.current.y += (target.current.y - mouse.current.y) * 0.06;
    if (group.current) {
      group.current.rotation.x += ((-mouse.current.y + Math.sin(time * 0.2) * 0.04) - group.current.rotation.x) * 0.04;
      group.current.rotation.y += ((time * 0.12 + mouse.current.x) - group.current.rotation.y) * 0.04;
    }
    if (rings.current) rings.current.rotation.z = Math.sin(time * 0.75) * 0.04;
  });
  return <group ref={group} scale={viewport.width < 5 ? 0.78 : 1} onClick={onCrack}>
    <mesh material={material} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[1.35, 1.42, 0.24, 64]} /></mesh>
    <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0.14, 0]}><torusGeometry args={[1.23, 0.035, 12, 64]} /><meshBasicMaterial color="#FF8B61" transparent opacity={0.65} /></mesh>
    <group ref={rings}><mesh rotation={[0.8, 0.2, 0]}><torusGeometry args={[1.82, 0.008, 8, 96]} /><meshBasicMaterial color="#FF5A1F" transparent opacity={0.4} /></mesh><mesh rotation={[1.4, 0.4, 0.3]}><torusGeometry args={[1.62, 0.006, 8, 96]} /><meshBasicMaterial color="#7CF3D0" transparent opacity={0.28} /></mesh></group>
  </group>;
}

export default function SealScene() {
  const [reduced] = useState(() => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  const [webgl] = useState(() => {
    if (typeof window === "undefined") return true;
    try { const canvas = document.createElement("canvas"); return Boolean(canvas.getContext("webgl") || canvas.getContext("experimental-webgl")); } catch { return false; }
  });
  const [cracked, setCracked] = useState(false);
  if (reduced || !webgl) return <div className="seal-fallback" role="img" aria-label="Ember wax seal with SEANCE sigil"><span> S </span><i /></div>;
  return <div className={`seal-scene ${cracked ? "is-cracked" : ""}`} aria-label="Interactive wax seal medallion"><Canvas dpr={[1, 1.5]} camera={{ position: [0, 0, 5.4], fov: 34 }} frameloop="always"><ambientLight intensity={0.35} /><pointLight position={[-2, 2, 4]} color="#FF5A1F" intensity={10} distance={8} /><Embers count={window.innerWidth < 600 ? 28 : 64} /><SealObject onCrack={() => setCracked(true)} /></Canvas><div className="seal-sigil" aria-hidden="true">S</div>{cracked && <span className="burst" aria-hidden="true" />}</div>;
}
