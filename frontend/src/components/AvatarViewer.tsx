"use client";

import React, { Suspense, useRef, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Environment, Html, useProgress, useGLTF } from "@react-three/drei";

function Model({ src }: { src: string }) {
  const gltf = useGLTF(src);
  const ref = useRef<any>(null);
  const bobRef = useRef<{ startY: number | null }>({ startY: null });
  // slow spin
  useFrame(() => {
    if (ref.current) ref.current.rotation.y += 0.0025;
  });

  // Lower and center the whole model so it sits nicely in the frame.
  // Add a subtle up-and-down bobbing motion using a sine wave.
  useFrame((state) => {
    if (!ref.current) return;
    // store original Y on first frame
    if (bobRef.current.startY === null) {
      // raise the group's base Y a bit more for a slightly higher framing
      bobRef.current.startY = -0.4;
    }
    const t = state.clock.getElapsedTime();
    const amplitude = 0.04; // how far up/down the bob goes
    const speed = 1.2; // speed multiplier for the sine wave
  const y = (bobRef.current.startY ?? -0.4) + Math.sin(t * speed) * amplitude;
    // apply position to the group's y component
    (ref.current.parent ?? ref.current).position.y = y;
  });

  return (
    // nudged a bit higher for better composition; we'll animate the group's Y
    <group ref={ref} position={[0, -0.4, 0]} scale={0.9}>
      <primitive object={gltf.scene} />
    </group>
  );
}

function Loader() {
  const { progress } = useProgress();
  return (
    <Html center>
      <div className="text-sm text-gray-300">Loading avatar {Math.round(progress)}%</div>
    </Html>
  );
}

export default function AvatarViewer({ src = "/model/soumika.glb" }: { src?: string }) {
  const controlsRef = useRef<any>(null);

  // keep controls target aligned with the lowered model
  useEffect(() => {
    if (controlsRef.current?.target?.set) {
      // match the lowered model position
      // updated to match the slightly raised model position
      controlsRef.current.target.set(0, -0.3, 0);
      controlsRef.current.update?.();
    }
  }, []);

  return (
    <div className="w-full h-full rounded-2xl overflow-hidden">
      <Canvas camera={{ position: [0, 1.0, 3.2], fov: 45 }}>
        {/* Match AvatarDashBoard lighting/contrast */}
        <ambientLight intensity={1.2} />
        <directionalLight intensity={1.2} position={[5, 10, 7]} />
        <hemisphereLight args={["#f0f6ff", "#222222", 0.5]} />
        <Suspense fallback={<Loader />}>
          <Model src={src} />
        </Suspense>
        <OrbitControls
          ref={controlsRef}
          enablePan={true}
          enableZoom={true}
          autoRotate={false}
          // max/min distances to keep model framed nicely
          minDistance={1.2}
          maxDistance={6}
        />
      </Canvas>
    </div>
  );
}

// Note: This component requires the following packages to be installed in the frontend
// npm install three @react-three/fiber @react-three/drei
