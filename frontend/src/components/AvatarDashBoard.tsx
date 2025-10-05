"use client";

import React, { Suspense, useMemo, useState, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, useGLTF, Html } from "@react-three/drei";

type PartName =
  | "Head"
  | "Arms"
  | "Legs"
  | "Stomach"
  | "Feet"
  | "Back"
  | "Unknown";

function mapMeshNameToPart(name: string | undefined): PartName {
  if (!name) return "Unknown";
  const n = name.toLowerCase();
  if (n.includes("head") || n.includes("skull")) return "Head";
  if (n.includes("arm") || n.includes("shoulder") || n.includes("hand")) return "Arms";
  if (n.includes("leg") || n.includes("thigh") || n.includes("knee")) return "Legs";
  if (n.includes("stomach") || n.includes("torso") || n.includes("abdomen") || n.includes("chest")) return "Stomach";
  if (n.includes("foot") || n.includes("feet") || n.includes("toe")) return "Feet";
  if (n.includes("back") || n.includes("spine")) return "Back";
  return "Unknown";
}

function Model({ url, onPartClick }: { url: string; onPartClick: (p: PartName) => void }) {
  // load the glb from public folder (served at /model/...)
  const gltf = useGLTF(url) as any;
  const groupRef = useRef<any>(null);

  // collect mesh children for interactive handlers
  const meshChildren = useMemo(() => {
    const list: any[] = [];
    gltf.scene.traverse((c: any) => {
      if (c.isMesh) list.push(c);
    });
    return list;
  }, [gltf.scene]);

  // slow gentle rotation for dashboard
  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.0008; // very slow
    }
  });

  return (
  <group>
  {/* place the model slightly lower so it sits better in the frame */}
  <group ref={groupRef} position={[0, -0.9, 0]}>
        {/* render original scene as a primitive so transforms are correct */}
        <primitive object={gltf.scene} />
      </group>

      {/* overlay invisible/primitives with handlers by reusing mesh objects */}
      {meshChildren.map((m) => (
        <primitive
          key={m.uuid}
          object={m}
          onPointerOver={(e: PointerEvent) => {
            // three.js pointer event types can be referenced as PointerEvent from lib.dom
            e.stopPropagation();
            // slightly elevate pointer cursor
            (document.body.style as any).cursor = "pointer";
          }}
          onPointerOut={(e: PointerEvent) => {
            e.stopPropagation();
            (document.body.style as any).cursor = "default";
          }}
          onPointerDown={(e: PointerEvent) => {
            e.stopPropagation();
            const part = mapMeshNameToPart(m.name || m.parent?.name);
            onPartClick(part);
          }}
        />
      ))}
    </group>
  );
}

export default function AvatarDashboard() {
  const [selectedPart, setSelectedPart] = useState<PartName | null>(null);

  return (
    <div className="w-full h-full relative">
  <Canvas camera={{ position: [0, 1.0, 3.2], fov: 45 }} className="rounded-xl">
        {/* brighter lighting for clearer model appearance */}
        <ambientLight intensity={1.0} />
        <directionalLight intensity={0.9} position={[5, 10, 7]} />
  <hemisphereLight args={["#e8f0ff", "#222222", 0.35]} />
        <Suspense fallback={null}>
          <Model url="/model/soumika.glb" onPartClick={(p) => setSelectedPart(p)} />
          <OrbitControls enablePan={true} enableZoom={true} enableRotate={true} />
        </Suspense>
      </Canvas>

      {/* Simple popup modal */}
      {selectedPart && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="pointer-events-auto bg-black/80 text-white p-4 rounded-lg border border-white/10 max-w-xs w-full mx-4">
            <div className="flex justify-between items-start gap-3">
              <div>
                <div className="text-sm text-zinc-300">Selected part</div>
                <div className="text-xl font-semibold mt-1">{selectedPart}</div>
              </div>
              <div>
                <button
                  onClick={() => setSelectedPart(null)}
                  className="text-zinc-300 hover:text-white"
                >
                  Close
                </button>
              </div>
            </div>
            <div className="text-xs text-zinc-400 mt-3">
              This popup is triggered when you click a body part (head, arms, legs, stomach, feet,
              back). Names are inferred from mesh names inside the model. If a part is not named
              clearly inside the GLB, it may show “Unknown”.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// preload the model
(useGLTF as any).preload && (useGLTF as any).preload("/model/soumika.glb");
