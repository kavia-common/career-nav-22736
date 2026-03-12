"use client";

import * as React from "react";
import { cn } from "@/lib/cn";

/**
 * A structured, lane-based multiverse map renderer:
 * - Current role perfectly centered
 * - 3 fixed horizontal lanes (Traditional / Lateral / Pivot) with strict spacing
 * - Clean non-overlapping connection lines
 * - Circular role nodes with hover/click interactions
 * - Path labels above each lane with fade-in
 */

export type PathType = "traditional" | "lateral" | "pivot";

export type MultiverseNode = {
  id: string;
  title: string;
  industry: string;
  compatibility: number; // 0..100
  description: string;
  requiredSkills: string[];
  skillGaps: string[];
  transitionTime: string;
  pathType: PathType;

  /**
   * stage is distance from origin along the path (1..n).
   * Used for ordering and placement along each lane.
   */
  stage: number;
};

export type MultiversePath = {
  id: string;
  type: PathType;
  label: string;
  nodes: MultiverseNode[];
};

const PATH_META: Record<PathType, { laneLabel: string; stroke: string; glow: string; badgeBg: string; badgeText: string; badgeRing: string }> =
  {
    traditional: {
      laneLabel: "Traditional Path",
      stroke: "rgba(59, 130, 246, 0.95)", // blue-500
      glow: "rgba(59, 130, 246, 0.35)",
      badgeBg: "bg-blue-50",
      badgeText: "text-blue-800",
      badgeRing: "ring-blue-200"
    },
    lateral: {
      laneLabel: "Lateral Move",
      stroke: "rgba(168, 85, 247, 0.95)", // purple-500
      glow: "rgba(168, 85, 247, 0.35)",
      badgeBg: "bg-purple-50",
      badgeText: "text-purple-800",
      badgeRing: "ring-purple-200"
    },
    pivot: {
      laneLabel: "Industry Pivot",
      stroke: "rgba(249, 115, 22, 0.95)", // orange-500
      glow: "rgba(249, 115, 22, 0.35)",
      badgeBg: "bg-orange-50",
      badgeText: "text-orange-800",
      badgeRing: "ring-orange-200"
    }
  };

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

function usePrefersReducedMotion() {
  const [reduced, setReduced] = React.useState(false);
  React.useEffect(() => {
    const m = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(m.matches);
    update();
    m.addEventListener("change", update);
    return () => m.removeEventListener("change", update);
  }, []);
  return reduced;
}

function IconMinus() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" d="M5 12h14" />
    </svg>
  );
}
function IconPlus() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" d="M12 5v14M5 12h14" />
    </svg>
  );
}
function IconReset() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 12a9 9 0 0 1 15.36-6.36M21 12a9 9 0 0 1-15.36 6.36" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 4v5h5M21 20v-5h-5" />
    </svg>
  );
}

type NodeCircleProps = {
  node: MultiverseNode;
  selected: boolean;
  hovered: boolean;
  dimmed: boolean;
  onClick: () => void;
  onHover: (v: boolean) => void;
};

function NodeCircle({ node, selected, hovered, dimmed, onClick, onHover }: NodeCircleProps) {
  const meta = PATH_META[node.pathType];

  return (
    <div
      role="button"
      tabIndex={0}
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
      onFocus={() => onHover(true)}
      onBlur={() => onHover(false)}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      className={cn(
        "group relative grid place-items-center text-center",
        "h-[132px] w-[132px] rounded-full",
        "bg-white/85 backdrop-blur",
        "ring-1 ring-inset shadow-sm",
        "transition-transform duration-200",
        "focus:outline-none focus:ring-2 focus:ring-teal-500/30",
        (hovered || selected) && "scale-[1.05]",
        hovered && "shadow-md",
        selected ? "ring-teal-300 cn-mv-nodeSelected" : "ring-zinc-200",
        dimmed && "opacity-35"
      )}
      aria-label={`Role node: ${node.title}`}
      title={`${node.title} • ${node.industry}`}
    >
      <div className="px-3">
        <p className="text-[13px] font-semibold leading-tight text-zinc-900 line-clamp-2">{node.title}</p>
        <p className="mt-1 text-[11px] font-medium text-zinc-600">{node.industry}</p>
      </div>

      {/* Hover/selected glow */}
      <div
        className={cn(
          "pointer-events-none absolute inset-0 rounded-full opacity-0 transition-opacity duration-200",
          (hovered || selected) && "opacity-100"
        )}
        style={{ background: `radial-gradient(circle at 30% 20%, ${meta.glow}, transparent 60%)` }}
        aria-hidden="true"
      />
    </div>
  );
}

type LayoutParams = {
  originX: number;
  originY: number;
  laneY: Record<string, number>;
  nodePos: Record<string, { x: number; y: number }>;
  contentWidth: number;
  contentHeight: number;
};

function computeLayout(paths: MultiversePath[]) {
  /**
   * Spec-required spacing:
   * - Horizontal node spacing → 160px
   * - Vertical lane spacing → 200px
   *
   * Map is built so the Current Role node is perfectly centered (in world space).
   */
  const stepGap = 160;
  const laneGap = 200;

  const contentPaddingX = 260;
  const originX = contentPaddingX;

  // Vertical placement: 3 lanes around the current role center.
  const originY = 260;

  // Fixed lane order (top->bottom): Traditional, Lateral, Pivot
  const laneOrder = [...paths].sort((a, b) => {
    const rank = (t: PathType) => (t === "traditional" ? 0 : t === "lateral" ? 1 : 2);
    return rank(a.type) - rank(b.type);
  });

  const laneY: Record<string, number> = {};
  laneOrder.forEach((p, idx) => {
    laneY[p.id] = originY + (idx - 1) * laneGap; // idx 0 => -200, idx 1 => 0, idx 2 => +200
  });

  const nodePos: Record<string, { x: number; y: number }> = {};
  let maxX = originX;
  let minY = originY;
  let maxY = originY;

  for (const p of laneOrder) {
    const y = laneY[p.id];
    const sorted = [...p.nodes].sort((a, b) => a.stage - b.stage);
    sorted.forEach((n, idx) => {
      const x = originX + (idx + 1) * stepGap;
      nodePos[n.id] = { x, y };
      maxX = Math.max(maxX, x);
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y);
    });
  }

  // Provide generous margins for pan/zoom
  const contentWidth = maxX + 360;
  const contentHeight = (maxY - minY) + 560;

  return { originX, originY, laneY, nodePos, contentWidth, contentHeight } as const;
}

function svgPath(ax: number, ay: number, bx: number, by: number) {
  // Mild curvature but aligned horizontally.
  const dx = bx - ax;
  const c1x = ax + dx * 0.45;
  const c2x = ax + dx * 0.75;
  return `M ${ax} ${ay} C ${c1x} ${ay} ${c2x} ${by} ${bx} ${by}`;
}

type MultiverseBranchingMapProps = {
  currentRoleTitle: string;
  currentRoleSubtitle?: string;
  paths: MultiversePath[];
  selectedId: string | null;
  /** When set, nodes from other paths are dimmed. */
  dimPathType?: PathType | null;
  onSelectNode: (id: string) => void;
  initialVisiblePerPath?: number; // default 4
};

export function MultiverseBranchingMap(props: MultiverseBranchingMapProps) {
  const { currentRoleTitle, currentRoleSubtitle, paths, selectedId, dimPathType, onSelectNode, initialVisiblePerPath = 4 } = props;

  const reducedMotion = usePrefersReducedMotion();
  const viewportRef = React.useRef<HTMLDivElement | null>(null);

  // Expand/collapse per path controls how many nodes are visible.
  const [expanded, setExpanded] = React.useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    for (const p of paths) init[p.id] = false;
    return init;
  });

  React.useEffect(() => {
    // Ensure new paths get state entries.
    setExpanded((prev) => {
      const next = { ...prev };
      for (const p of paths) if (typeof next[p.id] !== "boolean") next[p.id] = false;
      return next;
    });
  }, [paths]);

  const visibleNodesByPath = React.useMemo(() => {
    const byPath: Record<string, MultiverseNode[]> = {};
    for (const p of paths) {
      const sorted = [...p.nodes].sort((a, b) => a.stage - b.stage);
      const count = expanded[p.id] ? sorted.length : Math.min(initialVisiblePerPath, sorted.length);
      byPath[p.id] = sorted.slice(0, count);
    }
    return byPath;
  }, [paths, expanded, initialVisiblePerPath]);

  const layout = React.useMemo(() => computeLayout(paths), [paths]);

  // Zoom/pan state for the "world" container.
  const [scale, setScale] = React.useState(1);
  const [pan, setPan] = React.useState({ x: 0, y: 0 });
  const dragRef = React.useRef<{ dragging: boolean; startX: number; startY: number; baseX: number; baseY: number } | null>(null);

  // Center the origin on mount / when lanes change.
  React.useEffect(() => {
    if (!viewportRef.current) return;
    const rect = viewportRef.current.getBoundingClientRect();
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    setPan({ x: cx - layout.originX * scale, y: cy - layout.originY * scale });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layout.originX, layout.originY, paths.length]);

  const resetView = () => {
    if (!viewportRef.current) return;
    const rect = viewportRef.current.getBoundingClientRect();
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    setScale(1);
    setPan({ x: cx - layout.originX, y: cy - layout.originY });
  };

  const zoomBy = (delta: number, anchor?: { clientX: number; clientY: number }) => {
    setScale((prev) => {
      const next = clamp(prev + delta, 0.65, 1.9);
      if (!anchor || !viewportRef.current) return next;

      const rect = viewportRef.current.getBoundingClientRect();
      const ax = anchor.clientX - rect.left;
      const ay = anchor.clientY - rect.top;

      const wx = (ax - pan.x) / prev;
      const wy = (ay - pan.y) / prev;

      const nx = ax - wx * next;
      const ny = ay - wy * next;
      setPan({ x: nx, y: ny });

      return next;
    });
  };

  const onWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const direction = e.deltaY > 0 ? -1 : 1;
      zoomBy(direction * 0.08, { clientX: e.clientX, clientY: e.clientY });
      return;
    }
    setPan((p) => ({ x: p.x - e.deltaX, y: p.y - e.deltaY }));
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (!viewportRef.current) return;
    (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
    dragRef.current = { dragging: true, startX: e.clientX, startY: e.clientY, baseX: pan.x, baseY: pan.y };
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const st = dragRef.current;
    if (!st?.dragging) return;
    const dx = e.clientX - st.startX;
    const dy = e.clientY - st.startY;
    setPan({ x: st.baseX + dx, y: st.baseY + dy });
  };

  const onPointerUp = () => {
    if (dragRef.current) dragRef.current.dragging = false;
  };

  const [hoveredId, setHoveredId] = React.useState<string | null>(null);

  const edges = React.useMemo(() => {
    const computed: { id: string; pathType: PathType; from: { x: number; y: number }; to: { x: number; y: number }; toId: string }[] =
      [];
    for (const p of paths) {
      const nodes = visibleNodesByPath[p.id] ?? [];
      nodes.forEach((n, idx) => {
        const fromId = idx === 0 ? "origin" : nodes[idx - 1].id;
        const from = fromId === "origin" ? { x: layout.originX, y: layout.laneY[p.id] } : layout.nodePos[fromId];
        const to = layout.nodePos[n.id];
        if (!from || !to) return;
        computed.push({ id: `${fromId}->${n.id}`, pathType: p.type, from, to, toId: n.id });
      });
    }
    return computed;
  }, [paths, visibleNodesByPath, layout]);

  const activePathType: PathType | null = dimPathType ?? null;

  return (
    <div className="relative">
      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-600">
          <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 ring-1 ring-inset ring-zinc-200">Drag to pan</span>
          <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 ring-1 ring-inset ring-zinc-200">Ctrl/⌘ + wheel to zoom</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            className={cn("inline-flex h-9 items-center justify-center gap-2 rounded-xl px-3 text-sm font-semibold", "bg-white ring-1 ring-inset ring-zinc-200 hover:bg-zinc-50")}
            onClick={() => zoomBy(-0.12)}
            aria-label="Zoom out"
            title="Zoom out"
          >
            <IconMinus />
          </button>
          <button
            type="button"
            className={cn("inline-flex h-9 items-center justify-center gap-2 rounded-xl px-3 text-sm font-semibold", "bg-white ring-1 ring-inset ring-zinc-200 hover:bg-zinc-50")}
            onClick={() => zoomBy(0.12)}
            aria-label="Zoom in"
            title="Zoom in"
          >
            <IconPlus />
          </button>
          <button
            type="button"
            className={cn("inline-flex h-9 items-center justify-center gap-2 rounded-xl px-3 text-sm font-semibold", "bg-white ring-1 ring-inset ring-zinc-200 hover:bg-zinc-50")}
            onClick={resetView}
            aria-label="Reset view"
            title="Reset view"
          >
            <IconReset />
          </button>
        </div>
      </div>

      <div
        ref={viewportRef}
        className={cn("relative h-[700px] w-full overflow-hidden rounded-2xl", "bg-white/60 ring-1 ring-inset ring-zinc-200", "touch-none")}
        onWheel={onWheel}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        {/* In-card subtle background */}
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          <div className="cn-mv-cardAmbient" />
          <div className="cn-mv-cardGrid" />
        </div>

        {/* World */}
        <div
          className="absolute left-0 top-0"
          style={{
            width: layout.contentWidth,
            height: layout.contentHeight,
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
            transformOrigin: "0 0"
          }}
        >
          {/* Current role label above origin */}
          <div className={cn("absolute -translate-x-1/2", reducedMotion ? "opacity-100" : "cn-mv-labelIn")} style={{ left: layout.originX, top: layout.originY - 120 }}>
            <span className="inline-flex items-center rounded-full bg-white px-3 py-1 text-[11px] font-bold text-zinc-700 ring-1 ring-inset ring-zinc-200">
              Current Role
            </span>
          </div>

          {/* Lane labels above each lane (badges), with fade-in */}
          {paths
            .slice()
            .sort((a, b) => (a.type === "traditional" ? 0 : a.type === "lateral" ? 1 : 2) - (b.type === "traditional" ? 0 : b.type === "lateral" ? 1 : 2))
            .map((p) => {
              const y = layout.laneY[p.id];
              const meta = PATH_META[p.type];
              return (
                <div
                  key={p.id}
                  className={cn("absolute", reducedMotion ? "opacity-100" : "cn-mv-labelIn")}
                  style={{ left: layout.originX + 16, top: y - 112 }}
                >
                  <span
                    className={cn(
                      "inline-flex items-center rounded-full px-3 py-1 text-[11px] font-bold ring-1 ring-inset",
                      meta.badgeBg,
                      meta.badgeText,
                      meta.badgeRing
                    )}
                  >
                    {meta.laneLabel}
                  </span>
                </div>
              );
            })}

          {/* Edges */}
          <svg className="absolute inset-0 h-full w-full" aria-hidden="true">
            <defs>
              {(["traditional", "lateral", "pivot"] as const).map((t) => (
                <filter key={t} id={`glow-branch-${t}`}>
                  <feGaussianBlur stdDeviation="2.2" result="coloredBlur" />
                  <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              ))}
            </defs>

            {edges.map((e) => {
              const meta = PATH_META[e.pathType];
              const d = svgPath(e.from.x, e.from.y, e.to.x, e.to.y);

              const isDimmedPath = Boolean(activePathType && activePathType !== e.pathType);
              const isActivePath = Boolean(activePathType && activePathType === e.pathType);

              const isEdgeHighlighted = e.toId === selectedId || e.toId === hoveredId;

              return (
                <path
                  key={e.id}
                  d={d}
                  pathLength={1}
                  style={{
                    stroke: meta.stroke,
                    filter: `url(#glow-branch-${e.pathType})`,
                    transition: "opacity 220ms ease, stroke-width 220ms ease"
                  }}
                  className={cn(
                    "fill-none",
                    isDimmedPath ? "opacity-25 stroke-[2.25]" : "opacity-95 stroke-[2.25]",
                    isActivePath && "opacity-100 stroke-[3.0]",
                    isEdgeHighlighted && "opacity-100 stroke-[3.6]",
                    !reducedMotion && "cn-mv-branchEdge"
                  )}
                />
              );
            })}
          </svg>

          {/* Origin current role (perfectly centered via pan on mount) */}
          <div
            className={cn(
              "absolute rounded-full",
              "h-[132px] w-[132px] -translate-x-1/2 -translate-y-1/2",
              "bg-white/85 backdrop-blur",
              "ring-2 ring-teal-200 shadow-md",
              "cn-mv-origin cn-mv-originPulse"
            )}
            style={{ left: layout.originX, top: layout.originY }}
            title="Your current role"
          >
            <div className="grid h-full w-full place-items-center p-4 text-center">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Current role</p>
                <p className="mt-1 text-base font-bold text-zinc-900">{currentRoleTitle}</p>
                {currentRoleSubtitle ? <p className="mt-0.5 text-xs text-zinc-600">{currentRoleSubtitle}</p> : null}
              </div>
            </div>
          </div>

          {/* Nodes */}
          {paths.flatMap((p) => {
            const nodes = visibleNodesByPath[p.id] ?? [];
            return nodes.map((n) => {
              const pos = layout.nodePos[n.id];
              if (!pos) return null;

              const selected = n.id === selectedId;
              const hovered = n.id === hoveredId;
              const dimmed = Boolean(activePathType && activePathType !== n.pathType);

              return (
                <div
                  key={n.id}
                  className="absolute -translate-x-1/2 -translate-y-1/2"
                  style={{
                    left: pos.x,
                    top: pos.y
                  }}
                >
                  <div className={cn(!reducedMotion && "cn-mv-nodeFloat")}>
                    <NodeCircle
                      node={n}
                      selected={selected}
                      hovered={hovered}
                      dimmed={dimmed}
                      onHover={(v) => setHoveredId(v ? n.id : (prev) => (prev === n.id ? null : prev))}
                      onClick={() => onSelectNode(n.id)}
                    />
                  </div>
                </div>
              );
            });
          })}
        </div>

        {/* Bottom fade */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-white/80 to-transparent" />
      </div>
    </div>
  );
}

export default MultiverseBranchingMap;
