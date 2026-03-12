"use client";

import * as React from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/cn";

type WorkspaceTab = "mindMap" | "timeHorizon" | "roleComparison" | "strategicPlan";

type Role = {
  id: string;
  title: string;
  industry: string;
  salaryRange: string;
  requiredSkills: string[];
  transitionTimeline: string;
  skillGap: string[];
  workLifeBalance: number; // 1..5
  growthPotential: number; // 1..5
};

type Opportunity = {
  id: string;
  roleId: string;
  horizon: HorizonKey;
  requiredSkills: string;
  effortLevel: "Low" | "Medium" | "High";
  status: "Not Started" | "In Progress" | "Completed";
};

type HorizonKey = "NOW" | "NEAR" | "NEXT" | "MARVEL";

type Milestone = {
  id: string;
  title: string;
  description: string;
  targetDate: string; // yyyy-mm-dd
};

type SkillProgress = "Not Started" | "In Progress" | "Completed";
type SkillItem = { id: string; name: string; progress: SkillProgress };

const TABS: Array<{ key: WorkspaceTab; label: string; icon: string }> = [
  { key: "mindMap", label: "Mind Map", icon: "🧠" },
  { key: "timeHorizon", label: "Time Horizon", icon: "⏳" },
  { key: "roleComparison", label: "Role Comparison", icon: "⚖" },
  { key: "strategicPlan", label: "Strategic Plan", icon: "🎯" }
];

const HORIZONS: Array<{ key: HorizonKey; label: string; sublabel: string }> = [
  { key: "NOW", label: "NOW", sublabel: "0–6 months" },
  { key: "NEAR", label: "NEAR", sublabel: "6–24 months" },
  { key: "NEXT", label: "NEXT", sublabel: "2–5 years" },
  { key: "MARVEL", label: "MARVEL", sublabel: "5+ years" }
];

function uid(prefix: string) {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
}

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

function starRow(value: number) {
  const v = clamp(value, 1, 5);
  return (
    <div className="flex items-center gap-0.5" aria-label={`${v} out of 5`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i} className={cn("text-sm", i < v ? "text-amber-500" : "text-zinc-300")} aria-hidden="true">
          ★
        </span>
      ))}
    </div>
  );
}

function progressPercent(p: SkillProgress) {
  if (p === "Completed") return 100;
  if (p === "In Progress") return 55;
  return 0;
}

// PUBLIC_INTERFACE
export default function CareerStrategyWorkspacePage() {
  /** Career Strategy Workspace: one page with top tabs for Mind Map, Time Horizon, Role Comparison, and Strategic Plan. */

  // Keep the same placeholder current role as multiverse until persona state is wired.
  const currentRoleTitle = "Tech Lead";
  const currentRoleIndustry = "Technology";

  const roles: Role[] = React.useMemo(
    () => [
      {
        id: "r-em",
        title: "Engineering Manager",
        industry: "Technology",
        salaryRange: "$150k–$180k",
        requiredSkills: ["Leadership", "Strategy", "Hiring", "Delivery management"],
        transitionTimeline: "18 months",
        skillGap: ["Performance management", "Org design"],
        workLifeBalance: 4,
        growthPotential: 5
      },
      {
        id: "r-pm",
        title: "Product Manager",
        industry: "Technology",
        salaryRange: "$140k–$170k",
        requiredSkills: ["Strategy", "User research", "Metrics", "Communication"],
        transitionTimeline: "24 months",
        skillGap: ["Discovery", "Pricing"],
        workLifeBalance: 3,
        growthPotential: 4
      },
      {
        id: "r-arch",
        title: "Solutions Architect",
        industry: "SaaS",
        salaryRange: "$160k–$190k",
        requiredSkills: ["System Design", "Cloud Architecture", "Stakeholder alignment", "Documentation"],
        transitionTimeline: "30 months",
        skillGap: ["Sales partnership", "Enterprise security"],
        workLifeBalance: 4,
        growthPotential: 5
      },
      {
        id: "r-staff",
        title: "Staff Engineer",
        industry: "Technology",
        salaryRange: "$170k–$210k",
        requiredSkills: ["Technical leadership", "Architecture", "Mentorship", "Execution"],
        transitionTimeline: "12–18 months",
        skillGap: ["Influencing without authority"],
        workLifeBalance: 4,
        growthPotential: 5
      }
    ],
    []
  );

  const [activeTab, setActiveTab] = React.useState<WorkspaceTab>("mindMap");

  // ---- Mind map state ----
  const [selectedRoleId, setSelectedRoleId] = React.useState<string | null>(null);
  const selectedRole = React.useMemo(() => roles.find((r) => r.id === selectedRoleId) ?? null, [roles, selectedRoleId]);

  const [mapScale, setMapScale] = React.useState(1);
  const [mapOffset, setMapOffset] = React.useState({ x: 0, y: 0 });
  const dragState = React.useRef<{ isDown: boolean; startX: number; startY: number; ox: number; oy: number } | null>(null);

  const [mindMapFilters, setMindMapFilters] = React.useState({
    salary: "Any" as "Any" | "$120–160k" | "$160k+",
    similarity: "Any" as "Any" | "High" | "Medium" | "Low",
    time: "Any" as "Any" | "< 12 mo" | "12–24 mo" | "24+ mo"
  });

  // ---- Time horizon state ----
  const [opportunities, setOpportunities] = React.useState<Opportunity[]>(() => [
    {
      id: "opp-1",
      roleId: "r-em",
      horizon: "NEAR",
      requiredSkills: "Leadership, Strategy",
      effortLevel: "Medium",
      status: "Not Started"
    }
  ]);

  const [draftOpp, setDraftOpp] = React.useState({
    roleId: "r-em",
    horizon: "NOW" as HorizonKey,
    requiredSkills: "",
    effortLevel: "Medium" as Opportunity["effortLevel"],
    status: "Not Started" as Opportunity["status"]
  });

  const dragOppIdRef = React.useRef<string | null>(null);

  // ---- Role comparison state ----
  const [comparisonCart, setComparisonCart] = React.useState<string[]>([]);
  const [showMatrix, setShowMatrix] = React.useState(false);

  // ---- Strategic plan state ----
  const [milestones, setMilestones] = React.useState<Milestone[]>(() => [
    {
      id: "ms-1",
      title: "Lead Cross-Team Project",
      description: "Own delivery across at least two teams; build stakeholder alignment and a measurable outcome.",
      targetDate: "2026-09-01"
    }
  ]);

  const [skills, setSkills] = React.useState<SkillItem[]>(() => [
    { id: "sk-1", name: "System Design", progress: "In Progress" },
    { id: "sk-2", name: "Leadership", progress: "Not Started" },
    { id: "sk-3", name: "Cloud Architecture", progress: "Completed" }
  ]);

  const todayISO = React.useMemo(() => new Date().toISOString().slice(0, 10), []);
  const overdueCount = React.useMemo(() => milestones.filter((m) => m.targetDate < todayISO).length, [milestones, todayISO]);

  const skillsInProgressCount = React.useMemo(() => skills.filter((s) => s.progress === "In Progress").length, [skills]);
  const upcomingDeadline = React.useMemo(() => {
    const sorted = [...milestones].sort((a, b) => a.targetDate.localeCompare(b.targetDate));
    return sorted[0]?.targetDate ?? null;
  }, [milestones]);

  const switchTab = React.useCallback((next: WorkspaceTab) => {
    setActiveTab(next);
  }, []);

  const handlePlanTimeline = React.useCallback(() => {
    // Animated feel is achieved by content enter animation per view (cn-csw-viewEnter)
    switchTab("timeHorizon");
  }, [switchTab]);

  const handleCompareRolesCTA = React.useCallback(() => {
    switchTab("roleComparison");
  }, [switchTab]);

  const handleCreateStrategicPlanCTA = React.useCallback(() => {
    switchTab("strategicPlan");
  }, [switchTab]);

  const addToComparison = React.useCallback((roleId: string) => {
    setComparisonCart((prev) => {
      if (prev.includes(roleId)) return prev;
      if (prev.length >= 5) return prev;
      return [...prev, roleId];
    });
  }, []);

  const removeFromComparison = React.useCallback((roleId: string) => {
    setComparisonCart((prev) => prev.filter((id) => id !== roleId));
  }, []);

  const canCompare = comparisonCart.length >= 2;

  const resetMindMapView = React.useCallback(() => {
    setMapScale(1);
    setMapOffset({ x: 0, y: 0 });
  }, []);

  const beginPan = (e: React.PointerEvent<HTMLDivElement>) => {
    // Don't start panning if user is clicking buttons/controls inside.
    const target = e.target as HTMLElement | null;
    if (target?.closest("[data-no-pan='true']")) return;

    (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
    dragState.current = { isDown: true, startX: e.clientX, startY: e.clientY, ox: mapOffset.x, oy: mapOffset.y };
  };

  const onPanMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragState.current?.isDown) return;
    const dx = e.clientX - dragState.current.startX;
    const dy = e.clientY - dragState.current.startY;
    setMapOffset({ x: dragState.current.ox + dx, y: dragState.current.oy + dy });
  };

  const endPan = () => {
    if (!dragState.current) return;
    dragState.current.isDown = false;
  };

  // Mind map "nodes": fixed layout to match the spec conceptually.
  const mindMapNodes = React.useMemo(() => {
    const byId = new Map(roles.map((r) => [r.id, r]));
    const pick = (id: string) => byId.get(id)!;
    return [
      { id: "center", role: { id: "current", title: currentRoleTitle, industry: currentRoleIndustry }, x: 0, y: 0, clickable: false },
      { id: "left", role: pick("r-pm"), x: -220, y: -10, clickable: true },
      { id: "right", role: pick("r-arch"), x: 220, y: -10, clickable: true },
      { id: "up", role: pick("r-em"), x: 0, y: -170, clickable: true },
      { id: "down", role: pick("r-staff"), x: 0, y: 170, clickable: true }
    ] as const;
  }, [roles, currentRoleTitle, currentRoleIndustry]);

  const mindMapEdges = React.useMemo(() => {
    // directional-ish lines around the center node per spec.
    return [
      { from: "center", to: "up" },
      { from: "center", to: "left" },
      { from: "center", to: "right" },
      { from: "center", to: "down" }
    ] as const;
  }, []);

  const filteredMindMapNodes = React.useMemo(() => {
    // Filters are wired with a simple placeholder behavior (spec says salary/timeline placeholders are OK as long as UI behaves).
    return mindMapNodes.filter((n) => {
      if (!n.clickable) return true;
      if (mindMapFilters.salary === "$160k+") return n.role.salaryRange?.includes("160") ?? true;
      if (mindMapFilters.salary === "$120–160k") return n.role.salaryRange?.includes("150") ?? true;

      if (mindMapFilters.time !== "Any") {
        const tl = (n.role.transitionTimeline ?? "").toLowerCase();
        if (mindMapFilters.time === "< 12 mo" && !(tl.includes("12") && tl.includes("–"))) return false;
        if (mindMapFilters.time === "12–24 mo" && !(tl.includes("18") || tl.includes("24"))) return false;
        if (mindMapFilters.time === "24+ mo" && !(tl.includes("30") || tl.includes("36") || tl.includes("24"))) return false;
      }

      // similarity filter is a placeholder toggle (no profile evidence yet).
      return true;
    });
  }, [mindMapNodes, mindMapFilters]);

  const onDropToHorizon = (horizon: HorizonKey) => {
    const id = dragOppIdRef.current;
    if (!id) return;
    setOpportunities((prev) => prev.map((o) => (o.id === id ? { ...o, horizon } : o)));
    dragOppIdRef.current = null;
  };

  const addOpportunity = () => {
    const id = uid("opp");
    setOpportunities((prev) => [
      ...prev,
      {
        id,
        roleId: draftOpp.roleId,
        horizon: draftOpp.horizon,
        requiredSkills: draftOpp.requiredSkills || "—",
        effortLevel: draftOpp.effortLevel,
        status: draftOpp.status
      }
    ]);
    setDraftOpp((p) => ({ ...p, requiredSkills: "" }));
  };

  const updateOpportunity = (oppId: string, patch: Partial<Opportunity>) => {
    setOpportunities((prev) => prev.map((o) => (o.id === oppId ? { ...o, ...patch } : o)));
  };

  const removeOpportunity = (oppId: string) => {
    setOpportunities((prev) => prev.filter((o) => o.id !== oppId));
  };

  const addMilestone = () => {
    const id = uid("ms");
    setMilestones((prev) => [
      ...prev,
      { id, title: "New Milestone", description: "", targetDate: todayISO }
    ]);
  };

  const updateMilestone = (id: string, patch: Partial<Milestone>) => {
    setMilestones((prev) => prev.map((m) => (m.id === id ? { ...m, ...patch } : m)));
  };

  const deleteMilestone = (id: string) => {
    setMilestones((prev) => prev.filter((m) => m.id !== id));
  };

  const addSkill = () => {
    const id = uid("sk");
    setSkills((prev) => [...prev, { id, name: "New Skill", progress: "Not Started" }]);
  };

  const updateSkill = (id: string, patch: Partial<SkillItem>) => {
    setSkills((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  };

  const deleteSkill = (id: string) => {
    setSkills((prev) => prev.filter((s) => s.id !== id));
  };

  return (
    <div className="cn-csw-pageEnter">
      <PageHeader
        title="Career Strategy Workspace"
        subtitle="Turn multiverse exploration into an actionable strategy—timeline, comparisons, and a concrete plan."
        titleClassName="cn-enter-up"
        subtitleClassName="cn-subtext-enter"
      />

      {/* Top tabs */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {TABS.map((t) => {
            const active = t.key === activeTab;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => {
                  setShowMatrix(false);
                  switchTab(t.key);
                }}
                className={cn(
                  "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold",
                  "ring-1 ring-inset transition-all",
                  active
                    ? "bg-teal-50 text-teal-800 ring-teal-200 shadow-sm"
                    : "bg-white text-zinc-700 ring-zinc-200 hover:ring-teal-200"
                )}
              >
                <span aria-hidden="true">{t.icon}</span>
                {t.label}
              </button>
            );
          })}
        </div>

        <div className="text-xs font-semibold text-zinc-600">
          Default: <span className="font-bold text-zinc-900">Mind Map</span>
        </div>
      </div>

      {activeTab === "mindMap" && (
        <div className="cn-csw-viewEnter">
          <Card
            className="relative overflow-hidden"
            title="Mind Map"
            description="Explore career paths visually. Click a role node to open the Role Detail Panel."
          >
            {/* Filters bar (per spec) */}
            <div className="mb-3 flex flex-col gap-2 md:flex-row md:items-end md:justify-between" data-no-pan="true">
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                <label className="text-xs font-semibold text-zinc-600">
                  Salary Range
                  <select
                    className="mt-1 w-full rounded-xl bg-white px-3 py-2 text-sm text-zinc-900 ring-1 ring-inset ring-zinc-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30"
                    value={mindMapFilters.salary}
                    onChange={(e) => setMindMapFilters((p) => ({ ...p, salary: e.target.value as any }))}
                  >
                    <option>Any</option>
                    <option>$120–160k</option>
                    <option>$160k+</option>
                  </select>
                </label>

                <label className="text-xs font-semibold text-zinc-600">
                  Skill Similarity
                  <select
                    className="mt-1 w-full rounded-xl bg-white px-3 py-2 text-sm text-zinc-900 ring-1 ring-inset ring-zinc-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30"
                    value={mindMapFilters.similarity}
                    onChange={(e) => setMindMapFilters((p) => ({ ...p, similarity: e.target.value as any }))}
                  >
                    <option>Any</option>
                    <option>High</option>
                    <option>Medium</option>
                    <option>Low</option>
                  </select>
                </label>

                <label className="text-xs font-semibold text-zinc-600">
                  Time Horizon
                  <select
                    className="mt-1 w-full rounded-xl bg-white px-3 py-2 text-sm text-zinc-900 ring-1 ring-inset ring-zinc-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30"
                    value={mindMapFilters.time}
                    onChange={(e) => setMindMapFilters((p) => ({ ...p, time: e.target.value as any }))}
                  >
                    <option>Any</option>
                    <option>{`< 12 mo`}</option>
                    <option>12–24 mo</option>
                    <option>24+ mo</option>
                  </select>
                </label>
              </div>

              {/* Zoom/pan controls (top-right per spec) */}
              <div className="flex items-center justify-between gap-2 md:justify-end">
                <div className="text-xs font-semibold text-zinc-500">Zoom</div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => setMapScale((s) => clamp(Number((s - 0.1).toFixed(2)), 0.6, 1.8))}
                    data-no-pan="true"
                  >
                    −
                  </Button>
                  <div className="min-w-[62px] text-center text-xs font-bold tabular-nums text-zinc-700" data-no-pan="true">
                    {Math.round(mapScale * 100)}%
                  </div>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => setMapScale((s) => clamp(Number((s + 0.1).toFixed(2)), 0.6, 1.8))}
                    data-no-pan="true"
                  >
                    +
                  </Button>
                  <Button size="sm" variant="ghost" onClick={resetMindMapView} data-no-pan="true">
                    Reset View
                  </Button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
              {/* Canvas */}
              <div className="lg:col-span-8">
                <div
                  className={cn(
                    "relative h-[520px] overflow-hidden rounded-2xl bg-white ring-1 ring-inset ring-zinc-200",
                    "cursor-grab active:cursor-grabbing"
                  )}
                  onPointerDown={beginPan}
                  onPointerMove={onPanMove}
                  onPointerUp={endPan}
                  onPointerCancel={endPan}
                  role="application"
                  aria-label="Mind map canvas (drag to pan)."
                >
                  {/* Light ambient grid */}
                  <div className="pointer-events-none absolute inset-0 opacity-40 [background-image:linear-gradient(to_right,rgba(24,24,27,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(24,24,27,0.05)_1px,transparent_1px)] [background-size:56px_56px]" />

                  <div
                    className="absolute left-1/2 top-1/2"
                    style={{
                      transform: `translate(-50%, -50%) translate(${mapOffset.x}px, ${mapOffset.y}px) scale(${mapScale})`,
                      transition: "transform 180ms ease"
                    }}
                  >
                    {/* edges */}
                    <svg className="absolute left-0 top-0 overflow-visible" width="1" height="1" aria-hidden="true">
                      <defs>
                        <marker id="arrow" markerWidth="10" markerHeight="10" refX="6" refY="3" orient="auto" markerUnits="strokeWidth">
                          <path d="M0,0 L0,6 L6,3 z" fill="rgba(13,148,136,0.55)" />
                        </marker>
                      </defs>

                      {mindMapEdges.map((e) => {
                        const from = filteredMindMapNodes.find((n) => n.id === e.from);
                        const to = filteredMindMapNodes.find((n) => n.id === e.to);
                        if (!from || !to) return null;
                        return (
                          <line
                            key={`${e.from}-${e.to}`}
                            x1={from.x}
                            y1={from.y}
                            x2={to.x}
                            y2={to.y}
                            stroke="rgba(13,148,136,0.35)"
                            strokeWidth="2.2"
                            markerEnd="url(#arrow)"
                          />
                        );
                      })}
                    </svg>

                    {/* nodes */}
                    {filteredMindMapNodes.map((n) => {
                      const isCenter = n.id === "center";
                      const isSelected = selectedRoleId && n.role.id === selectedRoleId;
                      return (
                        <button
                          key={n.id}
                          type="button"
                          data-no-pan="true"
                          onClick={() => {
                            if (!n.clickable) return;
                            setSelectedRoleId((prev) => (prev === n.role.id ? null : n.role.id));
                          }}
                          className={cn(
                            "absolute -translate-x-1/2 -translate-y-1/2",
                            "grid place-items-center rounded-full",
                            "h-[110px] w-[110px] p-3 text-center",
                            "bg-white ring-1 ring-inset ring-zinc-200 shadow-sm",
                            "transition-all duration-200",
                            n.clickable ? "hover:-translate-y-[calc(50%+2px)] hover:shadow-md" : "",
                            n.clickable ? "hover:ring-teal-200" : "",
                            isSelected ? "ring-teal-200 shadow-[0_18px_42px_rgba(13,148,136,0.14),0_0_26px_rgba(20,184,166,0.20)]" : "",
                            isCenter ? "ring-teal-200 shadow-[0_18px_42px_rgba(13,148,136,0.14)]" : ""
                          )}
                          style={{ left: n.x, top: n.y }}
                          aria-label={isCenter ? `Current role: ${n.role.title}` : `Role node: ${n.role.title}`}
                        >
                          <div className="flex flex-col items-center">
                            <div className={cn("text-xs font-bold text-zinc-900", !isCenter && "group-hover:text-zinc-900")}>
                              {n.role.title}
                            </div>
                            <div className="mt-1 text-[10px] font-semibold text-zinc-500">{n.role.industry}</div>
                            {!isCenter && (
                              <div className="mt-2 text-[10px] font-semibold text-teal-700">Click</div>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Transition CTA to Time Horizon (per spec) */}
                <div className="mt-4 flex justify-end" data-no-pan="true">
                  <Button
                    className="cn-mv-btnGlow"
                    onClick={handlePlanTimeline}
                    rightIcon={<span aria-hidden="true">→</span>}
                  >
                    Plan My Career Timeline
                  </Button>
                </div>
              </div>

              {/* Role Detail Panel */}
              <div className="lg:col-span-4">
                <div
                  className={cn(
                    "rounded-2xl bg-white p-4 ring-1 ring-inset ring-zinc-200",
                    selectedRole ? "cn-csw-panelEnter" : "opacity-95"
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-bold text-zinc-900">Role Detail Panel</h3>
                      <p className="mt-1 text-xs text-zinc-600">Select a node to view salary, skills, timeline, and gaps.</p>
                    </div>
                    {selectedRole && (
                      <Button size="sm" variant="ghost" onClick={() => setSelectedRoleId(null)}>
                        Close
                      </Button>
                    )}
                  </div>

                  {!selectedRole ? (
                    <div className="mt-3 rounded-xl bg-zinc-50 p-3 text-sm text-zinc-700 ring-1 ring-inset ring-zinc-200">
                      Click a role node to open details.
                    </div>
                  ) : (
                    <div className="mt-3 space-y-3">
                      <section className="rounded-xl bg-zinc-50 p-3 ring-1 ring-inset ring-zinc-200">
                        <div className="text-sm font-bold text-zinc-900">{selectedRole.title}</div>
                        <div className="mt-1 text-xs font-semibold text-zinc-600">{selectedRole.industry}</div>
                      </section>

                      <section className="grid grid-cols-2 gap-2">
                        <div className="rounded-xl bg-white p-3 ring-1 ring-inset ring-zinc-200">
                          <div className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">Average Salary</div>
                          <div className="mt-1 text-sm font-bold text-teal-700">{selectedRole.salaryRange}</div>
                        </div>
                        <div className="rounded-xl bg-white p-3 ring-1 ring-inset ring-zinc-200">
                          <div className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">Transition Timeline</div>
                          <div className="mt-1 text-sm font-bold text-zinc-900">{selectedRole.transitionTimeline}</div>
                        </div>
                      </section>

                      <section className="rounded-xl bg-white p-3 ring-1 ring-inset ring-zinc-200">
                        <div className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">Required Skills</div>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {selectedRole.requiredSkills.map((s) => (
                            <span key={s} className="rounded-full bg-teal-50 px-2 py-1 text-[11px] font-semibold text-teal-800 ring-1 ring-inset ring-teal-200">
                              {s}
                            </span>
                          ))}
                        </div>
                      </section>

                      <section className="rounded-xl bg-white p-3 ring-1 ring-inset ring-zinc-200">
                        <div className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">Skill Gap (vs profile)</div>
                        <div className="mt-2 grid gap-2">
                          {selectedRole.skillGap.map((g) => (
                            <div key={g} className="rounded-lg bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-900 ring-1 ring-inset ring-amber-200">
                              {g}
                            </div>
                          ))}
                        </div>
                      </section>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {activeTab === "timeHorizon" && (
        <div className="cn-csw-viewEnter">
          <Card
            className="relative overflow-hidden"
            title="Time Horizon"
            description="Convert exploration into a timeline. Drag cards between sections to update the time horizon."
          >
            {/* Add opportunity */}
            <div className="mb-4 grid grid-cols-1 gap-2 md:grid-cols-6">
              <label className="text-xs font-semibold text-zinc-600 md:col-span-2">
                Opportunity Role
                <select
                  className="mt-1 w-full rounded-xl bg-white px-3 py-2 text-sm text-zinc-900 ring-1 ring-inset ring-zinc-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30"
                  value={draftOpp.roleId}
                  onChange={(e) => setDraftOpp((p) => ({ ...p, roleId: e.target.value }))}
                >
                  {roles.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.title}
                    </option>
                  ))}
                </select>
              </label>

              <label className="text-xs font-semibold text-zinc-600 md:col-span-1">
                Horizon
                <select
                  className="mt-1 w-full rounded-xl bg-white px-3 py-2 text-sm text-zinc-900 ring-1 ring-inset ring-zinc-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30"
                  value={draftOpp.horizon}
                  onChange={(e) => setDraftOpp((p) => ({ ...p, horizon: e.target.value as HorizonKey }))}
                >
                  {HORIZONS.map((h) => (
                    <option key={h.key} value={h.key}>
                      {h.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="text-xs font-semibold text-zinc-600 md:col-span-1">
                Effort
                <select
                  className="mt-1 w-full rounded-xl bg-white px-3 py-2 text-sm text-zinc-900 ring-1 ring-inset ring-zinc-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30"
                  value={draftOpp.effortLevel}
                  onChange={(e) => setDraftOpp((p) => ({ ...p, effortLevel: e.target.value as any }))}
                >
                  <option>Low</option>
                  <option>Medium</option>
                  <option>High</option>
                </select>
              </label>

              <label className="text-xs font-semibold text-zinc-600 md:col-span-1">
                Status
                <select
                  className="mt-1 w-full rounded-xl bg-white px-3 py-2 text-sm text-zinc-900 ring-1 ring-inset ring-zinc-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30"
                  value={draftOpp.status}
                  onChange={(e) => setDraftOpp((p) => ({ ...p, status: e.target.value as any }))}
                >
                  <option>Not Started</option>
                  <option>In Progress</option>
                  <option>Completed</option>
                </select>
              </label>

              <label className="text-xs font-semibold text-zinc-600 md:col-span-1">
                Required Skills
                <input
                  className="mt-1 w-full rounded-xl bg-white px-3 py-2 text-sm text-zinc-900 ring-1 ring-inset ring-zinc-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30"
                  value={draftOpp.requiredSkills}
                  onChange={(e) => setDraftOpp((p) => ({ ...p, requiredSkills: e.target.value }))}
                  placeholder="Leadership, Strategy"
                />
              </label>

              <div className="md:col-span-6 flex justify-end pt-1">
                <Button onClick={addOpportunity} rightIcon={<span aria-hidden="true">＋</span>}>
                  Add Opportunity
                </Button>
              </div>
            </div>

            {/* Timeline */}
            <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
              {HORIZONS.map((h) => (
                <section
                  key={h.key}
                  className={cn(
                    "rounded-2xl bg-white ring-1 ring-inset ring-zinc-200",
                    "min-h-[340px] overflow-hidden"
                  )}
                  onDragOver={(e) => {
                    e.preventDefault();
                  }}
                  onDrop={() => onDropToHorizon(h.key)}
                >
                  <header className={cn("border-b border-zinc-200 px-4 py-3", "bg-gradient-to-b from-zinc-50 to-white")}>
                    <div className="flex items-baseline justify-between">
                      <h3 className="text-xs font-bold tracking-wide text-zinc-900">{h.label}</h3>
                      <span className="text-[10px] font-semibold text-zinc-500">{h.sublabel}</span>
                    </div>
                  </header>

                  <div className="p-3 space-y-2">
                    {opportunities
                      .filter((o) => o.horizon === h.key)
                      .map((o) => {
                        const r = roles.find((rr) => rr.id === o.roleId);
                        return (
                          <article
                            key={o.id}
                            draggable
                            onDragStart={() => {
                              dragOppIdRef.current = o.id;
                            }}
                            className={cn(
                              "group rounded-2xl bg-white p-3 ring-1 ring-inset ring-zinc-200",
                              "shadow-sm transition-all duration-200",
                              "hover:-translate-y-0.5 hover:shadow-md hover:ring-teal-200"
                            )}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <div className="text-sm font-bold text-zinc-900">{r?.title ?? "Role"}</div>
                                <div className="mt-0.5 text-[11px] font-semibold text-zinc-500">{r?.industry ?? "—"}</div>
                              </div>
                              <button
                                type="button"
                                onClick={() => removeOpportunity(o.id)}
                                className="rounded-lg px-2 py-1 text-xs font-bold text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"
                              >
                                ×
                              </button>
                            </div>

                            <div className="mt-2 text-xs text-zinc-700">
                              <span className="font-semibold text-zinc-800">Required Skills:</span> {o.requiredSkills}
                            </div>

                            <div className="mt-2 grid grid-cols-2 gap-2">
                              <label className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
                                Effort
                                <select
                                  className="mt-1 w-full rounded-xl bg-white px-2 py-1.5 text-xs text-zinc-900 ring-1 ring-inset ring-zinc-200 focus:outline-none focus:ring-2 focus:ring-teal-500/30"
                                  value={o.effortLevel}
                                  onChange={(e) => updateOpportunity(o.id, { effortLevel: e.target.value as any })}
                                >
                                  <option>Low</option>
                                  <option>Medium</option>
                                  <option>High</option>
                                </select>
                              </label>

                              <label className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
                                Status
                                <select
                                  className="mt-1 w-full rounded-xl bg-white px-2 py-1.5 text-xs text-zinc-900 ring-1 ring-inset ring-zinc-200 focus:outline-none focus:ring-2 focus:ring-teal-500/30"
                                  value={o.status}
                                  onChange={(e) => updateOpportunity(o.id, { status: e.target.value as any })}
                                >
                                  <option>Not Started</option>
                                  <option>In Progress</option>
                                  <option>Completed</option>
                                </select>
                              </label>
                            </div>
                          </article>
                        );
                      })}

                    {opportunities.filter((o) => o.horizon === h.key).length === 0 && (
                      <div className="rounded-xl bg-zinc-50 p-3 text-sm text-zinc-600 ring-1 ring-inset ring-zinc-200">
                        Drag opportunities here.
                      </div>
                    )}
                  </div>
                </section>
              ))}
            </div>

            {/* Transition CTA to Role Comparison (per spec) */}
            <div className="mt-4 flex justify-end">
              <Button onClick={handleCompareRolesCTA} rightIcon={<span aria-hidden="true">→</span>}>
                Compare Target Roles
              </Button>
            </div>
          </Card>
        </div>
      )}

      {activeTab === "roleComparison" && (
        <div className="cn-csw-viewEnter">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
            <section className="lg:col-span-8">
              <Card
                title="Role Comparison"
                description="Add up to 5 roles into the Comparison Cart, then compare side-by-side."
              >
                {/* Role picker list */}
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  {roles.map((r) => {
                    const inCart = comparisonCart.includes(r.id);
                    return (
                      <div
                        key={r.id}
                        className={cn(
                          "rounded-2xl bg-white p-4 ring-1 ring-inset ring-zinc-200",
                          "transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:ring-teal-200"
                        )}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="text-sm font-bold text-zinc-900">{r.title}</div>
                            <div className="mt-1 text-xs font-semibold text-zinc-500">{r.industry}</div>
                          </div>

                          <div className="shrink-0">
                            <Button
                              size="sm"
                              variant={inCart ? "secondary" : "primary"}
                              onClick={() => (inCart ? removeFromComparison(r.id) : addToComparison(r.id))}
                            >
                              {inCart ? "Remove" : "Add"}
                            </Button>
                          </div>
                        </div>

                        <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                          <div className="rounded-xl bg-zinc-50 p-3 ring-1 ring-inset ring-zinc-200">
                            <div className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">Salary Range</div>
                            <div className="mt-1 font-bold text-teal-700">{r.salaryRange}</div>
                          </div>
                          <div className="rounded-xl bg-zinc-50 p-3 ring-1 ring-inset ring-zinc-200">
                            <div className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">Timeline</div>
                            <div className="mt-1 font-bold text-zinc-900">{r.transitionTimeline}</div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Matrix */}
                <div className="mt-4 rounded-2xl bg-white p-4 ring-1 ring-inset ring-zinc-200">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="text-sm font-bold text-zinc-900">Comparison Matrix</div>
                      <div className="mt-1 text-xs text-zinc-600">Select roles in the cart and click Compare Roles.</div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        onClick={() => setShowMatrix(true)}
                        disabled={!canCompare}
                        variant={canCompare ? "primary" : "secondary"}
                      >
                        Compare Roles
                      </Button>
                    </div>
                  </div>

                  {!canCompare && (
                    <div className="mt-3 rounded-xl bg-amber-50 p-3 text-sm text-amber-900 ring-1 ring-inset ring-amber-200">
                      Select at least two roles to compare.
                    </div>
                  )}

                  {showMatrix && canCompare && (
                    <div className="mt-4 overflow-x-auto">
                      <table className="min-w-[820px] w-full border-separate border-spacing-0">
                        <thead>
                          <tr>
                            <th className="sticky left-0 z-10 bg-white p-3 text-left text-xs font-bold text-zinc-600 ring-1 ring-inset ring-zinc-200 rounded-l-xl">
                              Factor
                            </th>
                            {comparisonCart.map((id, idx) => {
                              const r = roles.find((rr) => rr.id === id)!;
                              return (
                                <th
                                  key={id}
                                  className={cn(
                                    "p-3 text-left text-xs font-bold text-zinc-900 ring-1 ring-inset ring-zinc-200 bg-white",
                                    idx === comparisonCart.length - 1 ? "rounded-r-xl" : ""
                                  )}
                                >
                                  {r.title}
                                </th>
                              );
                            })}
                          </tr>
                        </thead>
                        <tbody>
                          {[
                            {
                              k: "Salary Range",
                              render: (r: Role) => <span className="font-semibold text-teal-700">{r.salaryRange}</span>
                            },
                            {
                              k: "Required Skills",
                              render: (r: Role) => (
                                <div className="flex flex-wrap gap-1">
                                  {r.requiredSkills.slice(0, 4).map((s) => (
                                    <span key={s} className="rounded-full bg-teal-50 px-2 py-1 text-[11px] font-semibold text-teal-800 ring-1 ring-inset ring-teal-200">
                                      {s}
                                    </span>
                                  ))}
                                </div>
                              )
                            },
                            { k: "Transition Timeline", render: (r: Role) => <span className="font-semibold text-zinc-900">{r.transitionTimeline}</span> },
                            { k: "Work-Life Balance", render: (r: Role) => starRow(r.workLifeBalance) },
                            { k: "Growth Potential", render: (r: Role) => starRow(r.growthPotential) }
                          ].map((row) => (
                            <tr key={row.k}>
                              <td className="sticky left-0 z-10 bg-white p-3 text-xs font-bold text-zinc-600 ring-1 ring-inset ring-zinc-200">
                                {row.k}
                              </td>
                              {comparisonCart.map((id) => {
                                const r = roles.find((rr) => rr.id === id)!;
                                return (
                                  <td key={`${row.k}-${id}`} className="p-3 align-top text-sm text-zinc-700 ring-1 ring-inset ring-zinc-200 bg-white">
                                    {row.render(r)}
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>

                      {/* Transition CTA to Strategic Plan (per spec) */}
                      <div className="mt-4 flex justify-end">
                        <Button onClick={handleCreateStrategicPlanCTA} rightIcon={<span aria-hidden="true">→</span>}>
                          Create Strategic Career Plan
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            </section>

            {/* Role Comparison Cart (top-right per spec) */}
            <aside className="lg:col-span-4">
              <div className="sticky top-4">
                <Card title={`Comparison Cart (${comparisonCart.length})`} description="Add up to 5 roles.">
                  <div className="space-y-2">
                    {comparisonCart.length === 0 ? (
                      <div className="rounded-xl bg-zinc-50 p-3 text-sm text-zinc-600 ring-1 ring-inset ring-zinc-200">
                        No roles added yet.
                      </div>
                    ) : (
                      comparisonCart.map((id) => {
                        const r = roles.find((rr) => rr.id === id)!;
                        return (
                          <div key={id} className="flex items-center justify-between gap-3 rounded-xl bg-white p-3 ring-1 ring-inset ring-zinc-200">
                            <div className="min-w-0">
                              <div className="truncate text-sm font-bold text-zinc-900">{r.title}</div>
                              <div className="mt-0.5 text-xs font-semibold text-zinc-500">{r.industry}</div>
                            </div>
                            <Button size="sm" variant="ghost" onClick={() => removeFromComparison(id)}>
                              Remove
                            </Button>
                          </div>
                        );
                      })
                    )}
                  </div>

                  <div className="mt-4">
                    <Button
                      className="w-full"
                      onClick={() => setShowMatrix(true)}
                      disabled={!canCompare}
                      variant={canCompare ? "primary" : "secondary"}
                    >
                      Compare Roles
                    </Button>
                    {!canCompare && (
                      <p className="mt-2 text-xs font-semibold text-amber-700">Select at least two roles to compare.</p>
                    )}
                  </div>
                </Card>
              </div>
            </aside>
          </div>
        </div>
      )}

      {activeTab === "strategicPlan" && (
        <div className="cn-csw-viewEnter">
          <Card
            title="Strategic Plan"
            description="Build a concrete action plan: milestones + skill development tracker."
          >
            {/* Summary dashboard (per spec) */}
            <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-3">
              <div className="rounded-2xl bg-white p-4 ring-1 ring-inset ring-zinc-200">
                <div className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">Total Milestones</div>
                <div className="mt-1 text-2xl font-bold tabular-nums text-zinc-900">{milestones.length}</div>
              </div>
              <div className="rounded-2xl bg-white p-4 ring-1 ring-inset ring-zinc-200">
                <div className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">Skills In Progress</div>
                <div className="mt-1 text-2xl font-bold tabular-nums text-teal-700">{skillsInProgressCount}</div>
              </div>
              <div className="rounded-2xl bg-white p-4 ring-1 ring-inset ring-zinc-200">
                <div className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">Upcoming Deadlines</div>
                <div className={cn("mt-1 text-sm font-bold tabular-nums", overdueCount > 0 ? "text-rose-700" : "text-zinc-900")}>
                  {upcomingDeadline ?? "—"}
                </div>
                {overdueCount > 0 && (
                  <div className="mt-1 text-xs font-semibold text-rose-700">{overdueCount} overdue</div>
                )}
              </div>
            </div>

            {/* Two-column layout */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
              {/* Milestone timeline */}
              <section className="lg:col-span-6">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-sm font-bold text-zinc-900">Milestone Timeline</h3>
                  <Button size="sm" variant="secondary" onClick={addMilestone}>
                    Add Milestone
                  </Button>
                </div>

                <div className="mt-3 space-y-3">
                  {[...milestones]
                    .sort((a, b) => a.targetDate.localeCompare(b.targetDate))
                    .map((m, idx) => {
                      const isOverdue = m.targetDate < todayISO;
                      return (
                        <div key={m.id} className="relative rounded-2xl bg-white p-4 ring-1 ring-inset ring-zinc-200">
                          <div className="absolute left-4 top-4 h-full w-px bg-zinc-200" aria-hidden="true" />
                          <div
                            className={cn(
                              "absolute left-[11px] top-5 h-3 w-3 rounded-full",
                              isOverdue ? "bg-rose-500 shadow-[0_0_18px_rgba(244,63,94,0.25)]" : "bg-teal-600 shadow-[0_0_18px_rgba(20,184,166,0.22)]"
                            )}
                            aria-hidden="true"
                          />
                          <div className="pl-6">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <input
                                  className="w-full rounded-lg bg-zinc-50 px-3 py-2 text-sm font-bold text-zinc-900 ring-1 ring-inset ring-zinc-200 focus:outline-none focus:ring-2 focus:ring-teal-500/30"
                                  value={m.title}
                                  onChange={(e) => updateMilestone(m.id, { title: e.target.value })}
                                  aria-label={`Milestone title ${idx + 1}`}
                                />
                                <textarea
                                  className="mt-2 w-full rounded-lg bg-zinc-50 px-3 py-2 text-sm text-zinc-700 ring-1 ring-inset ring-zinc-200 focus:outline-none focus:ring-2 focus:ring-teal-500/30"
                                  value={m.description}
                                  onChange={(e) => updateMilestone(m.id, { description: e.target.value })}
                                  rows={3}
                                  placeholder="Description"
                                />
                              </div>

                              <div className="shrink-0 text-right">
                                <div className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">Target Date</div>
                                <input
                                  type="date"
                                  className={cn(
                                    "mt-1 rounded-xl px-3 py-2 text-sm font-semibold ring-1 ring-inset focus:outline-none focus:ring-2 focus:ring-teal-500/30",
                                    isOverdue ? "bg-rose-50 text-rose-800 ring-rose-200" : "bg-white text-zinc-900 ring-zinc-200"
                                  )}
                                  value={m.targetDate}
                                  onChange={(e) => updateMilestone(m.id, { targetDate: e.target.value })}
                                />
                                <div className="mt-2 flex justify-end">
                                  <Button size="sm" variant="ghost" onClick={() => deleteMilestone(m.id)}>
                                    Delete
                                  </Button>
                                </div>
                              </div>
                            </div>

                            {isOverdue && (
                              <div className="mt-2 rounded-xl bg-rose-50 p-3 text-xs font-semibold text-rose-800 ring-1 ring-inset ring-rose-200">
                                Overdue milestone — update the date or break it into smaller steps.
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>
              </section>

              {/* Skills tracker */}
              <section className="lg:col-span-6">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-sm font-bold text-zinc-900">Skill Development Tracker</h3>
                  <Button size="sm" variant="secondary" onClick={addSkill}>
                    Add Skill
                  </Button>
                </div>

                <div className="mt-3 space-y-3">
                  {skills.map((s) => {
                    const pct = progressPercent(s.progress);
                    return (
                      <div key={s.id} className="rounded-2xl bg-white p-4 ring-1 ring-inset ring-zinc-200">
                        <div className="flex items-start justify-between gap-3">
                          <input
                            className="w-full rounded-lg bg-zinc-50 px-3 py-2 text-sm font-bold text-zinc-900 ring-1 ring-inset ring-zinc-200 focus:outline-none focus:ring-2 focus:ring-teal-500/30"
                            value={s.name}
                            onChange={(e) => updateSkill(s.id, { name: e.target.value })}
                            aria-label={`Skill name: ${s.name}`}
                          />

                          <Button size="sm" variant="ghost" onClick={() => deleteSkill(s.id)}>
                            Delete
                          </Button>
                        </div>

                        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
                          <label className="text-xs font-semibold text-zinc-600 sm:col-span-1">
                            Progress
                            <select
                              className="mt-1 w-full rounded-xl bg-white px-3 py-2 text-sm text-zinc-900 ring-1 ring-inset ring-zinc-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30"
                              value={s.progress}
                              onChange={(e) => updateSkill(s.id, { progress: e.target.value as SkillProgress })}
                            >
                              <option>Not Started</option>
                              <option>In Progress</option>
                              <option>Completed</option>
                            </select>
                          </label>

                          <div className="sm:col-span-2">
                            <div className="text-xs font-semibold text-zinc-600">Progress Bar</div>
                            <div className="mt-2 h-3 w-full rounded-full bg-zinc-100 ring-1 ring-inset ring-zinc-200 overflow-hidden">
                              <div
                                className="h-full rounded-full bg-gradient-to-r from-teal-600 via-teal-500 to-emerald-500"
                                style={{ width: `${pct}%`, transition: "width 520ms cubic-bezier(0.22, 1, 0.36, 1)" }}
                                aria-hidden="true"
                              />
                            </div>
                            <div className="mt-1 text-xs font-semibold text-zinc-500 tabular-nums">{pct}%</div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            </div>

            {/* Final action buttons (per spec) */}
            <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-end">
              <Button variant="secondary" onClick={() => alert("Saved (placeholder).")}>
                Save Career Plan
              </Button>
              <Button variant="secondary" onClick={() => alert("Exported (placeholder).")}>
                Export Career Plan
              </Button>
              <Button onClick={() => alert("Tracking started (placeholder).")}>
                Track Progress
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
