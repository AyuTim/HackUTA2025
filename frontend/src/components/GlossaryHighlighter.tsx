"use client";
import React, { ReactNode, isValidElement } from "react";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Info } from "lucide-react";
import { MED_GLOSSARY } from "../medGlossary";

function TermHover({
  term,
  definition,
  children,
}: {
  term: string;
  definition: string;
  children: ReactNode;
}) {
  return (
    <HoverCard openDelay={80} closeDelay={80}>
      <HoverCardTrigger asChild>
        <span
          className="inline-flex items-center gap-1 underline decoration-dotted underline-offset-4 cursor-help rounded px-1 hover:bg-muted/60"
          data-term={term}
          aria-label={`Definition: ${term}`}
        >
          {children}
          <Info className="h-3.5 w-3.5 shrink-0 opacity-70" />
        </span>
      </HoverCardTrigger>
      <HoverCardContent
        side="top"
        align="start"
        className="rounded-2xl border border-border/60 bg-popover/90 backdrop-blur-sm p-4 shadow-sm text-sm leading-relaxed max-w-[28rem]"
      >
        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <div className="mb-1 flex items-center gap-2">
              <span className="inline-flex items-center rounded-full bg-blue-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-blue-400">
                Definition
              </span>
              <span className="text-xs text-muted-foreground">term</span>
            </div>
            <h3 className="text-base font-semibold text-primary truncate">
              {toTitleCase(term)}
            </h3>
            <p className="mt-1 text-muted-foreground/90">{definition}</p>
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}

function toTitleCase(s: string) {
  return s.replace(/\w\S*/g, (w) => w.charAt(0).toUpperCase() + w.slice(1));
}

// --- 3) Highlighter core -----------------------------------------------------
export type GlossaryHighlighterProps = {
  terms: Record<string, string>;
  children: ReactNode;
  wholeWord?: boolean; // default true
  caseInsensitive?: boolean; // default true
  onMatch?: (term: string) => void;
  decorate?: (node: ReactNode, term: string) => ReactNode; // optional custom wrapper
};

export default function GlossaryHighlighter({
  terms,
  children,
  wholeWord = true,
  caseInsensitive = true,
  onMatch,
  decorate,
}: GlossaryHighlighterProps) {
  const keys = Object.keys(terms)
    .filter(Boolean)
    .sort((a, b) => b.length - a.length); // longer phrases first to avoid partial overlaps

  if (keys.length === 0) return <>{children}</>;

  const flags = caseInsensitive ? "gi" : "g";
  const boundary = wholeWord ? "\\b" : "";
  const pattern = keys.map(escapeRegex).join("|");
  const regex = new RegExp(`${boundary}(${pattern})${boundary}`, flags);

  function walk(node: ReactNode): ReactNode {
    if (typeof node === "string") {
      const parts: ReactNode[] = [];
      let lastIndex = 0;
      node.replace(regex, (match, _g1, offset) => {
        // Push preceding text
        if (offset > lastIndex) parts.push(node.slice(lastIndex, offset));
        const found = match; // already respects case sensitivity option
        const key = findCanonicalKey(found, keys, caseInsensitive);
        const def = key ? terms[key] : undefined;
        const wrapped = def ? (
          decorate ? (
            decorate(
              <TermHover term={key} definition={def}>
                {found}
              </TermHover>,
              key
            )
          ) : (
            <TermHover term={key} definition={def}>
              {found}
            </TermHover>
          )
        ) : (
          match
        );
        if (key && onMatch) onMatch(key);
        parts.push(wrapped);
        lastIndex = (offset as number) + match.length;
        return match;
      });
      if (lastIndex < node.length) parts.push(node.slice(lastIndex));
      return <>{parts}</>;
    }

    if (!isValidElement(node)) return node;

    // Recurse over children while preserving element props
    const childProps: any = {};
    const childArray = React.Children.toArray((node as any).props.children);
    if (childArray && childArray.length > 0) {
      childProps.children = childArray.map((c) => walk(c));
    }
    return React.cloneElement(node as any, childProps);
  }

  return <>{walk(children)}</>;
}

// --- 4) Helpers --------------------------------------------------------------
function escapeRegex(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function findCanonicalKey(found: string, keys: string[], ci: boolean) {
  if (!ci) return keys.find((k) => k === found) || found;
  const lower = found.toLowerCase();
  return keys.find((k) => k.toLowerCase() === lower) || lower;
}

// --- 5) Demo section (remove in production) ---------------------------------
export function DemoGlossarySection() {
  const sampleText = (
    <div className="space-y-4">
      <p>
        MRI revealed a <strong>hyperintense</strong> lesion within the right
        temporal lobe with mild edema and trace contrast enhancement. No
        evidence of acute ischemia or hemorrhage. Ventricles within normal
        limits.
      </p>
      <p>
        Impression: Findings most consistent with a benign process; recommend
        clinical correlation. Consider demarcation from adjacent parenchyma on
        follow-up.
      </p>
    </div>
  );

  return (
    <div className="rounded-2xl border bg-card p-6 shadow-sm">
      <h2 className="text-xl font-semibold mb-3">Hover Glossary – Demo</h2>
      <GlossaryHighlighter terms={MED_GLOSSARY}>
        {sampleText}
      </GlossaryHighlighter>
    </div>
  );
}

// --- 6) Example page usage ---------------------------------------------------
// In your page:
// export default function PatientReport() {
//   return (
//     <main className="container mx-auto p-6">
//       <GlossaryHighlighter terms={MED_GLOSSARY}>
//         <ReportBody />
//       </GlossaryHighlighter>
//     </main>
//   );
// }
//
// function ReportBody() {
//   return (
//     <article className="prose prose-slate max-w-none">
//       {/* Any nested content (text, headings, components) will be scanned */}
//       <h1>Brain MRI – Final Report</h1>
//       <p>
//         There is a hyperintense focus with surrounding edema. No acute ischemia. Minimal contrast enhancement.
//       </p>
//       <ul>
//         <li>Lesion margin shows sharp demarcation from surrounding parenchyma.</li>
//         <li>No ventricular enlargement.</li>
//       </ul>
//     </article>
//   );
// }

// --- 7) Notes & Tips ---------------------------------------------------------
// • You can feed terms from your backend: fetch('/api/glossary').
// • To support plural/singular automatically, add variants as additional keys
//   (e.g., "metastasis", "metastases"). The matcher preserves the original casing.
// • To limit to certain containers (e.g., just inside reports), wrap only that subtree.
// • To avoid highlighting inside specific components, pass those parts outside
//   the <GlossaryHighlighter> or add a prop to skip processing.
// • For dynamic text loaded via Suspense/streaming, the component works because
//   it processes children after render—no MutationObserver needed.
