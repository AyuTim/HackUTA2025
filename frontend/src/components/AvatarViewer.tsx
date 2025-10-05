"use client";

import React, { Suspense, useRef, useEffect, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Environment, Html, useProgress, useGLTF } from "@react-three/drei";
import * as THREE from "three";

/* ----------------------------- SIDE + PART LABELS ----------------------------- */

// Buckets for grouping; UI shows a pretty string (e.g., "Left Shoulder")
type PartBucket =
  | "Head" | "Eyes" | "Neck" | "Arms" | "Hands" | "Chest" | "Back" | "Hips" | "Legs" | "Feet" | "Unknown";

type PartInfo = {
  side: "Left" | "Right" | "Midline";
  bucket: PartBucket;
  part: string;   // e.g., "Shoulder", "Upper Arm", "Forearm", "Thigh", "Shin/Calf", "Foot"
  raw: string;    // original matched node name
};

const SIDE_RULES = [
  { re: /^(l|left)[_\s-]?/i, side: "Left" as const },
  { re: /^(r|right)[_\s-]?/i, side: "Right" as const },
];

const NAME_NORMALIZE: Array<{ re: RegExp; out: string }> = [
  { re: /left/gi, out: "" },
  { re: /right/gi, out: "" },
  { re: /[_\-\s]/g, out: "" },
];

// Fine-grained rules → bucket
const FINE_RULES: Array<{ test: RegExp; part: string; bucket: PartBucket }> = [
  // head & face
  { test: /(head|skull|cranium|face|brow|jaw|mouth|cheek|nose|ear)/, part: "Face/Head", bucket: "Head" },
  { test: /(lefteye|righteye|(^|[^a-z])eye([^a-z]|$))/ , part: "Eye", bucket: "Eyes" },
  { test: /(neck|throat)/, part: "Neck", bucket: "Neck" },

  // torso / midline
  { test: /top/i, part: "Chest", bucket: "Chest" },
  { test: /(Wolf3D_Outfit_Top|Top|top|upperchest|chest|pec|rib|torso|abdomen|stomach|body)/, part: "Chest", bucket: "Chest" },
  { test: /(spine3|spine2)/, part: "Upper Back", bucket: "Back" },
  { test: /(spine1|spine\b)/, part: "Mid Back", bucket: "Back" },
  { test: /(hips|pelvis|hip)/, part: "Hips/Pelvis", bucket: "Hips" },

  // arms
  { test: /(body|clavicle|shoulder|scapula)/, part: "Shoulder", bucket: "Arms" },
  { test: /(upperarm|uparm|humerus|(?<!fore)arm(?!ature))/ , part: "Upper Arm", bucket: "Arms" },
  { test: /(forearm|radius|ulna|elbow)/, part: "Forearm", bucket: "Arms" },
  { test: /(hand|wrist|palm|finger|thumb)/, part: "Hand", bucket: "Hands" },

  // legs
  { test: /(upleg|upperleg|thigh|femur)/, part: "Thigh", bucket: "Legs" },
  { test: /(leg(?!end)|leg|LeftLeg|RightUpLeg|LeftUpLeg|knee|calf|shin|tibia|fibula)/, part: "Shin/Calf", bucket: "Legs" },
  { test: /(foot|feet|toe|ankle|ball|heel)/, part: "Foot", bucket: "Feet" },
];

function extractSide(name: string): "Left" | "Right" | "Midline" {
  for (const r of SIDE_RULES) if (r.re.test(name)) return r.side;
  if (/spine|hips|pelvis|chest|neck|head|face/i.test(name)) return "Midline";
  return "Midline";
}

function normalizeName(n: string) {
  let out = n;
  NAME_NORMALIZE.forEach(({ re, out: rep }) => (out = out.replace(re, rep)));
  return out.toLowerCase();
}

function resolvePartInfo(rawName?: string): PartInfo {
  const raw = rawName || "";
  const side = extractSide(raw);
  const n = normalizeName(raw);

  for (const rule of FINE_RULES) {
    if (rule.test.test(n)) {
      return { side, bucket: rule.bucket, part: rule.part, raw };
    }
  }
  return { side, bucket: "Unknown", part: "Unknown", raw };
}

/** Walk up parents to find the most meaningful descriptor */
function mapNodeToPartInfo(node: THREE.Object3D | null | undefined): PartInfo {
  let cur: THREE.Object3D | null | undefined = node;
  while (cur) {
    const info = resolvePartInfo(cur.name);
    if (info.bucket !== "Unknown" || cur.parent == null) return info;
    cur = cur.parent;
  }
  return { side: "Midline", bucket: "Unknown", part: "Unknown", raw: node?.name ?? "" };
}

/** Pretty string for UI */
function formatPartLabel(info: PartInfo): string {
  if (info.bucket === "Unknown") return "Unknown";
  if (info.bucket === "Head" && /face/i.test(info.part)) return "Head / Face";
  if (info.side === "Midline") return info.part !== "Unknown" ? info.part : info.bucket;
  return `${info.side} ${info.part !== "Unknown" ? info.part : info.bucket}`;
}

/* ---------------------------------- MODEL --------------------------------- */

function Model({
  src,
  onPartClick,
  onHoverPart,
  selectedNode,
  setSelectedNode,
}: {
  src: string;
  onPartClick?: (pretty: string, info: PartInfo) => void;
  onHoverPart?: (pretty: string, info: PartInfo, screenXY: { x: number; y: number } | null) => void;
  selectedNode: THREE.Object3D | null;
  setSelectedNode: (o: THREE.Object3D | null) => void;
}) {
  const gltf = useGLTF(src) as any;
  const rootRef = useRef<THREE.Group>(null!);
  const headRef = useRef<THREE.Object3D | null>(null);
  const smileTargets = useRef<Array<{ mesh: THREE.Mesh; indices: number[] }>>([]);

  // cache original emissives so we can restore on hover-out
  const hoverState = useRef<{ last?: THREE.Mesh; original?: THREE.Color | null }>({});

  // Find head + smile morphs once
  useEffect(() => {
    if (!gltf?.scene) return;

    // head
    gltf.scene.traverse((c: any) => {
      if (!headRef.current && c.isMesh) {
        const nm = (c.name || "").toLowerCase();
        if (nm.includes("head") || nm.includes("skull") || nm.includes("face")) headRef.current = c;
      }
    });

    // smile morph targets
    const morphs: Array<{ mesh: THREE.Mesh; indices: number[] }> = [];
    gltf.scene.traverse((c: any) => {
      if (c.isMesh && c.morphTargetDictionary && c.morphTargetInfluences) {
        const names = Object.keys(c.morphTargetDictionary || {});
        const idxs: number[] = [];
        names.forEach((n) => {
          if (/smile|mouthSmile|mouth_smile|happy|joy|smirk/i.test(n)) {
            idxs.push(c.morphTargetDictionary[n]);
          }
        });
        if (idxs.length) morphs.push({ mesh: c, indices: idxs });
      }
    });
    smileTargets.current = morphs;
  }, [gltf]);

  // Happy idle motion + gentle smile
  useFrame((state, delta) => {
    const t = state.clock.getElapsedTime();
    if (rootRef.current) {
      rootRef.current.rotation.y += 0.002;
      rootRef.current.position.y = -0.9 + Math.sin(t * 1.5) * 0.03;
      rootRef.current.position.x = Math.sin(t * 0.6) * 0.04;
    }
    if (headRef.current) {
      headRef.current.rotation.x = Math.sin(t * 2.2) * 0.06;
      headRef.current.rotation.y = Math.sin(t * 1.4) * 0.03;
    }
    const smileTarget = 0.22;
    const smileSpeed = 0.6;
    if (smileTargets.current.length) {
      smileTargets.current.forEach(({ mesh, indices }) => {
        indices.forEach((idx) => {
          if (!mesh.morphTargetInfluences) return;
          const cur = mesh.morphTargetInfluences[idx] || 0;
          mesh.morphTargetInfluences[idx] = cur + (smileTarget - cur) * Math.min(1, smileSpeed * delta);
        });
      });
    }

    // subtle pulse on selected node so it stays visible
    if (selectedNode && (selectedNode as any).material) {
      const m = (selectedNode as any).material as THREE.MeshStandardMaterial;
      if (m.emissive) {
        const pulse = 0.2 + 0.1 * (0.5 + 0.5 * Math.sin(t * 3));
        m.emissive.setScalar(pulse);
      }
    }
  });

  // --- Pointer handlers (hover highlight + labels + clicks) ---

  const clearHover = () => {
    if (hoverState.current.last && (hoverState.current.last.material as any)?.emissive) {
      const mat = hoverState.current.last.material as THREE.MeshStandardMaterial;
      mat.emissive?.copy(hoverState.current.original || new THREE.Color(0, 0, 0));
    }
    hoverState.current = {};
    onHoverPart && onHoverPart("Unknown", { side: "Midline", bucket: "Unknown", part: "Unknown", raw: "" }, null);
  };

  const handlePointerMove = (e: any) => {
    e.stopPropagation();
    const mesh: THREE.Mesh | undefined = e.object?.isMesh ? e.object : undefined;
    if (!mesh) return;

    if (hoverState.current.last !== mesh) {
      clearHover();
      if ((mesh.material as any)?.emissive) {
        const mat = mesh.material as THREE.MeshStandardMaterial;
        hoverState.current.last = mesh;
        hoverState.current.original = mat.emissive ? mat.emissive.clone() : null;
        mat.emissive = new THREE.Color(0.45, 0.45, 0.45);
      }
    }

    const info = mapNodeToPartInfo(mesh);
    const pretty = formatPartLabel(info);
    onHoverPart &&
      onHoverPart(pretty, info, {
        x: e.clientX,
        y: e.clientY,
      });
  };

  const handlePointerOut = () => {
    clearHover();
  };

  const handlePointerDown = (e: any) => {
    e.stopPropagation();
    const mesh: THREE.Object3D = e.object?.isMesh ? e.object : e.object?.parent;
    const info = mapNodeToPartInfo(mesh);
    const pretty = formatPartLabel(info);
    setSelectedNode(mesh || null);
    onPartClick && onPartClick(pretty, info);
  };

  return (
    <group ref={rootRef} position={[0, -0.9, 0]} scale={0.9}>
      <group
        onPointerMove={handlePointerMove}
        onPointerOut={handlePointerOut}
        onPointerDown={handlePointerDown}
      >
        <primitive object={gltf.scene} />
      </group>
    </group>
  );
}

/* --------------------------------- LOADER --------------------------------- */

function Loader() {
  const { progress } = useProgress();
  return (
    <Html center>
      <div className="text-sm text-gray-300">Loading avatar {Math.round(progress)}%</div>
    </Html>
  );
}

/* --------------------------------- VIEWER --------------------------------- */

export default function AvatarViewer({ src = "/model/soumika.glb" }: { src?: string }) {
  const controlsRef = useRef<any>(null);
  const [selectedPart, setSelectedPart] = useState<string | null>(null);
  const [selectedInfo, setSelectedInfo] = useState<PartInfo | null>(null);
  const [hoverPart, setHoverPart] = useState<string>("Unknown");
  const [hoverXY, setHoverXY] = useState<{ x: number; y: number } | null>(null);
  const [selectedNode, setSelectedNode] = useState<THREE.Object3D | null>(null);

  useEffect(() => {
    if (controlsRef.current?.target?.set) {
      controlsRef.current.target.set(0, -0.8, 0);
      controlsRef.current.update?.();
    }
  }, []);

  return (
    <div className="relative w-full h-full rounded-2xl overflow-hidden">
      <Canvas camera={{ position: [0, 1.0, 3.2], fov: 45 }}>
        <ambientLight intensity={1.2} />
        <directionalLight intensity={1.2} position={[5, 10, 7]} />
        <hemisphereLight args={["#f0f6ff", "#222222", 0.5]} />

        <Suspense fallback={<Loader />}>
          <Model
            src={src}
            selectedNode={selectedNode}
            setSelectedNode={setSelectedNode}
            onPartClick={(pretty, info) => {
              setSelectedPart(pretty);
              setSelectedInfo(info);
            }}
            onHoverPart={(pretty, _info, xy) => {
              setHoverPart(pretty);
              setHoverXY(xy);
            }}
          />
        </Suspense>

        <OrbitControls
          ref={controlsRef}
          enablePan
          enableZoom
          autoRotate={false}
          minDistance={1.2}
          maxDistance={6}
        />
        <Environment preset="city" />
      </Canvas>

      {/* Hover tooltip */}
      {hoverXY && hoverPart !== "Unknown" && (
        <div
          className="pointer-events-none fixed z-20 px-2 py-1 rounded-md bg-black/80 text-white text-xs border border-white/10"
          style={{ left: hoverXY.x + 10, top: hoverXY.y + 10 }}
        >
          {hoverPart}
        </div>
      )}

      {/* Selection modal */}
      {selectedPart && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="pointer-events-auto bg-black/80 text-white p-4 rounded-lg border border-white/10 max-w-xs w-full mx-4">
            <div className="flex justify-between items-start gap-3">
              <div>
                <div className="text-sm text-zinc-300">Selected part</div>
                <div className="text-xl font-semibold mt-1">{selectedPart}</div>
                {selectedInfo && (
                  <div className="text-xs text-zinc-400 mt-2">
                    Group: {selectedInfo.bucket} • Node: {selectedInfo.raw || "unnamed"}
                  </div>
                )}
              </div>
              <button
                onClick={() => {
                  setSelectedPart(null);
                  setSelectedInfo(null);
                  setSelectedNode(null);
                }}
                className="text-zinc-300 hover:text-white"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* drei GLTF loader needs this once somewhere in your app */
useGLTF.preload("/model/soumika.glb");
