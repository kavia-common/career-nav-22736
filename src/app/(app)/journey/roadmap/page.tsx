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
  const tone =
    v >= 75
      ? "bg-teal-50 text-teal-800 ring-teal-200"
      : v >= 55
        ? "bg-amber-50 text-amber-900 ring-amber-200"
        : "bg-zinc-50 text-zinc-700 ring-zinc-200";
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

function milestoneProgress(m: Milestone) {
  if (m.status === "Done") return 100;
  if (m.status === "In progress") return 50;
  return 0;
}

function milestoneClusterIndex(m: Milestone) {
  const p = milestoneProgress(m);
  if (p >= 100) return 0;
  if (p > 0) return 1;
  return 2;
}

function completionSummary(milestones: Milestone[]) {
  const total = milestones.length;
  const done = milestones.filter((m) => m.status === "Done").length;
  const inProgress = milestones.filter((m) => m.status === "In progress").length;
  const percent = total === 0 ? 0 : Math.round((done / total) * 100);
  return { total, done, inProgress, percent };
}

function progressRingTone(percent: number) {
  if (percent >= 75) return { track: "bg-teal-500/15", bar: "bg-teal-400" };
  if (percent >= 40) return { track: "bg-amber-500/15", bar: "bg-amber-400" };
  return { track: "bg-white/10", bar: "bg-white/25" };
}

function PathwayIcon({ kind, className }: { kind: "check" | "star" | "flag"; className?: string }) {
  const cls = cn("h-4 w-4", className);
  if (kind === "check") {
    return (
      <svg viewBox="0 0 24 24" className={cls} aria-hidden="true">
        <path fill="currentColor" d="M9.0 16.2 4.8 12l-1.4 1.4 5.6 5.6L20.6 7.4 19.2 6z" />
      </svg>
    );
  }
  if (kind === "star") {
    return (
      <svg viewBox="0 0 24 24" className={cls} aria-hidden="true">
        <path
          fill="currentColor"
          d="M12 17.3 5.8 20.9l1.7-7.1L2 9.2l7.3-.6L12 2l2.7 6.6 7.3.6-5.5 4.6 1.7 7.1z"
        />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" className={cls} aria-hidden="true">
      <path fill="currentColor" d="M6 3h12v2h-2v4.2l1.6 1.6-1.4 1.4L15 11V5H9v16H7V3Z" />
    </svg>
  );
}

function PathwayTimelineCard(props: {
  planTitle: string;
  milestones: Milestone[];
  onToggleDone: (milestoneId: string, done: boolean) => void;
  onUpdate: (milestoneId: string, patch: Partial<Milestone>) => void;
  onDelete: (milestoneId: string) => void;
  onAdd: () => void;
}) {
  const { planTitle, milestones, onToggleDone, onUpdate, onDelete, onAdd } = props;

  const sorted = React.useMemo(() => [...milestones].sort((a, b) => a.date.localeCompare(b.date)), [milestones]);

  const grouped = React.useMemo(() => {
    const columns: Milestone[][] = [[], [], []];
    sorted.forEach((m) => {
      columns[milestoneClusterIndex(m)].push(m);
    });

    const flattened = [...columns[0], ...columns[1], ...columns[2]];
    const fixed: Milestone[][] = [[], [], []];
    flattened.forEach((m) => {
      const idx = fixed.reduce((best, col, i) => (col.length < fixed[best].length ? i : best), 0);
      fixed[idx].push(m);
    });

    const linear = [...sorted];
    return [linear.slice(0, 2), linear.slice(2, 4), linear.slice(4)];
  }, [sorted]);

  const summary = React.useMemo(() => completionSummary(sorted), [sorted]);
  const tone = progressRingTone(summary.percent);

  const stage1Done = summary.done > 0;
  const stage2Current = !stage1Done && summary.inProgress > 0;

  const stageStates: Array<{
    title: string;
    subtitle: string;
    icon: "check" | "star" | "flag";
    tone: "complete" | "current" | "upcoming";
  }> = [
    {
      title: "Role-Specific Milestones",
      subtitle: "Foundation Building",
      icon: "check",
      tone: stage1Done ? "complete" : "upcoming"
    },
    {
      title: "Advanced Concepts",
      subtitle: "Skill Deepening",
      icon: "star",
      tone: stage2Current ? "current" : summary.done > 0 ? "current" : "upcoming"
    },
    {
      title: "Project Milestones",
      subtitle: "Portfolio Creation",
      icon: "flag",
      tone: summary.done === summary.total && summary.total > 0 ? "complete" : "upcoming"
    }
  ];

  const nodeTone = (t: (typeof stageStates)[number]["tone"]) => {
    if (t === "complete") return "text-emerald-300";
    if (t === "current") return "text-amber-300";
    return "text-rose-300";
  };

  const dotTone = (idx: number) => {
    if (idx % 3 === 0) return "bg-sky-400";
    if (idx % 3 === 1) return "bg-violet-400";
    return "bg-orange-400";
  };

  return (
    <section
      className={cn(
        "rounded-2xl border p-4 shadow-[0_18px_50px_rgba(0,0,0,0.22)]",
        "border-white/10 bg-gradient-to-b from-[#0b1b2b] to-[#07131f]"
      )}
      aria-label="Pathway timeline"
    >
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="text-sm font-semibold text-white/80">Pathway</div>
          <div className="mt-1 truncate text-base font-bold text-white">Milestones for {planTitle}</div>
          <div className="mt-1 text-xs font-medium text-white/55">Check items complete to update progress. Edit titles/descriptions inline.</div>
        </div>

        <div className="flex items-center gap-3 self-start rounded-xl border border-white/10 bg-white/5 px-3 py-2">
          <div className="min-w-0">
            <div className="text-[11px] font-semibold text-white/55">Progress</div>
            <div className="mt-0.5 text-sm font-bold text-white tabular-nums">
              {summary.percent}% <span className="text-xs font-semibold text-white/55">({summary.done}/{summary.total})</span>
            </div>
          </div>
          <div className={cn("h-8 w-20 rounded-full p-1", tone.track)} aria-hidden="true">
            <div className={cn("h-full rounded-full", tone.bar)} style={{ width: `${summary.percent}%` }} />
          </div>
        </div>
      </div>

      <div className="relative grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
        <div
          aria-hidden="true"
          className="hidden sm:block"
          style={{
            position: "absolute",
            left: 24,
            right: 24,
            top: 15,
            height: 2,
            background: "rgba(156, 179, 201, 0.18)"
          }}
        />

        {stageStates.map((s) => (
          <div key={s.title} className="relative flex flex-col items-center text-center">
            <div
              className={cn("z-[1] grid h-8 w-8 place-items-center rounded-full border", "border-white/10 bg-[#0b2237]", nodeTone(s.tone))}
              aria-label={s.tone === "complete" ? "Completed stage" : s.tone === "current" ? "Current stage" : "Upcoming stage"}
            >
              <PathwayIcon kind={s.icon} />
            </div>
            <div className="mt-2 text-[13px] font-bold text-white/90">{s.title}</div>
            <div className="mt-0.5 text-[11px] font-semibold text-white/55">{s.subtitle}</div>
          </div>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-3">
        {grouped.flatMap((col, colIdx) =>
          col.map((m, rowIdx) => {
            const idx = colIdx * 2 + rowIdx;
            const done = m.status === "Done";
            const overdue = m.status !== "Done" && m.date < todayISO();

            return (
              <article
                key={m.id}
                className={cn(
                  "rounded-xl border p-3",
                  "border-white/10 bg-[#0b2237]",
                  overdue ? "shadow-[0_0_0_1px_rgba(244,63,94,0.20)]" : "shadow-[0_0_0_1px_rgba(255,255,255,0.02)]"
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={cn("h-2.5 w-2.5 rounded-full", dotTone(idx))} aria-hidden="true" />
                      <input
                        className={cn("w-full bg-transparent text-[13px] font-semibold text-white/90", "outline-none placeholder:text-white/35")}
                        value={m.title}
                        onChange={(e) => onUpdate(m.id, { title: e.target.value })}
                        aria-label="Milestone title"
                      />
                    </div>

                    <textarea
                      className={cn(
                        "mt-2 w-full resize-none bg-transparent text-[11px] font-medium leading-relaxed text-white/55",
                        "outline-none placeholder:text-white/30"
                      )}
                      value={m.description}
                      onChange={(e) => onUpdate(m.id, { description: e.target.value })}
                      rows={2}
                      placeholder="Describe what done looks like"
                      aria-label="Milestone description"
                    />
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <label className="flex items-center gap-2 text-[11px] font-semibold text-white/60">
                      <input
                        type="checkbox"
                        checked={done}
                        onChange={(e) => onToggleDone(m.id, e.target.checked)}
                        className="h-4 w-4 rounded border-white/20 bg-white/5 text-teal-400"
                        aria-label="Mark milestone done"
                      />
                      Done
                    </label>

                    <button type="button" onClick={() => onDelete(m.id)} className="text-[11px] font-semibold text-white/45 hover:text-white/70">
                      Delete
                    </button>
                  </div>
                </div>

                <div className="mt-2 flex items-center justify-between gap-2">
                  <div className="text-[11px] font-semibold text-white/45">Due</div>
                  <input
                    type="date"
                    className={cn(
                      "rounded-lg border px-2 py-1 text-[11px] font-semibold",
                      "border-white/10 bg-white/5 text-white/80",
                      overdue ? "ring-1 ring-inset ring-rose-500/30" : "ring-0"
                    )}
                    value={m.date}
                    onChange={(e) => onUpdate(m.id, { date: e.target.value })}
                    aria-label="Milestone due date"
                  />
                </div>

                <div className="mt-2 flex items-center justify-between gap-2">
                  <div className="text-[11px] font-semibold text-white/45">Status</div>
                  <select
                    className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-[11px] font-semibold text-white/80"
                    value={m.status}
                    onChange={(e) => onUpdate(m.id, { status: e.target.value as MilestoneStatus })}
                    aria-label="Milestone status"
                  >
                    <option>Not started</option>
                    <option>In progress</option>
                    <option>Done</option>
                  </select>
                </div>
              </article>
            );
          })
        )}

        {Array.from({ length: Math.max(0, 6 - sorted.length) }).map((_, i) => (
          <div key={`ph_${i}`} className="rounded-xl border border-dashed border-white/10 bg-white/[0.03] p-3 text-[11px] font-semibold text-white/40">
            Add a milestone to fill this slot.
          </div>
        ))}
      </div>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <Button size="sm" variant="secondary" onClick={onAdd}>
          Add milestone
        </Button>

        <button
          type="button"
          onClick={() => alert("Switch Pathway (placeholder).")}
          className={cn(
            "inline-flex h-9 items-center justify-center rounded-xl px-4 text-xs font-bold",
            "bg-[rgba(31,208,199,1)] text-[#06202A]",
            "shadow-[0_12px_28px_rgba(31,208,199,0.18)]",
            "transition hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/25"
          )}
        >
          Switch Pathway
        </button>
      </div>
    </section>
  );
}

function seedRolePlan(roleId: string): RolePlan {
  const fallbackTitle =
    roleId === "n-em" ? "Engineering Manager" : roleId === "n-pm" ? "Product Manager" : roleId === "n-cto" ? "CTO" : "Target Role";

  const industry = roleId.includes("h") ? "HealthTech" : roleId.includes("pm") ? "Technology" : "SaaS";
  const compatibility = roleId === "n-hl" ? 78 : roleId === "n-pm" ? 72 : roleId === "n-em" ? 64 : 58;

  const deltas: SkillDelta[] = [
    { id: uid("d"), skill: "Leadership", current: 3, target: 4 },
    { id: uid("d"), skill: "Strategy", current: 2, target: 4 },
    { id: uid("d"), skill: "Stakeholder alignment", current: 3, target: 5 },
    { id: uid("d"), skill: "Metrics & experimentation", current: 2, target: 4 }
  ];

  const base = todayISO();
  const milestones: Milestone[] = [
    { id: uid("m"), title: "Milestone 1", date: base, description: "Define a measurable outcome and scope your next project.", status: "Not started" },
    { id: uid("m"), title: "Milestone 2", date: base, description: "Ship a small artifact that proves the target skill in practice.", status: "Not started" },
    { id: uid("m"), title: "Milestone 3", date: base, description: "Expand scope: lead cross-functional delivery with stakeholders.", status: "Not started" }
  ];

  return { roleId, title: fallbackTitle, industry, compatibility, deltas, milestones };
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

/* ---------------------------
   Mind Map (NEW): 3-layer radial
   Layer 1: YOU (center)
   Layer 2: 7 categories (ring)
   Layer 3: sub nodes (expand on category click)
   --------------------------- */

type SkillStatus = "Strong" | "Gap" | "In progress";

type MindMapSubNode = {
  id: string;
  label: string;
  status: SkillStatus;
  action: string;
};

type MindMapCategory = {
  id: string;
  label: string;
  colorRgb: string; // e.g. "59 130 246"
  subColorRgb: string; // lighter shade
  subs: MindMapSubNode[];
};

type MindMapNodeKind = "you" | "category" | "sub";

type MindMapNode = {
  id: string;
  kind: MindMapNodeKind;
  label: string;
  accentRgb: string;
  x: number;
  y: number;
  sizePx: number; // diameter
  ringWidthPx: number;
  categoryId?: string;
  tooltip?: {
    title: string;
    status?: SkillStatus;
    action?: string;
  };
};

type MindMapEdge = {
  id: string;
  from: string;
  to: string;
  accentRgb: string;
  weight: "primary" | "secondary";
};

function usePrefersReducedMotion() {
  const [reduced, setReduced] = React.useState(false);
  React.useEffect(() => {
    const mq = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    if (!mq) return;
    const update = () => setReduced(Boolean(mq.matches));
    update();
    mq.addEventListener?.("change", update);
    return () => mq.removeEventListener?.("change", update);
  }, []);
  return reduced;
}

function polarPoint(cx: number, cy: number, radius: number, angleDeg: number) {
  const a = (angleDeg * Math.PI) / 180;
  return { x: cx + radius * Math.cos(a), y: cy + radius * Math.sin(a) };
}

function mixToWhite(rgb: string, t: number) {
  // rgb string "r g b" -> "r g b" mixed toward white by t (0..1)
  const [r, g, b] = rgb.split(" ").map((v) => parseInt(v, 10));
  const rr = Math.round(r + (255 - r) * t);
  const gg = Math.round(g + (255 - g) * t);
  const bb = Math.round(b + (255 - b) * t);
  return `${rr} ${gg} ${bb}`;
}

function buildCategories(): MindMapCategory[] {
  // Authoritative categories + example sub nodes from requirements.
  // Tooltip fields match: Skill name / Status / Suggested action.
  const cats: Array<{ id: string; label: string; colorRgb: string; subs: Array<[string, SkillStatus, string]> }> = [
    {
      id: "core-skills",
      label: "Core Skills",
      colorRgb: "59 130 246", // Blue
      subs: [
        ["Product Strategy", "In progress", "Draft a 1-page strategy + north star metric for a product you know."],
        ["User Research", "Gap", "Run 5 user interviews and synthesize themes into insights."],
        ["Data Analysis", "Strong", "Create a simple KPI dashboard and explain tradeoffs/decisions."]
      ]
    },
    {
      id: "proof-projects",
      label: "Proof Projects",
      colorRgb: "20 184 166", // Teal
      subs: [
        ["Case Study", "In progress", "Write a case study: problem → approach → outcome (with numbers)."],
        ["Portfolio Artifact", "Gap", "Ship a tangible artifact (deck, spec, demo) aligned to target role."]
      ]
    },
    {
      id: "market-fit",
      label: "Market Fit",
      colorRgb: "34 197 94", // Green
      subs: [
        ["Target Companies", "In progress", "Make a shortlist of 15 and map role requirements."],
        ["Industry Knowledge", "Gap", "Pick a niche; write 10 insights and 3 contrarian takes."]
      ]
    },
    {
      id: "interview",
      label: "Interview Readiness",
      colorRgb: "168 85 247", // Purple
      subs: [
        ["Mock Interviews", "In progress", "Run weekly mocks; record and score yourself."],
        ["Role Prompts", "Gap", "Build a prompt bank and practice under timebox."]
      ]
    },
    {
      id: "brand",
      label: "Personal Brand",
      colorRgb: "239 68 68", // Red
      subs: [
        ["LinkedIn", "In progress", "Align headline + featured section to target role signals."],
        ["Story", "Gap", "Write your story: who you help, how, proof, and what you want next."]
      ]
    },
    {
      id: "gaps",
      label: "Experience Gaps",
      colorRgb: "249 115 22", // Orange
      subs: [
        ["Scope & Ownership", "Gap", "Lead one end-to-end slice with clear outcomes and ownership."],
        ["Decision Making", "In progress", "Log decisions + tradeoffs; review outcomes weekly."]
      ]
    },
    {
      id: "network",
      label: "Network",
      colorRgb: "234 179 8", // Yellow
      subs: [
        ["Mentors", "Gap", "Identify 2 mentors; set monthly feedback checkpoints."],
        ["Peers", "In progress", "Join a peer group; share progress biweekly."]
      ]
    }
  ];

  return cats.map((c) => ({
    id: c.id,
    label: c.label,
    colorRgb: c.colorRgb,
    subColorRgb: mixToWhite(c.colorRgb, 0.22),
    subs: c.subs.map(([label, status, action], idx) => ({
      id: `${c.id}_sub_${idx}`,
      label,
      status,
      action
    }))
  }));
}

function categoryIcon(label: string) {
  // Minimal white glyphs to keep futuristic look.
  const common = "h-4 w-4";
  switch (label) {
    case "Core Skills":
      return (
        <svg viewBox="0 0 24 24" className={common} aria-hidden="true">
          <path fill="currentColor" d="M3 12l9-9 9 9-9 9-9-9Zm9-5.6L6.4 12 12 17.6 17.6 12 12 6.4Z" />
        </svg>
      );
    case "Proof Projects":
      return (
        <svg viewBox="0 0 24 24" className={common} aria-hidden="true">
          <path fill="currentColor" d="M4 5h16v4H4V5Zm0 6h10v8H4v-8Zm12 0h4v8h-4v-8Z" />
        </svg>
      );
    case "Market Fit":
      return (
        <svg viewBox="0 0 24 24" className={common} aria-hidden="true">
          <path fill="currentColor" d="M3 7h18l-2 14H5L3 7Zm5-4h8l1 3H7l1-3Zm2 8h4v2h-4v-2Z" />
        </svg>
      );
    case "Interview Readiness":
      return (
        <svg viewBox="0 0 24 24" className={common} aria-hidden="true">
          <path fill="currentColor" d="M4 4h16v10H7l-3 3V4Zm4 3h8v2H8V7Zm0 4h6v2H8v-2Z" />
        </svg>
      );
    case "Personal Brand":
      return (
        <svg viewBox="0 0 24 24" className={common} aria-hidden="true">
          <path fill="currentColor" d="M12 2 3 6v6c0 5 3.8 9.6 9 10 5.2-.4 9-5 9-10V6l-9-4Z" />
        </svg>
      );
    case "Experience Gaps":
      return (
        <svg viewBox="0 0 24 24" className={common} aria-hidden="true">
          <path
            fill="currentColor"
            d="M10 3h4a2 2 0 0 1 2 2v1h3a2 2 0 0 1 2 2v10a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V8a2 2 0 0 1 2-2h3V5a2 2 0 0 1 2-2Zm4 3V5h-4v1h4Z"
          />
        </svg>
      );
    case "Network":
      return (
        <svg viewBox="0 0 24 24" className={common} aria-hidden="true">
          <path
            fill="currentColor"
            d="M7 12a3 3 0 1 1 2.7-4.3l4 2a3 3 0 0 1 4.3 2.7 3 3 0 0 1-4.3 2.7l-4-2A3 3 0 0 1 7 12Z"
          />
        </svg>
      );
    default:
      return null;
  }
}

function curvedPath(x1: number, y1: number, x2: number, y2: number, curvature: number) {
  // Quadratic curve with control point offset perpendicular to the segment.
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;

  const dx = x2 - x1;
  const dy = y2 - y1;
  const dist = Math.max(1, Math.sqrt(dx * dx + dy * dy));

  // unit perpendicular
  const px = -dy / dist;
  const py = dx / dist;

  const cpx = mx + px * curvature;
  const cpy = my + py * curvature;

  return `M ${x1} ${y1} Q ${cpx} ${cpy} ${x2} ${y2}`;
}

function getMindMapModel(args: {
  width: number;
  height: number;
  expandedCategoryIds: Set<string>;
  categories: MindMapCategory[];
  // authoritatively requested radii:
  categoryRadiusPx: number; // ~220
  subRadiusPx: number; // ~340
}) {
  const { width, height, expandedCategoryIds, categories, categoryRadiusPx, subRadiusPx } = args;

  const cx = width / 2;
  const cy = height / 2;

  // Keep composition slightly above center (UI bars).
  const center = { x: cx, y: cy - 10 };

  const youNode: MindMapNode = {
    id: "you",
    kind: "you",
    label: "YOU",
    accentRgb: "56 189 248", // a neutral neon cyan ring
    x: center.x,
    y: center.y,
    sizePx: 90,
    ringWidthPx: 3,
    tooltip: {
      title: "YOU",
      status: "In progress",
      action: "Use the categories to organize your roadmap. Click a category to expand."
    }
  };

  const nodes: MindMapNode[] = [youNode];
  const edges: MindMapEdge[] = [];

  // Evenly distribute 7 categories around a ring.
  const count = categories.length;
  const startAngle = -90; // top
  const step = 360 / count;

  categories.forEach((cat, idx) => {
    const angle = startAngle + idx * step;
    const pos = polarPoint(center.x, center.y, categoryRadiusPx, angle);

    const catNode: MindMapNode = {
      id: cat.id,
      kind: "category",
      label: cat.label,
      accentRgb: cat.colorRgb,
      x: pos.x,
      y: pos.y,
      sizePx: 60,
      ringWidthPx: 2,
      categoryId: cat.id,
      tooltip: {
        title: cat.label,
        status: "In progress",
        action: expandedCategoryIds.has(cat.id) ? "Click to collapse sub-nodes." : "Click to expand sub-nodes."
      }
    };

    nodes.push(catNode);
    edges.push({
      id: `e_you_${cat.id}`,
      from: youNode.id,
      to: cat.id,
      accentRgb: cat.colorRgb,
      weight: "primary"
    });

    if (!expandedCategoryIds.has(cat.id)) return;

    // Sub nodes: arranged in a compact arc outside the category, oriented away from center.
    const subs = cat.subs;
    const outwardAngle = angle; // direction from center to category
    const arcSpread = subs.length <= 2 ? 28 : subs.length === 3 ? 44 : 60;
    const subStep = subs.length <= 1 ? 0 : arcSpread / (subs.length - 1);
    const arcStart = outwardAngle - arcSpread / 2;

    subs.forEach((s, sIdx) => {
      const a = arcStart + sIdx * subStep;
      const subPos = polarPoint(center.x, center.y, subRadiusPx, a);

      const subNode: MindMapNode = {
        id: s.id,
        kind: "sub",
        label: s.label,
        accentRgb: cat.subColorRgb,
        x: subPos.x,
        y: subPos.y,
        sizePx: 36,
        ringWidthPx: 2,
        categoryId: cat.id,
        tooltip: {
          title: s.label,
          status: s.status,
          action: s.action
        }
      };

      nodes.push(subNode);
      edges.push({
        id: `e_${cat.id}_${s.id}`,
        from: cat.id,
        to: s.id,
        accentRgb: cat.subColorRgb,
        weight: "secondary"
      });
    });
  });

  return { nodes, edges, center };
}

function MindMapTooltip(props: { x: number; y: number; title: string; status?: SkillStatus; action?: string }) {
  const { x, y, title, status, action } = props;

  const statusTone =
    status === "Strong"
      ? "text-emerald-200"
      : status === "Gap"
        ? "text-rose-200"
        : status === "In progress"
          ? "text-amber-200"
          : "text-white/80";

  return (
    <div
      className="pointer-events-none absolute z-[30] max-w-[290px] rounded-2xl border border-white/10 bg-[#071225]/90 px-3.5 py-3 text-white shadow-[0_18px_50px_rgba(0,0,0,0.45)] backdrop-blur"
      style={{ left: x + 14, top: y + 14 }}
      role="tooltip"
    >
      <div className="text-xs font-bold text-white">{title}</div>
      {status && (
        <div className="mt-1 text-[11px] font-semibold text-white/65">
          Status: <span className={cn("font-bold", statusTone)}>{status}</span>
        </div>
      )}
      {action && <div className="mt-2 text-[11px] font-medium leading-relaxed text-white/70">{action}</div>}
    </div>
  );
}

function MindMapNodeView(props: {
  node: MindMapNode;
  icon?: React.ReactNode;
  isHovered: boolean;
  isActive: boolean;
  onHover: (id: string | null) => void;
  onClick: (id: string) => void;
}) {
  const { node, icon, isHovered, isActive, onHover, onClick } = props;

  const glowA = isActive ? 0.48 : isHovered ? 0.38 : 0.22;
  const glowB = isActive ? 0.5 : isHovered ? 0.42 : 0.28;

  const style = {
    left: node.x,
    top: node.y,
    width: node.sizePx,
    height: node.sizePx,
    transform: "translate(-50%, -50%)",
    ["--mm-accent" as any]: node.accentRgb,
    ["--mm-glow-a" as any]: glowA,
    ["--mm-glow-b" as any]: glowB
  } as React.CSSProperties;

  const isSub = node.kind === "sub";
  const hasLabelInside = node.kind === "you";

  return (
    <div style={style} className="absolute z-[2]">
      <button
        type="button"
        className={cn(
          "group relative grid place-items-center rounded-full",
          "outline-none focus-visible:ring-2 focus-visible:ring-white/25",
          "transition-transform duration-200",
          isActive ? "scale-[1.03]" : isHovered ? "scale-[1.02]" : "scale-100"
        )}
        style={{
          width: node.sizePx,
          height: node.sizePx,
          background: "radial-gradient(circle at 30% 30%, rgba(24, 50, 80, 0.82), rgba(6, 12, 24, 0.96))",
          border: `${node.ringWidthPx}px solid rgba(${node.accentRgb} / 0.92)`,
          boxShadow: `0 0 18px rgba(${node.accentRgb} / var(--mm-glow-a)), 0 0 2px rgba(${node.accentRgb} / var(--mm-glow-b))`
        }}
        onMouseEnter={() => onHover(node.id)}
        onMouseLeave={() => onHover(null)}
        onFocus={() => onHover(node.id)}
        onBlur={() => onHover(null)}
        onClick={() => onClick(node.id)}
        aria-label={node.label}
      >
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-full opacity-70"
          style={{
            background: "radial-gradient(circle at 30% 30%, rgba(255,255,255,0.10), transparent 55%)"
          }}
        />

        {!isSub && (
          <span className={cn("relative z-[1] grid place-items-center", node.kind === "you" ? "text-white" : "text-white/90")}>
            {icon}
          </span>
        )}

        {hasLabelInside && <span className="relative z-[1] mt-1 text-[10px] font-semibold tracking-wide text-white/90">{node.label}</span>}
        {isSub && <span className="sr-only">{node.label}</span>}
      </button>

      {/* External labels */}
      {node.kind === "category" && (
        <div
          className="pointer-events-none mt-2 w-[160px] -translate-x-1/2 text-center text-[12px] font-semibold text-white/92"
          style={{ position: "absolute", left: "50%" }}
        >
          {node.label}
        </div>
      )}

      {node.kind === "sub" && (
        <div
          className="pointer-events-none text-left text-[11px] font-medium text-white/75"
          style={{
            position: "absolute",
            left: node.sizePx / 2 + 8,
            top: node.sizePx / 2 - 7,
            maxWidth: 200,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis"
          }}
          title={node.label}
        >
          {node.label}
        </div>
      )}
    </div>
  );
}

function MindMapCanvas3Layer() {
  const reducedMotion = usePrefersReducedMotion();
  const ref = React.useRef<HTMLDivElement | null>(null);

  const [size, setSize] = React.useState({ w: 1000, h: 640 });

  const categories = React.useMemo(() => buildCategories(), []);
  const [expanded, setExpanded] = React.useState<Set<string>>(() => new Set());

  const [hoveredId, setHoveredId] = React.useState<string | null>(null);
  const [cursor, setCursor] = React.useState<{ x: number; y: number } | null>(null);

  React.useEffect(() => {
    if (!ref.current) return;
    const el = ref.current;

    const update = () => {
      const r = el.getBoundingClientRect();
      // Give room for the outer ring.
      setSize({
        w: Math.max(640, Math.floor(r.width)),
        h: Math.max(620, Math.floor(r.height))
      });
    };

    update();
    const ro = new ResizeObserver(() => update());
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const { nodes, edges, center } = React.useMemo(() => {
    // Authoritative spacing: category ~220px, sub ~340px
    // Scale a bit on small screens to avoid clipping while keeping "spacious".
    const scale = size.w < 860 ? 0.85 : size.w < 1080 ? 0.92 : 1;
    const categoryRadiusPx = Math.round(220 * scale);
    const subRadiusPx = Math.round(340 * scale);

    return getMindMapModel({
      width: size.w,
      height: size.h,
      expandedCategoryIds: expanded,
      categories,
      categoryRadiusPx,
      subRadiusPx
    });
  }, [size.w, size.h, expanded, categories]);

  const hoveredNode = hoveredId ? nodes.find((n) => n.id === hoveredId) ?? null : null;

  const onMouseMove: React.MouseEventHandler<HTMLDivElement> = (e) => {
    if (!ref.current) return;
    const r = ref.current.getBoundingClientRect();
    setCursor({ x: e.clientX - r.left, y: e.clientY - r.top });
  };

  const onMouseLeave: React.MouseEventHandler<HTMLDivElement> = () => {
    setCursor(null);
    setHoveredId(null);
  };

  const highlightSet = React.useMemo(() => {
    if (!hoveredId) return new Set<string>();
    const s = new Set<string>();
    edges.forEach((e) => {
      if (e.from === hoveredId || e.to === hoveredId) {
        s.add(e.id);
        s.add(e.from);
        s.add(e.to);
      }
    });

    const hovered = nodes.find((n) => n.id === hoveredId);
    if (hovered?.kind === "category") {
      nodes.forEach((n) => {
        if (n.categoryId === hovered.id) s.add(n.id);
      });
    } else if (hovered?.kind === "sub" && hovered.categoryId) {
      s.add(hovered.categoryId);
      nodes.forEach((n) => {
        if (n.categoryId === hovered.categoryId) s.add(n.id);
      });
    }

    return s;
  }, [hoveredId, edges, nodes]);

  const toggleExpand = (id: string) => {
    const cat = categories.find((c) => c.id === id);
    if (!cat) return;

    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const iconForNode = (n: MindMapNode) => {
    if (n.kind === "you") {
      return (
        <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
          <path
            fill="currentColor"
            d="M12 12a4.2 4.2 0 1 0-4.2-4.2A4.21 4.21 0 0 0 12 12Zm0 2c-4.1 0-7.6 2.1-7.6 4.7A1.3 1.3 0 0 0 5.7 20h12.6a1.3 1.3 0 0 0 1.3-1.3C19.6 16.1 16.1 14 12 14Z"
          />
        </svg>
      );
    }
    if (n.kind === "category") {
      return categoryIcon(n.label);
    }
    return null;
  };

  return (
    <div
      ref={ref}
      className={cn("relative overflow-hidden rounded-2xl ring-1 ring-inset ring-white/10 min-h-[680px]")}
      style={{
        background: "radial-gradient(circle at 45% 40%, rgba(15, 35, 70, 0.68), rgba(7, 11, 20, 1) 68%)"
      }}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
    >
      {/* Subtle futuristic vignette */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background: "radial-gradient(circle at 50% 50%, transparent 35%, rgba(0,0,0,0.46) 100%)",
          opacity: 0.7
        }}
      />

      {/* Floating particles (subtle) */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        {Array.from({ length: 18 }).map((_, i) => {
          const left = (i * 37) % 100;
          const top = (i * 23) % 100;
          const sizePx = 3 + (i % 4);
          const dur = 7 + (i % 6);
          const delay = (i % 8) * -0.7;
          return (
            <span
              key={i}
              className="absolute rounded-full"
              style={{
                left: `${left}%`,
                top: `${top}%`,
                width: sizePx,
                height: sizePx,
                background: "rgba(56, 189, 248, 0.20)",
                boxShadow: "0 0 16px rgba(56, 189, 248, 0.12)",
                animation: reducedMotion ? undefined : `cn-mm-float ${dur}s ease-in-out ${delay}s infinite`
              }}
            />
          );
        })}
      </div>

      {/* Curved connectors */}
      <svg className="absolute inset-0 z-[1]" width={size.w} height={size.h} aria-hidden="true">
        <defs>
          <filter id="mm-curve-glow" x="-60%" y="-60%" width="220%" height="220%">
            <feDropShadow dx="0" dy="0" stdDeviation="1.3" floodColor="rgba(56,189,248,0.12)" />
          </filter>
        </defs>

        {edges.map((e) => {
          const from = nodes.find((n) => n.id === e.from);
          const to = nodes.find((n) => n.id === e.to);
          if (!from || !to) return null;

          const x1 = from.x;
          const y1 = from.y;
          const x2 = to.x;
          const y2 = to.y;

          // Clip to node edge rather than center.
          const dx = x2 - x1;
          const dy = y2 - y1;
          const dist = Math.max(1, Math.sqrt(dx * dx + dy * dy));
          const ux = dx / dist;
          const uy = dy / dist;
          const fromPad = from.sizePx / 2 + 3;
          const toPad = to.sizePx / 2 + 3;

          const sx = x1 + ux * fromPad;
          const sy = y1 + uy * fromPad;
          const tx = x2 - ux * toPad;
          const ty = y2 - uy * toPad;

          const isHi = hoveredId ? highlightSet.has(e.id) : false;
          const opacity = isHi ? 0.95 : 0.7;

          // curvature: more for primary ring links, less for sub links
          const curvature = e.weight === "primary" ? 26 : 16;
          const d = curvedPath(sx, sy, tx, ty, curvature);

          const stroke = isHi ? `rgba(${e.accentRgb} / 0.58)` : `rgba(148, 163, 184, ${e.weight === "primary" ? 0.42 : 0.32})`;
          const strokeWidth = isHi ? (e.weight === "primary" ? 1.7 : 1.4) : e.weight === "primary" ? 1.2 : 1.0;

          return (
            <path
              key={e.id}
              d={d}
              fill="none"
              stroke={stroke}
              strokeWidth={strokeWidth}
              opacity={opacity}
              filter="url(#mm-curve-glow)"
              strokeLinecap="round"
            />
          );
        })}
      </svg>

      {/* Nodes */}
      <div className="absolute inset-0 z-[2]">
        {nodes.map((n) => {
          const isHovered = hoveredId === n.id || (hoveredId ? highlightSet.has(n.id) : false);
          const isActive = false; // in this design we don't pin a panel; expansion is category click.

          return (
            <MindMapNodeView
              key={n.id}
              node={n}
              icon={iconForNode(n) ?? undefined}
              isHovered={isHovered}
              isActive={isActive}
              onHover={(id) => setHoveredId(id)}
              onClick={(id) => {
                // Click behaviors:
                // - category: expand/collapse
                // - YOU/sub: no-op (still allows tooltip on hover)
                const clicked = nodes.find((x) => x.id === id);
                if (clicked?.kind === "category") toggleExpand(id);
              }}
            />
          );
        })}
      </div>

      {/* Tooltip: on hover */}
      {hoveredNode && cursor && hoveredNode.tooltip && (
        <MindMapTooltip x={cursor.x} y={cursor.y} title={hoveredNode.tooltip.title} status={hoveredNode.tooltip.status} action={hoveredNode.tooltip.action} />
      )}

      {/* Top helper bar */}
      <div className="absolute left-4 top-4 z-[15] flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white/80 backdrop-blur">
          <span className="h-2 w-2 rounded-full bg-[rgba(56,189,248,0.9)] shadow-[0_0_16px_rgba(56,189,248,0.25)]" aria-hidden="true" />
          Mind Map
        </span>

        <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white/70 backdrop-blur">
          Click a category to expand
        </span>

        <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white/60 backdrop-blur">
          Expanded: <span className="font-bold text-white/85 tabular-nums">{expanded.size}</span>
        </span>
      </div>

      {/* Center guide ring (faint) to reinforce spacing */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute rounded-full border border-white/5"
        style={{
          left: center.x,
          top: center.y,
          width: 480,
          height: 480,
          transform: "translate(-50%, -50%)",
          opacity: 0.6,
          maskImage: "radial-gradient(circle at 50% 50%, black 55%, transparent 78%)"
        }}
      />
    </div>
  );
}

// PUBLIC_INTERFACE
export default function RoadmapJourneyPage() {
  /**
   * Roadmap: planning hub for selected roles.
   * Tabs:
   * - Mind Map: redesigned 3-layer expandable radial mind map (YOU → 7 categories → expandable sub-nodes).
   * - Pathway: timeline milestones (editable list with status).
   */
  const router = useRouter();

  const [tab, setTab] = React.useState<RoadmapTab>("mindMap");
  const [cartRoleIds, setCartRoleIds] = React.useState<string[]>([]);
  const [plans, setPlans] = React.useState<RolePlan[]>([]);
  const [activeRoleId, setActiveRoleId] = React.useState<string | null>(null);

  React.useEffect(() => {
    const ids = safeParseStringArray(window.localStorage.getItem(ROLE_CART_KEY));
    setCartRoleIds(ids);

    const restored = loadRoadmapState();
    const restoredPlansById = new Map<string, RolePlan>((restored.plans ?? []).map((p: RolePlan) => [p.roleId, p]));

    const nextPlans = ids.map((id) => restoredPlansById.get(id) ?? seedRolePlan(id));
    setPlans(nextPlans);

    const nextActive = restored.activeRoleId && ids.includes(restored.activeRoleId) ? restored.activeRoleId : ids[0] ?? null;
    setActiveRoleId(nextActive);
  }, []);

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
    const m: Milestone = { id: uid("m"), title: "New milestone", date: todayISO(), description: "", status: "Not started" };
    setPlans((prev) => prev.map((p) => (p.roleId === activePlan.roleId ? { ...p, milestones: [...p.milestones, m] } : p)));
  }, [activePlan]);

  const updateMilestone = React.useCallback(
    (milestoneId: string, patch: Partial<Milestone>) => {
      if (!activePlan) return;
      setPlans((prev) =>
        prev.map((p) => {
          if (p.roleId !== activePlan.roleId) return p;
          return { ...p, milestones: p.milestones.map((m) => (m.id === milestoneId ? { ...m, ...patch } : m)) };
        })
      );
    },
    [activePlan]
  );

  const deleteMilestone = React.useCallback(
    (milestoneId: string) => {
      if (!activePlan) return;
      setPlans((prev) =>
        prev.map((p) => {
          if (p.roleId !== activePlan.roleId) return p;
          return { ...p, milestones: p.milestones.filter((m) => m.id !== milestoneId) };
        })
      );
    },
    [activePlan]
  );

  return (
    <div className="relative">
      <PageHeader
        title="Roadmap"
        subtitle="Turn selected roles into a plan: mind map + pathway milestones."
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
            Mind Map
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
          <aside className="lg:col-span-4">
            <div className="sticky top-4 space-y-3">
              <Card title="Selected roles" description="Pick a role to view its pathway. Mind Map is role-agnostic (YOU-centric).">
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

          <main className="lg:col-span-8">
            {!activePlan ? (
              <Card title="Select a role" description="Choose a role from the left to begin." />
            ) : tab === "mindMap" ? (
              <Card
                title="Mind Map — YOU → Categories → Expandable Sub-nodes"
                description="Spacious 3-layer radial mind map. Default shows YOU + categories. Click a category to expand its sub-nodes. Hover for glow + tooltips."
              >
                <MindMapCanvas3Layer />
              </Card>
            ) : (
              <Card title={`Pathway — ${activePlan.title}`} description="A milestone pathway laid out in three stages. Completion is tracked via checkbox/status.">
                <PathwayTimelineCard
                  planTitle={activePlan.title}
                  milestones={activePlan.milestones}
                  onAdd={addMilestone}
                  onUpdate={updateMilestone}
                  onDelete={deleteMilestone}
                  onToggleDone={(milestoneId, done) => {
                    updateMilestone(milestoneId, { status: done ? "Done" : "Not started" });
                  }}
                />

                <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-end">
                  <Button variant="secondary" onClick={() => setTab("mindMap")}>
                    Back to Mind Map
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

      <p className="mt-4 text-xs text-zinc-500">Note: Roadmap data is stored locally in your browser (MVP). Backend persistence can be wired later.</p>

      {/* Local keyframes (scoped) */}
      <style jsx>{`
        @keyframes cn-mm-float {
          0% {
            transform: translate3d(-6px, 10px, 0);
            opacity: 0.16;
          }
          50% {
            transform: translate3d(6px, -10px, 0);
            opacity: 0.38;
          }
          100% {
            transform: translate3d(-6px, 10px, 0);
            opacity: 0.16;
          }
        }
      `}</style>
    </div>
  );
}
