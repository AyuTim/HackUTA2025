"use client";
import React, { Suspense, useRef, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment, Html, useGLTF } from "@react-three/drei";
import * as THREE from "three";

function Model({ url, offsetY = -0.2, scale = 1 }: { url: string; offsetY?: number; scale?: number }) {
  // useGLTF handles loader instantiation and supports DRACO if configured in the build.
  // Make sure to install `@react-three/drei` which re-exports useGLTF.
  // The hook returns a GLTF object; we render its scene and center it.
  const gltf = useGLTF(url) as any;
  const ref = useRef<THREE.Group | null>(null);

  useEffect(() => {
    if (!gltf || !gltf.scene || !ref.current) return;

    // Compute bounding box and center the model at the origin, then apply offsetY
    const box = new THREE.Box3().setFromObject(gltf.scene);
    const center = new THREE.Vector3();
    box.getCenter(center);

    // Move the group so the model's center is at (0, offsetY, 0)
    ref.current.position.set(-center.x, -center.y + offsetY, -center.z);
  }, [gltf, offsetY]);

  return (
    <group ref={ref} scale={[scale, scale, scale]}>
      <primitive object={gltf.scene} dispose={null} />
    </group>
  );
}

function Loader() {
  // Avoid using `useProgress()` here because progress updates may call setState
  // while another component is rendering which can trigger React's "setState in render"
  // warning. Use a static fallback instead.
  return <Html center>Loading model…</Html>;
}

export default function AvatarCanvas({ modelPath = "/models/soumika.glb", offsetY = -0.2, scale = 1 }: { modelPath?: string; offsetY?: number; scale?: number }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-black/40 p-4">
      <div className="aspect-video rounded-xl bg-[linear-gradient(120deg,#151a22,#0f141a)] relative overflow-hidden">
        <Canvas camera={{ position: [0, 1.6, 3], fov: 50 }}>
          <ambientLight intensity={0.6} />
          <directionalLight intensity={0.6} position={[5, 10, 5]} />
          <Suspense fallback={<Loader />}>
            <Environment preset="city" />
            <Model url={modelPath} offsetY={offsetY} scale={scale} />
          </Suspense>
          <OrbitControls autoRotate autoRotateSpeed={0.6} />
        </Canvas>
      </div>
    </div>
  );
}
