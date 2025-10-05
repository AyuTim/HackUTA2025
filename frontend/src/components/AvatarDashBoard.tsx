"use client";

import React, { Suspense, useMemo, useState, useRef, useEffect, useCallback } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, useGLTF } from "@react-three/drei";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

/* =========================
   Supabase (safe client)
========================= */
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase: SupabaseClient | null =
  supabaseUrl && supabaseAnon ? createClient(supabaseUrl, supabaseAnon) : null;

/* =========================
   Types
========================= */
type PartName =
  | "Head"
  | "Arms"
  | "Legs"
  | "Stomach"
  | "Feet"
  | "Hair"
  | "Back"
  | "Unknown";

type DocRow = {
  id?: string | number;
  file_name: string;
  file_path: string | null;
  document_type: string | null;
  extracted_text: string | null; // stored as TEXT (stringified JSON)
  body_part: string | null; // may be CSV like "head,stomach"
};

/* =========================
   Helpers
========================= */

// normalize mesh names like "Wolf3D_Outfit_Top" → "wolf3d outfit top"
function norm(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
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
  if (/\b(arm|shoulder|hand|wrist|clavicle|forearm|upperarm)\b/.test(n))
    return "Arms";
  if (/\b(leg|thigh|knee|calf)\b/.test(n)) return "Legs";
  if (/\b(stomach|torso|abdomen|chest|upperchest|rib|pec|body|top)\b/.test(n))
    return "Stomach";
  if (/\b(foot|feet|toe)\b/.test(n)) return "Feet";
  if (/\b(back|spine)\b/.test(n)) return "Back";
  return "Unknown";
}

/** Map the clicked PartName to the body_part categories used in DB.
 * Your DB supported: head, hair, stomach, legs, feet, arms (and sometimes CSV).
 * We'll use the main one, and when "Back" is clicked we also try "back".
 */
function partNameToBodyPartKey(p: PartName): string[] {
  switch (p) {
    case "Head":
      return ["head"];
    case "Hair":
      return ["hair"];
    case "Stomach":
      return ["stomach", "abdomen", "abdominal"]; // just in case someone saved variants
    case "Legs":
      return ["legs", "leg"];
    case "Feet":
      return ["feet", "foot"];
    case "Arms":
      return ["arms", "arm"];
    case "Back":
      // not in your original set, but if a doc saved "back" manually, include it
      return ["back"];
    default:
      return ["unknown"];
  }
}

/** Try to pull a small human-readable snippet from extracted_text JSON. */
function extractSnippet(extracted_text: string | null): string | null {
  if (!extracted_text) return null;
  try {
    const json = JSON.parse(extracted_text);
    const data = json?.data ?? json;
    const findings = Array.isArray(data?.findings) ? data.findings : [];
    if (findings.length) {
      const first = findings[0];
      const title =
        first?.title ||
        first?.name ||
        first?.type ||
        first?.impression ||
        first?.summary;
      const bp = first?.bodyPart || first?.region;
      if (title && bp) return `${title} — ${bp}`;
      if (title) return String(title);
      if (bp) return String(bp);
    }
    // fallback: impression or summary fields commonly seen
    const imp = data?.impression || data?.summary || data?.conclusion;
    if (typeof imp === "string" && imp.length) return imp.slice(0, 140);
    return null;
  } catch {
    return null;
  }
}

/* =========================
   Model (R3F)
========================= */
function Model({
  url,
  onPartClick,
  onPartHover,
  onModelLoaded,
}: {
  url: string;
  onPartClick: (p: PartName) => void;
  onPartHover: (p: PartName | null, x?: number, y?: number) => void;
  onModelLoaded: () => void;
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

  // Notify parent that model has loaded
  useEffect(() => {
    onModelLoaded();
  }, [onModelLoaded]);

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
                (m.material as any).userData._origColor = (
                  m.material as any
                ).color.clone();
                (m.material as any).color.lerp(
                  new (m.material as any).color.constructor(0x4f79d6),
                  0.5
                );
              }
              if ((m.material as any).emissive?.clone) {
                (m.material as any).userData._origEmissive = (
                  m.material as any
                ).emissive.clone();
                (m.material as any).emissive.setHex?.(0x264fb8);
              }
            } catch {}
          }}
          onPointerMove={(e: any) => {
            e.stopPropagation();
            onPartHover(
              mapMeshNameToPart(m.name || m.parent?.name),
              e.clientX,
              e.clientY
            );
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

/* =========================
   Main Component
========================= */
export default function AvatarDashboard() {
  const [selectedPart, setSelectedPart] = useState<PartName | null>(null);
  const [hoveredPart, setHoveredPart] = useState<PartName | null>(null);
  const [pointerPos, setPointerPos] = useState<{ x: number; y: number } | null>(
    null
  );

  const [docs, setDocs] = useState<DocRow[] | null>(null);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [docsError, setDocsError] = useState<string | null>(null);
  const [modelLoaded, setModelLoaded] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // ref to compute coordinates relative to this container
  const wrapperRef = useRef<HTMLDivElement>(null);

  const fetchDocsForPart = useCallback(async (part: PartName) => {
    setLoadingDocs(true);
    setDocsError(null);
    setDocs(null);

    // without env keys, skip fetch
    if (!supabase) {
      setDocsError("Supabase not configured");
      setLoadingDocs(false);
      return;
    }

    // Build filter: body_part ILIKE %key% (or multiple)
    const keys = partNameToBodyPartKey(part);
    // Supabase .or() syntax: "body_part.ilike.%head%,body_part.ilike.%hair%"
    const orExpr = keys.map((k) => `body_part.ilike.%${k}%`).join(",");
    try {
      let query = supabase
        .from("documents")
        .select("*")
        .limit(12)
        .order("file_name", { ascending: true });

      if (keys.length === 1) {
        query = query.ilike("body_part", `%${keys[0]}%`);
      } else {
        // @ts-ignore - supabase-js or() takes a string condition
        query = query.or(orExpr);
      }

      const { data, error } = await query;
      if (error) {
        setDocsError(error.message);
      } else {
        setDocs(data || []);
      }
    } catch (err: any) {
      setDocsError(err?.message || "Failed to load documents");
    } finally {
      setLoadingDocs(false);
    }
  }, []);

  // Ensure we're on the client side before rendering Canvas
  useEffect(() => {
    // Mark as mounted
    setIsMounted(true);
    
    // Preload the model
    useGLTF.preload("/model/soumika.glb");
    
    // Check if we've already attempted a refresh
    const hasRefreshed = sessionStorage.getItem('avatarRefreshed');
    
    if (!hasRefreshed) {
      // Set a timeout to check if model loaded
      const timeoutId = setTimeout(() => {
        if (!modelLoaded) {
          console.log('Avatar did not load, refreshing...');
          // Mark that we've refreshed to prevent infinite loops
          sessionStorage.setItem('avatarRefreshed', 'true');
          // Refresh the page
          window.location.reload();
        }
      }, 1000); // Wait 1 second for model to load

      return () => clearTimeout(timeoutId);
    }
  }, [modelLoaded]);

  // Clear the refresh flag when model successfully loads
  useEffect(() => {
    if (modelLoaded) {
      console.log('Avatar loaded successfully');
      sessionStorage.removeItem('avatarRefreshed');
    }
  }, [modelLoaded]);

  // Don't render Canvas until mounted (prevents SSR issues)
  if (!isMounted) {
    return <div ref={wrapperRef} className="w-full h-full relative" />;
  }

  return (
    <div ref={wrapperRef} className="w-full h-full relative">
      <Canvas camera={{ position: [0, 0.4, 3.2], fov: 60 }} className="rounded-xl">
        <ambientLight intensity={1.0} />
        <directionalLight intensity={0.9} position={[5, 10, 7]} />
        <hemisphereLight args={["#e8f0ff", "#222222", 0.35]} />
        <Suspense fallback={null}>
          <Model
            url="/model/soumika.glb"
            onPartClick={(p) => {
              setSelectedPart(p);
              fetchDocsForPart(p);
            }}
            onPartHover={(p, clientX, clientY) => {
              setHoveredPart(p);
              if (
                p &&
                clientX !== undefined &&
                clientY !== undefined &&
                wrapperRef.current
              ) {
                const rect = wrapperRef.current.getBoundingClientRect();
                // store position relative to wrapper, place the tag just below the cursor
                setPointerPos({
                  x: clientX - rect.left,
                  y: clientY - rect.top + 16,
                });
              } else {
                setPointerPos(null);
              }
            }}
            onModelLoaded={() => setModelLoaded(true)}
          />
          <OrbitControls enablePan enableZoom enableRotate />
        </Suspense>
      </Canvas>

      {/* Click popup with Supabase docs */}
      {selectedPart && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="pointer-events-auto bg-black/85 text-white p-4 rounded-lg border border-white/10 max-w-md w-full mx-4">
            <div className="flex justify-between items-start gap-3">
              <div>
                <div className="text-sm text-zinc-300">Selected part</div>
                <div className="text-xl font-semibold mt-1">{selectedPart}</div>
              </div>
              <button
                onClick={() => {
                  setSelectedPart(null);
                  setDocs(null);
                  setDocsError(null);
                }}
                className="text-zinc-300 hover:text-white"
              >
                Close
              </button>
            </div>

            <div className="mt-3">
              {loadingDocs ? (
                <div className="flex items-center gap-2 text-blue-300 text-sm">
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
                    <circle
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="3"
                      fill="none"
                      opacity="0.3"
                    />
                    <path
                      d="M22 12a10 10 0 0 1-10 10"
                      stroke="currentColor"
                      strokeWidth="3"
                      fill="none"
                    />
                  </svg>
                  Loading documents…
                </div>
              ) : docsError ? (
                <div className="text-sm text-red-300">Error: {docsError}</div>
              ) : docs && docs.length > 0 ? (
                <ul className="space-y-2 max-h-60 overflow-auto">
                  {docs.map((d, idx) => {
                    const snippet = extractSnippet(d.extracted_text);
                    return (
                      <li
                        key={`${d.file_name}-${idx}`}
                        className="rounded-md border border-blue-900/30 bg-black/50 p-3"
                      >
                        <div className="flex items-center justify-between">
                          <div className="font-medium text-sm">
                            {d.file_name}
                          </div>
                          <div className="text-[10px] text-zinc-400">
                            {d.document_type || "Document"}
                          </div>
                        </div>
                        <div className="text-[11px] text-zinc-400 mt-1">
                          Body part:{" "}
                          <span className="text-blue-300">
                            {d.body_part || "unknown"}
                          </span>
                        </div>
                        {snippet && (
                          <div className="text-xs text-zinc-300 mt-2 line-clamp-3">
                            {snippet}
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <div className="text-sm text-zinc-400">
                  No documents found for this body part.
                </div>
              )}
            </div>

            <div className="text-[11px] text-zinc-500 mt-3">
              Tip: The match uses a contains search on{" "}
              <code>documents.body_part</code> (e.g., <code>%head%</code>).
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

