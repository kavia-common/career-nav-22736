"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/cn";

type RoadmapTab = "mindMap" | "pathway";

type SkillDelta = {
  id: string;
  skill: string;
  current: number; // 0..5
  target: number; // 0..5
};

type MilestoneStatus = "Not started" | "In progress" | "Done";

type Milestone = {
  id: string;
  title: string;
  date: string; // yyyy-mm-dd
  description: string;
  status: MilestoneStatus;
};

type RolePlan = {
  roleId: string;
  title: string;
  industry: string;
  compatibility: number; // 0..100
  deltas: SkillDelta[];
  milestones: Milestone[];
};

const ROLE_CART_KEY = "cn_role_cart_ids_v1";
const ROADMAP_STATE_KEY = "cn_roadmap_state_v1";

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

function uid(prefix: string) {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
}

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function ProgressPill({ value }: { value: number }) {
  const v = clamp(value, 0, 100);
  const tone = v >= 75 ? "bg-teal-50 text-teal-800 ring-teal-200" : v >= 55 ? "bg-amber-50 text-amber-900 ring-amber-200" : "bg-zinc-50 text-zinc-700 ring-zinc-200";
  return (
    <span className={cn("inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset", tone)}>
      <span className={cn("h-1.5 w-1.5 rounded-full", v >= 75 ? "bg-teal-600" : v >= 55 ? "bg-amber-500" : "bg-zinc-400")} aria-hidden="true" />
      <span className="tabular-nums">{v}%</span>
    </span>
  );
}

function StatusChip({ value }: { value: MilestoneStatus }) {
  const cls =
    value === "Done"
      ? "bg-teal-50 text-teal-800 ring-teal-200"
      : value === "In progress"
        ? "bg-amber-50 text-amber-900 ring-amber-200"
        : "bg-white text-zinc-700 ring-zinc-200";

  return <span className={cn("rounded-full px-2 py-1 text-xs font-semibold ring-1 ring-inset", cls)}>{value}</span>;
}

function seedRolePlan(roleId: string): RolePlan {
  // Placeholder role metadata; in a real implementation, fetch role detail by id from backend.
  const fallbackTitle =
    roleId === "n-em"
      ? "Engineering Manager"
      : roleId === "n-pm"
        ? "Product Manager"
        : roleId === "n-cto"
          ? "CTO"
          : "Target Role";

  const industry =
    roleId.includes("h")
      ? "HealthTech"
      : roleId.includes("pm")
        ? "Technology"
        : "SaaS";

  const compatibility =
    roleId === "n-hl"
      ? 78
      : roleId === "n-pm"
        ? 72
        : roleId === "n-em"
          ? 64
          : 58;

  // Delta analysis scaffold
  const deltas: SkillDelta[] = [
    { id: uid("d"), skill: "Leadership", current: 3, target: 4 },
    { id: uid("d"), skill: "Strategy", current: 2, target: 4 },
    { id: uid("d"), skill: "Stakeholder alignment", current: 3, target: 5 },
    { id: uid("d"), skill: "Metrics & experimentation", current: 2, target: 4 }
  ];

  // Pathway scaffold
  const base = todayISO();
  const milestones: Milestone[] = [
    { id: uid("m"), title: "Milestone 1", date: base, description: "Define a measurable outcome and scope your next project.", status: "Not started" },
    { id: uid("m"), title: "Milestone 2", date: base, description: "Ship a small artifact that proves the target skill in practice.", status: "Not started" },
    { id: uid("m"), title: "Milestone 3", date: base, description: "Expand scope: lead cross-functional delivery with stakeholders.", status: "Not started" }
  ];

  return {
    roleId,
    title: fallbackTitle,
    industry,
    compatibility,
    deltas,
    milestones
  };
}

function loadRoadmapState(): { activeRoleId: string | null; plans: RolePlan[] } {
  try {
    const raw = window.localStorage.getItem(ROADMAP_STATE_KEY);
    if (!raw) return { activeRoleId: null, plans: [] };
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return { activeRoleId: null, plans: [] };
    const plans = Array.isArray((parsed as any).plans) ? (parsed as any).plans : [];
    const activeRoleId = typeof (parsed as any).activeRoleId === "string" ? (parsed as any).activeRoleId : null;
    return { activeRoleId, plans };
  } catch {
    return { activeRoleId: null, plans: [] };
  }
}

function persistRoadmapState(state: { activeRoleId: string | null; plans: RolePlan[] }) {
  try {
    window.localStorage.setItem(ROADMAP_STATE_KEY, JSON.stringify(state));
  } catch {
    // ignore
  }
}

// PUBLIC_INTERFACE
export default function RoadmapJourneyPage() {
  /**
   * Roadmap: planning hub for selected roles.
   * Tabs:
   * - Mind Map: Delta analysis (skill gaps as current vs target)
   * - Pathway: timeline milestones (editable list with status)
   */
  const router = useRouter();

  const [tab, setTab] = React.useState<RoadmapTab>("mindMap");
  const [cartRoleIds, setCartRoleIds] = React.useState<string[]>([]);
  const [plans, setPlans] = React.useState<RolePlan[]>([]);
  const [activeRoleId, setActiveRoleId] = React.useState<string | null>(null);

  // Load cart + restore any previous roadmap edits.
  React.useEffect(() => {
    const ids = safeParseStringArray(window.localStorage.getItem(ROLE_CART_KEY));
    setCartRoleIds(ids);

    const restored = loadRoadmapState();
    const restoredPlansById = new Map<string, RolePlan>((restored.plans ?? []).map((p: RolePlan) => [p.roleId, p]));

    // For any cart roles, ensure a plan exists (restored or seeded).
    const nextPlans = ids.map((id) => restoredPlansById.get(id) ?? seedRolePlan(id));

    setPlans(nextPlans);

    // Choose active role: restored if still in cart, else first in cart.
    const nextActive = restored.activeRoleId && ids.includes(restored.activeRoleId) ? restored.activeRoleId : ids[0] ?? null;
    setActiveRoleId(nextActive);
  }, []);

  // Persist state for continuity.
  React.useEffect(() => {
    if (plans.length === 0) return;
    persistRoadmapState({ activeRoleId, plans });
  }, [activeRoleId, plans]);

  const activePlan = React.useMemo(() => {
    if (!activeRoleId) return null;
    return plans.find((p) => p.roleId === activeRoleId) ?? null;
  }, [plans, activeRoleId]);

  const addMilestone = React.useCallback(() => {
    if (!activePlan) return;
    const m: Milestone = {
      id: uid("m"),
      title: "New milestone",
      date: todayISO(),
      description: "",
      status: "Not started"
    };
    setPlans((prev) => prev.map((p) => (p.roleId === activePlan.roleId ? { ...p, milestones: [...p.milestones, m] } : p)));
  }, [activePlan]);

  const updateMilestone = React.useCallback((milestoneId: string, patch: Partial<Milestone>) => {
    if (!activePlan) return;
    setPlans((prev) =>
      prev.map((p) => {
        if (p.roleId !== activePlan.roleId) return p;
        return { ...p, milestones: p.milestones.map((m) => (m.id === milestoneId ? { ...m, ...patch } : m)) };
      })
    );
  }, [activePlan]);

  const deleteMilestone = React.useCallback((milestoneId: string) => {
    if (!activePlan) return;
    setPlans((prev) =>
      prev.map((p) => {
        if (p.roleId !== activePlan.roleId) return p;
        return { ...p, milestones: p.milestones.filter((m) => m.id !== milestoneId) };
      })
    );
  }, [activePlan]);

  const updateDelta = React.useCallback((deltaId: string, patch: Partial<SkillDelta>) => {
    if (!activePlan) return;
    setPlans((prev) =>
      prev.map((p) => {
        if (p.roleId !== activePlan.roleId) return p;
        return { ...p, deltas: p.deltas.map((d) => (d.id === deltaId ? { ...d, ...patch } : d)) };
      })
    );
  }, [activePlan]);

  const addDelta = React.useCallback(() => {
    if (!activePlan) return;
    const d: SkillDelta = { id: uid("d"), skill: "New skill", current: 2, target: 4 };
    setPlans((prev) => prev.map((p) => (p.roleId === activePlan.roleId ? { ...p, deltas: [...p.deltas, d] } : p)));
  }, [activePlan]);

  const removeDelta = React.useCallback((deltaId: string) => {
    if (!activePlan) return;
    setPlans((prev) => prev.map((p) => (p.roleId === activePlan.roleId ? { ...p, deltas: p.deltas.filter((d) => d.id !== deltaId) } : p)));
  }, [activePlan]);

  return (
    <div className="relative">
      <PageHeader
        title="Roadmap"
        subtitle="Turn selected roles into a plan: delta analysis + pathway milestones."
        actions={
          <div className="flex flex-wrap items-center justify-end gap-2">
            <Button variant="secondary" onClick={() => router.push("/multiverse")}>
              Back to Multiverse
            </Button>
            <Link
              href="/marketplace"
              className={cn(
                "inline-flex h-10 items-center justify-center gap-2 rounded-lg px-4 text-sm font-medium",
                "bg-white text-zinc-900 ring-1 ring-inset ring-zinc-200 hover:bg-zinc-50",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/40"
              )}
            >
              Marketplace
            </Link>
          </div>
        }
      />

      {/* Tabs */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setTab("mindMap")}
            className={cn(
              "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold ring-1 ring-inset transition-all",
              tab === "mindMap" ? "bg-teal-50 text-teal-800 ring-teal-200 shadow-sm" : "bg-white text-zinc-700 ring-zinc-200 hover:ring-teal-200"
            )}
          >
            <span aria-hidden="true">🧠</span>
            Mind Map (Delta)
          </button>

          <button
            type="button"
            onClick={() => setTab("pathway")}
            className={cn(
              "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold ring-1 ring-inset transition-all",
              tab === "pathway" ? "bg-teal-50 text-teal-800 ring-teal-200 shadow-sm" : "bg-white text-zinc-700 ring-zinc-200 hover:ring-teal-200"
            )}
          >
            <span aria-hidden="true">🧭</span>
            Pathway
          </button>
        </div>

        <div className="text-xs font-semibold text-zinc-600">
          Roles selected: <span className="font-bold text-zinc-900 tabular-nums">{cartRoleIds.length}</span>
        </div>
      </div>

      {cartRoleIds.length === 0 ? (
        <Card title="No roles in your cart" description="Return to Multiverse to add roles, then come back to build your roadmap.">
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => router.push("/multiverse")} rightIcon={<span aria-hidden="true">→</span>}>
              Go to Multiverse
            </Button>
            <Button variant="secondary" onClick={() => router.push("/journey")}>
              Back to Journey
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
          {/* Left: role selector */}
          <aside className="lg:col-span-4">
            <div className="sticky top-4 space-y-3">
              <Card title="Selected roles" description="Pick a role to view its delta analysis and pathway.">
                <div className="space-y-2">
                  {plans.map((p) => {
                    const active = p.roleId === activeRoleId;
                    return (
                      <button
                        key={p.roleId}
                        type="button"
                        onClick={() => setActiveRoleId(p.roleId)}
                        className={cn(
                          "w-full rounded-xl p-3 text-left ring-1 ring-inset transition-all",
                          active ? "bg-teal-50 ring-teal-200 shadow-sm" : "bg-white ring-zinc-200 hover:ring-teal-200"
                        )}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="truncate text-sm font-bold text-zinc-900">{p.title}</div>
                            <div className="mt-1 text-xs font-semibold text-zinc-600">{p.industry}</div>
                          </div>
                          <ProgressPill value={p.compatibility} />
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      // Lightweight "export" placeholder: copy JSON to clipboard.
                      const payload = { activeRoleId, plans };
                      navigator.clipboard?.writeText(JSON.stringify(payload, null, 2));
                      alert("Roadmap JSON copied to clipboard (placeholder export).");
                    }}
                  >
                    Export
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => alert("Saved (auto-saved locally).")}>
                    Save
                  </Button>
                </div>
              </Card>

              <Card title="Next steps" description="Continue the journey.">
                <div className="flex flex-col gap-2">
                  <Link
                    href="/marketplace"
                    className={cn(
                      "inline-flex h-10 items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold",
                      "bg-teal-600 text-white hover:bg-teal-700",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/40"
                    )}
                  >
                    Proceed to Marketplace
                  </Link>
                  <Link
                    href="/journey"
                    className={cn(
                      "inline-flex h-10 items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold",
                      "bg-white text-zinc-900 ring-1 ring-inset ring-zinc-200 hover:bg-zinc-50",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/40"
                    )}
                  >
                    Back to Journey
                  </Link>
                </div>
              </Card>
            </div>
          </aside>

          {/* Right: tab content */}
          <main className="lg:col-span-8">
            {!activePlan ? (
              <Card title="Select a role" description="Choose a role from the left to begin." />
            ) : tab === "mindMap" ? (
              <Card
                title={`Mind Map — Delta analysis for ${activePlan.title}`}
                description="Adjust current vs target levels to represent your delta (gap) for each skill."
              >
                <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                  <div className="text-sm font-semibold text-zinc-700">
                    Role: <span className="font-bold text-zinc-900">{activePlan.title}</span>
                    <span className="mx-2 text-zinc-300">•</span>
                    <span className="text-xs font-semibold text-zinc-600">Compatibility</span>{" "}
                    <span className="font-bold text-zinc-900 tabular-nums">{activePlan.compatibility}%</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="secondary" onClick={addDelta}>
                      Add skill
                    </Button>
                  </div>
                </div>

                <div className="space-y-3">
                  {activePlan.deltas.map((d) => {
                    const gap = Math.max(0, d.target - d.current);
                    const gapTone = gap >= 3 ? "text-rose-700" : gap === 2 ? "text-amber-700" : "text-teal-700";
                    return (
                      <div key={d.id} className="rounded-2xl bg-white p-4 ring-1 ring-inset ring-zinc-200">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div className="min-w-0">
                            <input
                              className="w-full rounded-lg bg-zinc-50 px-3 py-2 text-sm font-bold text-zinc-900 ring-1 ring-inset ring-zinc-200 focus:outline-none focus:ring-2 focus:ring-teal-500/30"
                              value={d.skill}
                              onChange={(e) => updateDelta(d.id, { skill: e.target.value })}
                              aria-label="Skill name"
                            />
                            <p className="mt-2 text-xs text-zinc-600">
                              Gap: <span className={cn("font-bold tabular-nums", gapTone)}>{gap}</span>{" "}
                              <span className="text-zinc-500">(target − current)</span>
                            </p>
                          </div>

                          <div className="shrink-0">
                            <Button size="sm" variant="ghost" onClick={() => removeDelta(d.id)}>
                              Remove
                            </Button>
                          </div>
                        </div>

                        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                          <label className="text-xs font-semibold text-zinc-600">
                            Current
                            <input
                              type="range"
                              min={0}
                              max={5}
                              value={d.current}
                              onChange={(e) => updateDelta(d.id, { current: clamp(Number(e.target.value), 0, 5) })}
                              className="mt-2 w-full"
                            />
                            <div className="mt-1 text-xs font-bold tabular-nums text-zinc-900">{d.current} / 5</div>
                          </label>

                          <label className="text-xs font-semibold text-zinc-600">
                            Target
                            <input
                              type="range"
                              min={0}
                              max={5}
                              value={d.target}
                              onChange={(e) => updateDelta(d.id, { target: clamp(Number(e.target.value), 0, 5) })}
                              className="mt-2 w-full"
                            />
                            <div className="mt-1 text-xs font-bold tabular-nums text-zinc-900">{d.target} / 5</div>
                          </label>
                        </div>

                        <div className="mt-3 rounded-xl bg-zinc-50 p-3 ring-1 ring-inset ring-zinc-200">
                          <p className="text-xs text-zinc-700">
                            Suggested action:{" "}
                            <span className="font-semibold text-zinc-900">
                              {gap >= 3 ? "Create a dedicated project to build proof." : gap === 2 ? "Schedule weekly practice + feedback loop." : "Maintain with light repetition."}
                            </span>
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-end">
                  <Button variant="secondary" onClick={() => setTab("pathway")} rightIcon={<span aria-hidden="true">→</span>}>
                    Go to Pathway
                  </Button>
                </div>
              </Card>
            ) : (
              <Card
                title={`Pathway — Milestones for ${activePlan.title}`}
                description="Create and track milestones over time. This is a lightweight editable timeline for your selected role."
              >
                <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                  <div className="text-sm font-semibold text-zinc-700">
                    Role: <span className="font-bold text-zinc-900">{activePlan.title}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="secondary" onClick={addMilestone}>
                      Add milestone
                    </Button>
                  </div>
                </div>

                <div className="space-y-3">
                  {[...activePlan.milestones]
                    .sort((a, b) => a.date.localeCompare(b.date))
                    .map((m, idx) => {
                      const overdue = m.status !== "Done" && m.date < todayISO();
                      return (
                        <div key={m.id} className="relative rounded-2xl bg-white p-4 ring-1 ring-inset ring-zinc-200">
                          {/* timeline line + dot */}
                          <div className="absolute left-5 top-6 h-[calc(100%-24px)] w-px bg-zinc-200" aria-hidden="true" />
                          <div
                            className={cn(
                              "absolute left-[17px] top-7 h-3 w-3 rounded-full",
                              m.status === "Done"
                                ? "bg-teal-600 shadow-[0_0_18px_rgba(20,184,166,0.22)]"
                                : overdue
                                  ? "bg-rose-500 shadow-[0_0_18px_rgba(244,63,94,0.22)]"
                                  : "bg-amber-500 shadow-[0_0_18px_rgba(245,158,11,0.22)]"
                            )}
                            aria-hidden="true"
                          />

                          <div className="pl-8">
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                              <div className="min-w-0 flex-1">
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
                                  placeholder="Describe what “done” looks like"
                                />
                              </div>

                              <div className="shrink-0 sm:w-[220px]">
                                <div className="flex items-center justify-between gap-2">
                                  <div className="text-xs font-semibold text-zinc-600">Date</div>
                                  <input
                                    type="date"
                                    className={cn(
                                      "rounded-xl px-3 py-2 text-sm font-semibold ring-1 ring-inset focus:outline-none focus:ring-2 focus:ring-teal-500/30",
                                      overdue ? "bg-rose-50 text-rose-800 ring-rose-200" : "bg-white text-zinc-900 ring-zinc-200"
                                    )}
                                    value={m.date}
                                    onChange={(e) => updateMilestone(m.id, { date: e.target.value })}
                                  />
                                </div>

                                <div className="mt-2 flex items-center justify-between gap-2">
                                  <div className="text-xs font-semibold text-zinc-600">Status</div>
                                  <StatusChip value={m.status} />
                                </div>

                                <div className="mt-2">
                                  <select
                                    className="w-full rounded-xl bg-white px-3 py-2 text-sm text-zinc-900 ring-1 ring-inset ring-zinc-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30"
                                    value={m.status}
                                    onChange={(e) => updateMilestone(m.id, { status: e.target.value as MilestoneStatus })}
                                    aria-label="Milestone status"
                                  >
                                    <option>Not started</option>
                                    <option>In progress</option>
                                    <option>Done</option>
                                  </select>
                                </div>

                                <div className="mt-2 flex justify-end">
                                  <Button size="sm" variant="ghost" onClick={() => deleteMilestone(m.id)}>
                                    Delete
                                  </Button>
                                </div>
                              </div>
                            </div>

                            {overdue && (
                              <div className="mt-3 rounded-xl bg-rose-50 p-3 text-xs font-semibold text-rose-800 ring-1 ring-inset ring-rose-200">
                                This milestone is overdue. Update the date or break it into smaller steps.
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>

                <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-end">
                  <Button variant="secondary" onClick={() => setTab("mindMap")}>
                    Back to Delta
                  </Button>
                  <Link
                    href="/marketplace"
                    className={cn(
                      "inline-flex h-10 items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold",
                      "bg-teal-600 text-white hover:bg-teal-700",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/40"
                    )}
                  >
                    Find opportunities in Marketplace
                  </Link>
                </div>
              </Card>
            )}
          </main>
        </div>
      )}

      <p className="mt-4 text-xs text-zinc-500">
        Note: Roadmap data is stored locally in your browser (MVP). Backend persistence can be wired later.
      </p>
    </div>
  );
}
