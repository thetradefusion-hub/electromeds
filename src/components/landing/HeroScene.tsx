import React, { useRef, useMemo, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, MeshDistortMaterial, Sphere } from '@react-three/drei';
import type { Mesh, Points } from 'three';

/** Disabled: Intel HD and similar GPUs fail with "BindToCurrentSequence" – 3D causes crashes. Set true to re-enable for supported devices. */
const WEBGL_ENABLED = false;

function isWebGLSupported(): boolean {
  if (!WEBGL_ENABLED || typeof window === 'undefined') return false;
  try {
    const canvas = document.createElement('canvas');
    const attrs: WebGLContextAttributes = { failIfMajorPerformanceCaveat: true, alpha: true };
    const gl =
      canvas.getContext('webgl2', attrs) ||
      canvas.getContext('webgl', attrs) ||
      (canvas.getContext('experimental-webgl') as WebGLRenderingContext | null);
    return !!gl;
  } catch {
    return false;
  }
}

function FloatingOrbs() {
  const orbs = useMemo(() => {
    return Array.from({ length: 8 }, (_, i) => ({
      position: [
        (Math.random() - 0.5) * 12,
        (Math.random() - 0.5) * 8,
        (Math.random() - 0.5) * 6 - 2,
      ] as [number, number, number],
      scale: 0.4 + Math.random() * 0.6,
      speed: 0.8 + Math.random() * 0.8,
      color: i % 3 === 0 ? '#14b8a6' : i % 3 === 1 ? '#10b981' : '#2dd4bf',
    }));
  }, []);

  return (
    <>
      {orbs.map((orb, i) => (
        <Float key={i} speed={orb.speed} rotationIntensity={0.08} floatIntensity={0.6}>
          <Sphere args={[orb.scale, 32, 32]} position={orb.position}>
            <meshBasicMaterial
              color={orb.color}
              transparent
              opacity={0.14}
              depthWrite={false}
            />
          </Sphere>
        </Float>
      ))}
    </>
  );
}

function ParticleField() {
  const count = 120;
  const particles = useRef<Points | null>(null);
  const pos = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 20;
      arr[i * 3 + 1] = (Math.random() - 0.5) * 16;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 10 - 3;
    }
    return arr;
  }, []);

  useFrame((state) => {
    if (!particles.current) return;
    particles.current.rotation.y = state.clock.elapsedTime * 0.02;
  });

  return (
    <points ref={particles}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={pos}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.08}
        color="#14b8a6"
        transparent
        opacity={0.4}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  );
}

function CentralOrb() {
  const mesh = useRef<Mesh>(null);
  useFrame((state) => {
    if (!mesh.current) return;
    mesh.current.rotation.x = state.clock.elapsedTime * 0.08;
    mesh.current.rotation.y = state.clock.elapsedTime * 0.12;
  });

  return (
    <Sphere ref={mesh} args={[1.8, 48, 48]} position={[0, 0, -4]}>
      <MeshDistortMaterial
        color="#0d9488"
        distort={0.15}
        speed={1.2}
        roughness={0}
        metalness={0}
        transparent
        opacity={0.07}
      />
    </Sphere>
  );
}

function SceneContent() {
  return (
    <>
      <ambientLight intensity={0.4} />
      <pointLight position={[10, 10, 10]} intensity={0.6} />
      <pointLight position={[-10, -10, 5]} intensity={0.3} color="#14b8a6" />
      <CentralOrb />
      <FloatingOrbs />
      <ParticleField />
    </>
  );
}

export function HeroScene() {
  const [webGLAvailable, setWebGLAvailable] = useState<boolean | null>(null);
  const [webGLError, setWebGLError] = useState(false);

  useEffect(() => {
    setWebGLAvailable(isWebGLSupported());
  }, []);

  if (webGLAvailable === null) return null;
  if (!webGLAvailable || webGLError) return null;

  return (
    <div className="absolute inset-0 -z-10">
      <ErrorBoundary onError={() => setWebGLError(true)}>
        <Canvas
          camera={{ position: [0, 0, 8], fov: 55 }}
          gl={{
            alpha: true,
            antialias: true,
            powerPreference: 'low-power',
            failIfMajorPerformanceCaveat: false,
          }}
          dpr={[1, 1.5]}
          style={{ background: 'transparent' }}
          onCreated={() => {}}
          onError={() => setWebGLError(true)}
        >
          <SceneContent />
        </Canvas>
      </ErrorBoundary>
    </div>
  );
}

class ErrorBoundary extends React.Component<
  { children: React.ReactNode; onError: () => void },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode; onError: () => void }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch() {
    this.props.onError();
  }
  render() {
    if (this.state.hasError) return null;
    return this.props.children;
  }
}
