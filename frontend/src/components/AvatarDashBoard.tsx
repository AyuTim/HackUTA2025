"use client";

import React, { Suspense, useMemo, useState, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, useGLTF } from "@react-three/drei";

type PartName = "Head" | "Arms" | "Legs" | "Stomach" | "Feet" | "Hair" | "Back" | "Unknown";

// helper: normalize names like "Wolf3D_Outfit_Top" → "wolf3d outfit top"
function norm(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

// explicit overrides for tricky mesh names
const OVERRIDES: Record<string, PartName> = {
  "wolf3d outfit top": "Stomach",
  "wolf3d outfit bottom": "Legs",
  "wolf3d body": "Arms",
  "wolf3d outfit footwear": "Feet",
  "wolf3d hair": "Hair",
};

function mapMeshNameToPart(name: string | undefined): PartName {
  if (!name) return "Unknown";
  const n = norm(name);
  if (OVERRIDES[n]) return OVERRIDES[n];
  if (/\b(head|skull|face)\b/.test(n)) return "Head";
  if (/\b(arm|shoulder|hand|wrist|clavicle|forearm|upperarm)\b/.test(n)) return "Arms";
  if (/\b(leg|thigh|knee|calf)\b/.test(n)) return "Legs";
  if (/\b(stomach|torso|abdomen|chest|upperchest|rib|pec|body|top)\b/.test(n)) return "Stomach";
  if (/\b(foot|feet|toe)\b/.test(n)) return "Feet";
  if (/\b(back|spine)\b/.test(n)) return "Back";
  return "Unknown";
}

function Model({
  url,
  onPartClick,
  onPartHover,
}: {
  url: string;
  onPartClick: (p: PartName) => void;
  onPartHover: (p: PartName | null, x?: number, y?: number) => void;
}) {
  const gltf = useGLTF(url) as any;
  const groupRef = useRef<any>(null);

  const meshChildren = useMemo(() => {
    const list: any[] = [];
    gltf.scene.traverse((c: any) => {
      if (c.isMesh) list.push(c);
    });
    return list;
  }, [gltf.scene]);

  useFrame(() => {
    if (groupRef.current) groupRef.current.rotation.y += 0.0008;
  });

  return (
    <group>
      <group ref={groupRef} position={[0, -0.9, 0]}>
        <primitive object={gltf.scene} />
      </group>

      {meshChildren.map((m) => (
        <primitive
          key={m.uuid}
          object={m}
          onPointerOver={(e: any) => {
            e.stopPropagation();
            document.body.style.cursor = "pointer";
            const part = mapMeshNameToPart(m.name || m.parent?.name);
            onPartHover(part, e.clientX, e.clientY);

            // light highlight
            try {
              (m.material as any).userData ??= {};
              if ((m.material as any).color?.clone) {
                (m.material as any).userData._origColor = (m.material as any).color.clone();
                (m.material as any).color.lerp(
                  new (m.material as any).color.constructor(0x4f79d6),
                  0.5
                );
              }
              if ((m.material as any).emissive?.clone) {
                (m.material as any).userData._origEmissive = (m.material as any).emissive.clone();
                (m.material as any).emissive.setHex?.(0x264fb8);
              }
            } catch {}
          }}
          onPointerMove={(e: any) => {
            e.stopPropagation();
            onPartHover(mapMeshNameToPart(m.name || m.parent?.name), e.clientX, e.clientY);
          }}
          onPointerOut={(e: any) => {
            e.stopPropagation();
            document.body.style.cursor = "default";
            onPartHover(null);
            try {
              const mat: any = m.material;
              const oc = mat.userData?._origColor;
              const oe = mat.userData?._origEmissive;
              if (oc?.copy && mat.color) mat.color.copy(oc);
              if (oe?.copy && mat.emissive) mat.emissive.copy(oe);
            } catch {}
          }}
          onPointerDown={(e: any) => {
            e.stopPropagation();
            onPartClick(mapMeshNameToPart(m.name || m.parent?.name));
          }}
        />
      ))}
    </group>
  );
}

export default function AvatarDashboard() {
  const [selectedPart, setSelectedPart] = useState<PartName | null>(null);
  const [hoveredPart, setHoveredPart] = useState<PartName | null>(null);
  const [pointerPos, setPointerPos] = useState<{ x: number; y: number } | null>(null);

  // ref to compute coordinates relative to this container
  const wrapperRef = useRef<HTMLDivElement>(null);

  return (
    <div ref={wrapperRef} className="w-full h-full relative">
      <Canvas camera={{ position: [0, 1.0, 3.2], fov: 45 }} className="rounded-xl">
        <ambientLight intensity={1.0} />
        <directionalLight intensity={0.9} position={[5, 10, 7]} />
        <hemisphereLight args={["#e8f0ff", "#222222", 0.35]} />
        <Suspense fallback={null}>
          <Model
            url="/model/soumika.glb"
            onPartClick={(p) => setSelectedPart(p)}
            onPartHover={(p, clientX, clientY) => {
              setHoveredPart(p);
              if (p && clientX !== undefined && clientY !== undefined && wrapperRef.current) {
                const rect = wrapperRef.current.getBoundingClientRect();
                // store position relative to wrapper, place the tag just below the cursor
                setPointerPos({ x: clientX - rect.left, y: clientY - rect.top + 16 });
              } else {
                setPointerPos(null);
              }
            }}
          />
          <OrbitControls enablePan enableZoom enableRotate />
        </Suspense>
      </Canvas>

      {/* Click popup (unchanged) */}
      {selectedPart && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="pointer-events-auto bg-black/80 text-white p-4 rounded-lg border border-white/10 max-w-xs w-full mx-4">
            <div className="flex justify-between items-start gap-3">
              <div>
                <div className="text-sm text-zinc-300">Selected part</div>
                <div className="text-xl font-semibold mt-1">{selectedPart}</div>
              </div>
              <button
                onClick={() => setSelectedPart(null)}
                className="text-zinc-300 hover:text-white"
              >
                Close
              </button>
            </div>
            <div className="text-xs text-zinc-400 mt-3">
              Click a body part to open this popup. Hover shows only the part name.
            </div>
          </div>
        </div>
      )}

      {/* Hover tag: directly under cursor & only the part name */}
      {hoveredPart && pointerPos && (
        <div
          className="absolute pointer-events-none"
          style={{ left: pointerPos.x, top: pointerPos.y }}
        >
          <div className="bg-blue-50/95 text-blue-900 text-sm font-medium px-2 py-1 rounded shadow-sm border border-blue-200 whitespace-nowrap">
            {hoveredPart}
          </div>
        </div>
      )}
    </div>
  );
}

// preload the model
(useGLTF as any).preload?.("/model/soumika.glb");
