"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { cn } from "@/lib/cn";
import MultiverseBranchingMap, {
  type MultiverseNode,
  type MultiversePath,
  type PathType
} from "@/components/multiverse/MultiverseBranchingMap";

type Filters = {
  pathTypes: Set<PathType>;
  industry: "All" | "Technology" | "FinTech" | "HealthTech" | "Ecommerce" | "SaaS";
  salary: "Any" | "$80–120k" | "$120–160k" | "$160k+";
  timeline: "Any" | "< 12 mo" | "12–24 mo" | "24+ mo";
};

const PATH_LABELS: Record<PathType, string> = {
  traditional: "Traditional Path",
  lateral: "Lateral Move",
  pivot: "Industry Pivot"
};

function isNodeInFilters(node: MultiverseNode, filters: Filters) {
  if (!filters.pathTypes.has(node.pathType)) return false;
  if (filters.industry !== "All" && node.industry !== filters.industry) return false;

  // Salary and timeline are placeholders for now. Keep them wired so UI behaves as spec describes.
  if (filters.timeline !== "Any") {
    const t = node.transitionTime.toLowerCase();
    if (filters.timeline === "< 12 mo" && !(t.includes("10") || t.includes("8") || t.includes("6") || t.includes("~12"))) {
      return false;
    }
    if (filters.timeline === "12–24 mo" && !(t.includes("12") || t.includes("18") || t.includes("24"))) {
      return false;
    }
    if (filters.timeline === "24+ mo" && !(t.includes("30") || t.includes("36") || t.includes("24"))) {
      return false;
    }
  }

  return true;
}

function useLocalStorageSet(key: string, initial: string[]) {
  const [setValue, setSetValue] = React.useState<Set<string>>(() => new Set(initial));

  React.useEffect(() => {
    try {
      const raw = window.localStorage.getItem(key);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) setSetValue(new Set(parsed.map(String)));
    } catch {
      // ignore
    }
  }, [key]);

  React.useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify([...setValue]));
    } catch {
      // ignore
    }
  }, [key, setValue]);

  return [setValue, setSetValue] as const;
}

function IconCart({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={cn("h-5 w-5", className)} fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.5 5.5h2l1.2 9.4a2 2 0 0 0 2 1.8h8.9a2 2 0 0 0 2-1.6l1.2-6.6H7.2" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.5 20a.5.5 0 1 0 0-1 .5.5 0 0 0 0 1Zm9 0a.5.5 0 1 0 0-1 .5.5 0 0 0 0 1Z" />
    </svg>
  );
}

function ProgressRing({ value }: { value: number }) {
  const clamped = Math.max(0, Math.min(100, value));
  const radius = 10;
  const c = 2 * Math.PI * radius;
  const offset = c * (1 - clamped / 100);

  return (
    <svg className="h-8 w-8" viewBox="0 0 28 28" aria-hidden="true">
      <circle cx="14" cy="14" r={radius} className="text-zinc-200" stroke="currentColor" strokeWidth="3" fill="none" />
      <circle
        cx="14"
        cy="14"
        r={radius}
        className="text-teal-600"
        stroke="currentColor"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
        strokeDasharray={`${c} ${c}`}
        strokeDashoffset={offset}
        style={{ transition: "stroke-dashoffset 800ms cubic-bezier(0.22, 1, 0.36, 1)" }}
      />
      <text x="14" y="14.5" textAnchor="middle" dominantBaseline="middle" className="fill-zinc-700 text-[9px] font-semibold tabular-nums">
        {clamped}
      </text>
    </svg>
  );
}

function safeParseStringArray(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map(String).filter(Boolean);
  } catch {
    return [];
  }
}

const ROLE_CART_KEY = "cn_role_cart_ids_v1";

// PUBLIC_INTERFACE
export default function MultiverseStepPage() {
  /** Career Multiverse Explorer: structured branching map with filters, role intelligence, and a role cart that proceeds to Roadmap. */

  const router = useRouter();

  // Placeholder persona/current role until wired to backend/persona state.
  const currentRoleTitle = "Tech Lead";
  const currentRoleSubtitle = "Software Engineer";

  // Dataset now uses deterministic stage ordering, not random x/y placement.
  const allNodes: MultiverseNode[] = React.useMemo(
    () => [
      // Traditional (top lane)
      {
        id: "n-em",
        title: "Engineering Manager",
        industry: "Technology",
        compatibility: 64,
        description: "Lead a team, drive execution, align stakeholders, and grow engineers.",
        requiredSkills: ["People leadership", "Delivery management", "Hiring", "Stakeholder alignment"],
        skillGaps: ["Performance management", "Org design"],
        transitionTime: "~24 mo",
        pathType: "traditional",
        stage: 1
      },
      {
        id: "n-dir",
        title: "Director of Engineering",
        industry: "SaaS",
        compatibility: 55,
        description: "Scale teams and systems, manage managers, set engineering strategy.",
        requiredSkills: ["Org scaling", "Strategy", "Budgeting", "Cross-functional leadership"],
        skillGaps: ["Budget ownership", "Managing managers"],
        transitionTime: "~36 mo",
        pathType: "traditional",
        stage: 2
      },
      {
        id: "n-vp",
        title: "VP Engineering",
        industry: "SaaS",
        compatibility: 49,
        description: "Own the engineering org, delivery predictability, and operating cadence across teams.",
        requiredSkills: ["Org leadership", "Executive communication", "Operating rhythm", "Portfolio tradeoffs"],
        skillGaps: ["Executive storytelling", "Org-level metrics"],
        transitionTime: "~42 mo",
        pathType: "traditional",
        stage: 3
      },
      {
        id: "n-cto",
        title: "CTO",
        industry: "SaaS",
        compatibility: 46,
        description: "Own technical vision, architecture, security posture, and engineering culture.",
        requiredSkills: ["Technical strategy", "Executive communication", "Architecture", "Risk management"],
        skillGaps: ["Investor communication", "Security governance"],
        transitionTime: "~48 mo",
        pathType: "traditional",
        stage: 4
      },
      {
        id: "n-founder",
        title: "Technical Co‑Founder",
        industry: "Technology",
        compatibility: 44,
        description: "Build and lead from zero-to-one; iterate quickly with customer feedback and constraints.",
        requiredSkills: ["Product sense", "Fundamentals", "Execution", "Hiring"],
        skillGaps: ["Fundraising", "Sales motion"],
        transitionTime: "~54 mo",
        pathType: "traditional",
        stage: 5
      },

      // Lateral (middle lane)
      {
        id: "n-pm",
        title: "Product Manager",
        industry: "Technology",
        compatibility: 72,
        description: "Define product direction, align teams, and ship measurable user value.",
        requiredSkills: ["Roadmapping", "User research", "Metrics", "Communication"],
        skillGaps: ["Discovery", "Pricing"],
        transitionTime: "~18 mo",
        pathType: "lateral",
        stage: 1
      },
      {
        id: "n-pdir",
        title: "Product Director",
        industry: "Ecommerce",
        compatibility: 58,
        description: "Own multi-team product strategy, portfolio tradeoffs, and outcomes.",
        requiredSkills: ["Portfolio management", "Leadership", "Go-to-market", "Strategy"],
        skillGaps: ["Portfolio tradeoffs", "GTM leadership"],
        transitionTime: "~30 mo",
        pathType: "lateral",
        stage: 2
      },
      {
        id: "n-gm",
        title: "GM (Product + Engineering)",
        industry: "SaaS",
        compatibility: 52,
        description: "Run a business unit; own outcomes across product, engineering, and go-to-market.",
        requiredSkills: ["Business acumen", "Leadership", "Strategy", "Metrics"],
        skillGaps: ["P&L ownership", "Pricing strategy"],
        transitionTime: "~40 mo",
        pathType: "lateral",
        stage: 3
      },
      {
        id: "n-cpo",
        title: "CPO",
        industry: "SaaS",
        compatibility: 47,
        description: "Lead product org, define vision, and ensure delivery of customer value at scale.",
        requiredSkills: ["Vision", "Exec alignment", "Portfolio leadership", "Talent development"],
        skillGaps: ["Board communication", "Portfolio operating model"],
        transitionTime: "~52 mo",
        pathType: "lateral",
        stage: 4
      },

      // Pivot (bottom lane)
      {
        id: "n-hl",
        title: "Tech Lead (HealthTech)",
        industry: "HealthTech",
        compatibility: 78,
        description: "Lead engineering within healthcare constraints, privacy, and compliance.",
        requiredSkills: ["System design", "Compliance awareness", "Stakeholder alignment"],
        skillGaps: ["HIPAA basics", "Clinical workflows"],
        transitionTime: "~12 mo",
        pathType: "pivot",
        stage: 1
      },
      {
        id: "n-hmgr",
        title: "Engineering Manager (HealthTech)",
        industry: "HealthTech",
        compatibility: 67,
        description: "Manage teams delivering in regulated environments; ensure quality and safety.",
        requiredSkills: ["Leadership", "Quality systems", "Compliance", "Delivery management"],
        skillGaps: ["Regulatory processes", "Privacy reviews"],
        transitionTime: "~24 mo",
        pathType: "pivot",
        stage: 2
      },
      {
        id: "n-hcto",
        title: "CTO (HealthTech)",
        industry: "HealthTech",
        compatibility: 61,
        description: "Set technical direction in regulated domain; build secure scalable org.",
        requiredSkills: ["Security", "Strategy", "Architecture", "Hiring"],
        skillGaps: ["Regulatory leadership", "Security program ownership"],
        transitionTime: "~36 mo",
        pathType: "pivot",
        stage: 3
      },
      {
        id: "n-clin",
        title: "VP Engineering (Digital Health)",
        industry: "HealthTech",
        compatibility: 56,
        description: "Scale product delivery with clinical stakeholders and strong governance.",
        requiredSkills: ["Org scaling", "Stakeholder management", "Risk governance", "Delivery cadence"],
        skillGaps: ["Clinical domain depth", "Audit readiness"],
        transitionTime: "~48 mo",
        pathType: "pivot",
        stage: 4
      }
    ],
    []
  );

  const [filters, setFilters] = React.useState<Filters>({
    pathTypes: new Set<PathType>(["traditional", "lateral", "pivot"]),
    industry: "All",
    salary: "Any",
    timeline: "Any"
  });

  const [selectedId, setSelectedId] = React.useState<string | null>(null);

  /**
   * selectedId is the single source of truth.
   * Derive selectedRole from selectedId + allNodes to avoid stale or partially-updated UI.
   */
  const selectedRole = React.useMemo(() => {
    if (!selectedId) return null;
    return allNodes.find((n) => n.id === selectedId) ?? null;
  }, [allNodes, selectedId]);

  const handleSelectNode = React.useCallback((id: string) => {
    /**
     * Clicking a node selects it; clicking the already-selected node clears selection.
     * Role Intelligence panel updates because it is derived from selectedId.
     */
    setSelectedId((prevId) => (prevId === id ? null : id));
  }, []);

  const detailAnimKey = selectedId ?? "empty";

  const getRoleDescription = React.useCallback((node: MultiverseNode) => {
    const n: any = node;

    const candidates = [n.description, n.roleDescription, n.role_description, n.overview, n.summary, n.roleSummary]
      .map((v) => (typeof v === "string" ? v.trim() : ""))
      .filter(Boolean);

    if (candidates.length > 0) return candidates[0];

    return `${node.title} role in ${node.industry}. Typical focus areas include ${node.requiredSkills.slice(0, 3).join(", ")}.`;
  }, []);

  const deriveThreeTwoFit = React.useCallback((node: MultiverseNode) => {
    const mastery = node.requiredSkills.slice(0, 3);
    const growth = node.skillGaps.length > 0 ? node.skillGaps.slice(0, 2) : node.requiredSkills.slice(3, 5);

    const masteryRatio = mastery.length / 3;
    const growthRatio = growth.length / 2;
    const score = Math.round(node.compatibility * (0.75 * masteryRatio + 0.25 * growthRatio));

    return { mastery, growth, score: Math.max(0, Math.min(100, score)) };
  }, []);

  const computeGapEffort = React.useCallback((node: MultiverseNode) => {
    const gapCount = node.skillGaps.length;
    const effort = gapCount >= 4 ? "High" : gapCount >= 2 ? "Medium" : "Low";
    const estimatedTime = node.transitionTime || (effort === "High" ? "18–36 months" : effort === "Medium" ? "12–24 months" : "6–12 months");
    return { effort, estimatedTime };
  }, []);

  const filteredNodes = React.useMemo(() => {
    return allNodes.filter((n) => isNodeInFilters(n, filters));
  }, [allNodes, filters]);

  const paths: MultiversePath[] = React.useMemo(() => {
    const byType: Record<PathType, MultiverseNode[]> = { traditional: [], lateral: [], pivot: [] };
    filteredNodes.forEach((n) => byType[n.pathType].push(n));

    return (["traditional", "lateral", "pivot"] as const)
      .filter((t) => filters.pathTypes.has(t))
      .map((t) => ({
        id: `path-${t}`,
        type: t,
        label: PATH_LABELS[t],
        nodes: byType[t].sort((a, b) => a.stage - b.stage)
      }));
  }, [filteredNodes, filters.pathTypes]);

  const onTogglePathType = (t: PathType) => {
    setFilters((prev) => {
      const next = new Set(prev.pathTypes);
      if (next.has(t)) next.delete(t);
      else next.add(t);

      if (next.size === 0) next.add(t);

      return { ...prev, pathTypes: next };
    });
  };

  const showEmptyState = filteredNodes.length < 3;

  // ---- Role cart ----
  const [roleCartIds, setRoleCartIds] = useLocalStorageSet(ROLE_CART_KEY, []);

  const roleCart = React.useMemo(() => {
    const byId = new Map(allNodes.map((n) => [n.id, n]));
    return [...roleCartIds].map((id) => byId.get(id)).filter(Boolean) as MultiverseNode[];
  }, [allNodes, roleCartIds]);

  const isSelectedInCart = selectedRole ? roleCartIds.has(selectedRole.id) : false;

  const addSelectedToCart = React.useCallback(() => {
    if (!selectedRole) return;
    setRoleCartIds((prev) => {
      const next = new Set(prev);
      next.add(selectedRole.id);
      return next;
    });
  }, [selectedRole, setRoleCartIds]);

  const removeFromCart = React.useCallback(
    (id: string) => {
      setRoleCartIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    },
    [setRoleCartIds]
  );

  const clearCart = React.useCallback(() => {
    setRoleCartIds(new Set());
  }, [setRoleCartIds]);

  const proceedToRoadmap = React.useCallback(() => {
    /**
     * Persisted cart is already in localStorage; route to Roadmap.
     * Roadmap reads cn_role_cart_ids_v1 to initialize its Mind Map / Pathway context.
     */
    router.push("/roadmap");
  }, [router]);

  return (
    <div className="relative">
      {/* Subtle animated background effects for the page */}
      <div className="pointer-events-none absolute inset-x-0 -top-12 -z-10 h-[520px] overflow-hidden" aria-hidden="true">
        <div className="cn-mv-ambient" />
        <div className="cn-mv-grid" />
        <div className="cn-mv-glow cn-mv-glow--a" />
        <div className="cn-mv-glow cn-mv-glow--b" />
      </div>

      <PageHeader
        title="Career Multiverse"
        subtitle="Explore multiple possible career paths based on your skills, experience, and aspirations."
        titleClassName="cn-enter-up"
        subtitleClassName="cn-subtext-enter"
        actions={
          <div className="flex flex-wrap items-center justify-end gap-2">
            {/* Cart indicator */}
            <button
              type="button"
              onClick={() => {
                const el = document.getElementById("cn-role-cart");
                el?.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
              className={cn(
                "relative inline-flex h-10 items-center justify-center gap-2 rounded-lg px-3 text-sm font-semibold",
                "bg-white text-zinc-900 ring-1 ring-inset ring-zinc-200 hover:bg-zinc-50",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/40"
              )}
              aria-label={`Role cart: ${roleCart.length} selected`}
            >
              <IconCart />
              <span className="hidden sm:inline">Role Cart</span>
              <span
                className={cn(
                  "ml-1 inline-flex min-w-[22px] items-center justify-center rounded-full px-2 py-0.5 text-xs font-bold tabular-nums",
                  roleCart.length > 0 ? "bg-teal-600 text-white" : "bg-zinc-100 text-zinc-600 ring-1 ring-inset ring-zinc-200"
                )}
              >
                {roleCart.length}
              </span>
            </button>

            <Link
              href="/roadmap"
              className={cn(
                "inline-flex h-10 items-center justify-center gap-2 rounded-lg px-4 text-sm font-medium",
                "bg-white text-zinc-900 ring-1 ring-inset ring-zinc-200 hover:bg-zinc-50",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/40"
              )}
            >
              Roadmap
            </Link>
          </div>
        }
      />

      {/* Floating teal particles behind the title */}
      <div className="pointer-events-none relative -mt-10 mb-6 h-20" aria-hidden="true">
        <div className="absolute inset-0 overflow-hidden">
          {Array.from({ length: 12 }).map((_, i) => {
            const left = (i * 7 + (i % 3) * 5) % 100;
            const top = (i % 4) * 20 + 10;
            const size = 4 + (i % 4) * 2;
            const duration = 7 + (i % 5) * 1.4;
            const delay = (i % 6) * 0.35;
            return (
              <div
                key={i}
                className="cn-particle cn-particle-drift"
                style={
                  {
                    left: `${left}%`,
                    top: `${top}%`,
                    width: `${size}px`,
                    height: `${size}px`,
                    ["--cn-particle-duration" as any]: `${duration}s`,
                    ["--cn-particle-delay" as any]: `${delay}s`
                  } as React.CSSProperties
                }
              />
            );
          })}
        </div>
      </div>

      {/* Filter panel */}
      <Card className="mb-4" title="Filters" description="Refine the multiverse by path type and constraints.">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            {(["traditional", "lateral", "pivot"] as const).map((t) => {
              const active = filters.pathTypes.has(t);
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => onTogglePathType(t)}
                  className={cn(
                    "group inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold",
                    "ring-1 ring-inset transition-all",
                    active ? "bg-teal-50 text-teal-800 ring-teal-200 shadow-sm" : "bg-white text-zinc-700 ring-zinc-200 hover:ring-teal-200"
                  )}
                >
                  <span className={cn("h-2 w-2 rounded-full", active ? "bg-teal-600" : "bg-zinc-300 group-hover:bg-teal-500")} aria-hidden="true" />
                  {t === "traditional" ? "Traditional" : t === "lateral" ? "Lateral" : "Industry Pivot"}
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 md:max-w-[560px] md:grid-cols-3">
            <label className="text-xs font-semibold text-zinc-600">
              Industry
              <select
                className="mt-1 w-full rounded-xl bg-white px-3 py-2 text-sm text-zinc-900 ring-1 ring-inset ring-zinc-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30"
                value={filters.industry}
                onChange={(e) => setFilters((p) => ({ ...p, industry: e.target.value as Filters["industry"] }))}
              >
                <option>All</option>
                <option>Technology</option>
                <option>FinTech</option>
                <option>HealthTech</option>
                <option>Ecommerce</option>
                <option>SaaS</option>
              </select>
            </label>

            <label className="text-xs font-semibold text-zinc-600">
              Salary range
              <select
                className="mt-1 w-full rounded-xl bg-white px-3 py-2 text-sm text-zinc-900 ring-1 ring-inset ring-zinc-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30"
                value={filters.salary}
                onChange={(e) => setFilters((p) => ({ ...p, salary: e.target.value as Filters["salary"] }))}
              >
                <option>Any</option>
                <option>$80–120k</option>
                <option>$120–160k</option>
                <option>$160k+</option>
              </select>
            </label>

            <label className="text-xs font-semibold text-zinc-600">
              Transition timeline
              <select
                className="mt-1 w-full rounded-xl bg-white px-3 py-2 text-sm text-zinc-900 ring-1 ring-inset ring-zinc-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30"
                value={filters.timeline}
                onChange={(e) => setFilters((p) => ({ ...p, timeline: e.target.value as Filters["timeline"] }))}
              >
                <option>Any</option>
                <option>{"< 12 mo"}</option>
                <option>12–24 mo</option>
                <option>24+ mo</option>
              </select>
            </label>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        {/* Visualization */}
        <section className="lg:col-span-8">
          {showEmptyState ? (
            <EmptyState
              title="Add more details to your persona to unlock additional career paths."
              description="Try expanding your persona with more experience, projects, and domain preferences."
              action={
                <Link
                  href="/journey/build-profile"
                  className={cn(
                    "inline-flex h-10 items-center justify-center gap-2 rounded-lg px-4 text-sm font-medium",
                    "bg-teal-600 text-white hover:bg-teal-700",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/40"
                  )}
                >
                  Update Persona
                </Link>
              }
            />
          ) : (
            <Card className="relative overflow-hidden" title="Multiverse map" description="Structured paths with spacing, expand/collapse, and zoom/pan controls.">
              <MultiverseBranchingMap
                currentRoleTitle={currentRoleTitle}
                currentRoleSubtitle={currentRoleSubtitle}
                paths={paths}
                selectedId={selectedId}
                dimPathType={selectedRole?.pathType ?? null}
                onSelectNode={handleSelectNode}
                initialVisiblePerPath={4}
              />
            </Card>
          )}
        </section>

        {/* Role intelligence panel + Add-to-cart */}
        <aside className="lg:col-span-4">
          <div
            className={cn(
              "sticky top-4",
              "transition-all duration-300",
              selectedRole ? "translate-x-0 opacity-100" : "translate-x-3 opacity-90"
            )}
          >
            <Card
              className={cn("relative overflow-hidden", selectedRole && "cn-mv-panelEnter")}
              title="Role Intelligence"
              description={selectedRole ? "Add roles to your cart, then proceed to Roadmap." : "Click a role in the multiverse map to view detailed career insights."}
            >
              {!selectedRole ? (
                <div className="rounded-xl bg-zinc-50 p-4 text-sm text-zinc-700 ring-1 ring-inset ring-zinc-200">
                  Click a role in the multiverse map to view detailed career insights.
                </div>
              ) : (
                <div key={detailAnimKey} className="space-y-4 cn-mv-panelEnter">
                  {/* Role Overview */}
                  <section className="rounded-xl bg-white p-4 ring-1 ring-inset ring-zinc-200">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="text-sm font-bold text-zinc-900">{selectedRole.title}</h3>
                        <p className="mt-1 text-xs font-semibold text-zinc-600">{selectedRole.industry}</p>
                      </div>

                      <div className="shrink-0 text-right">
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">Compatibility</p>
                        <p className="mt-1 text-lg font-bold tabular-nums text-teal-700">{selectedRole.compatibility}%</p>
                      </div>
                    </div>

                    <dl className="mt-3 grid grid-cols-2 gap-3 text-xs">
                      <div className="rounded-lg bg-zinc-50 p-2 ring-1 ring-inset ring-zinc-200">
                        <dt className="font-semibold text-zinc-600">Estimated transition</dt>
                        <dd className="mt-1 font-medium text-zinc-900 tabular-nums">{selectedRole.transitionTime}</dd>
                      </div>
                      <div className="rounded-lg bg-zinc-50 p-2 ring-1 ring-inset ring-zinc-200">
                        <dt className="font-semibold text-zinc-600">Path lane</dt>
                        <dd className="mt-1 font-medium text-zinc-900">
                          {selectedRole.pathType === "traditional" ? "Traditional" : selectedRole.pathType === "lateral" ? "Lateral" : "Pivot"}
                        </dd>
                      </div>
                    </dl>

                    {/* Add-to-cart row */}
                    <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-2">
                        <IconCart className="text-zinc-500" />
                        <span className="text-xs font-semibold text-zinc-600">
                          In cart: <span className="font-bold text-zinc-900 tabular-nums">{roleCart.length}</span>
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant={isSelectedInCart ? "secondary" : "primary"}
                          onClick={() => {
                            if (!selectedRole) return;
                            if (roleCartIds.has(selectedRole.id)) {
                              removeFromCart(selectedRole.id);
                            } else {
                              addSelectedToCart();
                            }
                          }}
                        >
                          {isSelectedInCart ? "Remove from cart" : "Add to cart"}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setSelectedId(null);
                          }}
                        >
                          Close
                        </Button>
                      </div>
                    </div>
                  </section>

                  {/* Role Description */}
                  <section className="rounded-xl bg-zinc-50 p-4 ring-1 ring-inset ring-zinc-200">
                    <h3 className="text-xs font-bold uppercase tracking-wide text-zinc-600">Role Description</h3>
                    <p className="mt-2 text-sm text-zinc-700">{getRoleDescription(selectedRole)}</p>
                    <p className="mt-2 text-xs text-zinc-600">
                      This summary explains what the role involves and the typical expectations (leadership + technical scope) as you move into it.
                    </p>
                  </section>

                  {/* 3/2 Career Fit Analysis */}
                  {(() => {
                    const fit = deriveThreeTwoFit(selectedRole);
                    return (
                      <section className="rounded-xl bg-white p-4 ring-1 ring-inset ring-zinc-200">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h3 className="text-xs font-bold uppercase tracking-wide text-zinc-600">3/2 Career Fit Analysis</h3>
                            <p className="mt-1 text-xs text-zinc-600">
                              This role matches your profile with: <span className="font-semibold text-zinc-800">3 mastery areas</span> and{" "}
                              <span className="font-semibold text-zinc-800">2 growth opportunities</span>.
                            </p>
                          </div>
                          <div className="shrink-0 rounded-xl bg-zinc-50 px-3 py-2 ring-1 ring-inset ring-zinc-200">
                            <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">Fit Score</p>
                            <p className="mt-1 text-lg font-bold tabular-nums text-teal-700">{fit.score}</p>
                          </div>
                        </div>

                        <div className="mt-3">
                          <p className="text-xs font-semibold text-zinc-700">Mastery Areas</p>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {fit.mastery.map((s) => (
                              <span
                                key={s}
                                className="rounded-full bg-teal-50 px-2 py-1 text-[11px] font-semibold text-teal-800 ring-1 ring-inset ring-teal-200"
                                title="Mastery → strong skill from your experience."
                              >
                                {s}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="mt-3">
                          <p className="text-xs font-semibold text-zinc-700">Growth Areas</p>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {fit.growth.map((s) => (
                              <span
                                key={s}
                                className="rounded-full bg-amber-50 px-2 py-1 text-[11px] font-semibold text-amber-900 ring-1 ring-inset ring-amber-200"
                                title="Growth → skill needed for this role."
                              >
                                {s}
                              </span>
                            ))}
                          </div>
                        </div>
                      </section>
                    );
                  })()}

                  {/* Gap Analysis */}
                  {(() => {
                    const effort = computeGapEffort(selectedRole);
                    return (
                      <section className="rounded-xl bg-white p-4 ring-1 ring-inset ring-zinc-200">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h3 className="text-xs font-bold uppercase tracking-wide text-zinc-600">Gap Analysis</h3>
                            <p className="mt-1 text-xs text-zinc-600">Skills you must develop to transition successfully.</p>
                          </div>
                          <div className="shrink-0 rounded-xl bg-zinc-50 px-3 py-2 ring-1 ring-inset ring-zinc-200">
                            <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">Effort level</p>
                            <p
                              className={cn(
                                "mt-1 text-sm font-bold",
                                effort.effort === "High" ? "text-rose-700" : effort.effort === "Medium" ? "text-amber-700" : "text-emerald-700"
                              )}
                            >
                              {effort.effort}
                            </p>
                          </div>
                        </div>

                        <div className="mt-3 grid gap-2">
                          {selectedRole.skillGaps.length === 0 ? (
                            <div className="rounded-xl bg-zinc-50 p-3 text-sm text-zinc-700 ring-1 ring-inset ring-zinc-200">
                              No major gaps detected (placeholder).
                            </div>
                          ) : (
                            selectedRole.skillGaps.map((g) => (
                              <div key={g} className="rounded-xl bg-zinc-50 p-3 ring-1 ring-inset ring-zinc-200">
                                <div className="flex items-start gap-2">
                                  <span className="mt-1 inline-block h-2 w-2 rounded-full bg-amber-500 shadow-[0_0_18px_rgba(245,158,11,0.35)]" aria-hidden="true" />
                                  <div className="min-w-0">
                                    <p className="text-sm font-semibold text-zinc-900">{g}</p>
                                    <p className="mt-0.5 text-xs text-zinc-600">Effort varies by evidence-building projects, coaching, and scope expansion.</p>
                                  </div>
                                </div>
                              </div>
                            ))
                          )}
                        </div>

                        <div className="mt-3 rounded-lg bg-zinc-50 p-3 ring-1 ring-inset ring-zinc-200">
                          <div className="flex items-center justify-between gap-3 text-xs text-zinc-600">
                            <span className="font-semibold">Estimated learning time</span>
                            <span className="font-semibold text-zinc-900 tabular-nums">{effort.estimatedTime}</span>
                          </div>
                        </div>
                      </section>
                    );
                  })()}
                </div>
              )}
            </Card>

            {/* Role cart panel */}
            <div id="cn-role-cart" className="mt-3">
              <Card
                title={
                  <div className="flex items-center justify-between gap-2">
                    <span>Role Cart</span>
                    <span className={cn("inline-flex items-center gap-2 text-xs font-semibold text-zinc-600")}>
                      <IconCart className="h-4 w-4" />
                      <span className="tabular-nums">{roleCart.length}</span>
                    </span>
                  </div>
                }
                description="Add roles from Role Intelligence, then proceed to your Roadmap."
              >
                {roleCart.length === 0 ? (
                  <div className="rounded-xl bg-zinc-50 p-3 text-sm text-zinc-700 ring-1 ring-inset ring-zinc-200">
                    No roles added yet. Select a role and click “Add to cart”.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {roleCart.map((r) => (
                      <div key={r.id} className="flex items-start justify-between gap-3 rounded-xl bg-white p-3 ring-1 ring-inset ring-zinc-200">
                        <div className="min-w-0">
                          <div className="truncate text-sm font-bold text-zinc-900">{r.title}</div>
                          <div className="mt-1 flex items-center gap-2 text-xs text-zinc-600">
                            <span className="font-semibold">{r.industry}</span>
                            <span className="text-zinc-300">•</span>
                            <span className="inline-flex items-center gap-1">
                              <ProgressRing value={r.compatibility} />
                              <span className="font-semibold tabular-nums">{r.compatibility}%</span>
                            </span>
                          </div>
                        </div>

                        <div className="shrink-0">
                          <Button size="sm" variant="ghost" onClick={() => removeFromCart(r.id)}>
                            Remove
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <Button
                    variant="secondary"
                    onClick={clearCart}
                    disabled={roleCart.length === 0}
                  >
                    Clear cart
                  </Button>

                  <Button
                    className="cn-mv-btnGlow"
                    onClick={proceedToRoadmap}
                    disabled={roleCart.length === 0}
                    rightIcon={<span aria-hidden="true">→</span>}
                  >
                    Proceed to Roadmap
                  </Button>
                </div>

                {roleCart.length === 0 && (
                  <p className="mt-2 text-xs text-zinc-500">
                    Tip: you can add multiple roles and compare them in Roadmap.
                  </p>
                )}
              </Card>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
