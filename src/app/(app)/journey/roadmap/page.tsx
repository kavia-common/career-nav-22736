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
  // Snapshot-friendly progress mapping used by Pathway timeline UI.
  if (m.status === "Done") return 100;
  if (m.status === "In progress") return 50;
  return 0;
}

function milestoneClusterIndex(m: Milestone) {
  // 0..2 (Foundation / Deepening / Portfolio)
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

  // Group into 3 columns to match the screenshot intent (2 cards per column).
  const grouped = React.useMemo(() => {
    const columns: Milestone[][] = [[], [], []];
    sorted.forEach((m) => {
      columns[milestoneClusterIndex(m)].push(m);
    });

    // Keep screenshot-like balance: try to keep at most 2 per column by spilling.
    const flattened = [...columns[0], ...columns[1], ...columns[2]];
    const fixed: Milestone[][] = [[], [], []];
    flattened.forEach((m) => {
      const idx = fixed.reduce((best, col, i) => (col.length < fixed[best].length ? i : best), 0);
      fixed[idx].push(m);
    });

    // Now re-assign by progress cluster priority, but cap to 2 cards per column visually.
    // (We keep it simple: first 2 -> col1, next 2 -> col2, rest -> col3.)
    const linear = [...sorted];
    return [linear.slice(0, 2), linear.slice(2, 4), linear.slice(4)];
  }, [sorted]);

  const summary = React.useMemo(() => completionSummary(sorted), [sorted]);
  const tone = progressRingTone(summary.percent);

  // Header stage status: completed if there exists done milestones; current if any in progress; upcoming otherwise.
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
    // Decorative dot colors used inside mini-cards (blue/purple/orange-like), matching the notes.
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
      {/* Top row: header + progress pill (progress indicator placement) */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="text-sm font-semibold text-white/80">Pathway</div>
          <div className="mt-1 truncate text-base font-bold text-white">Milestones for {planTitle}</div>
          <div className="mt-1 text-xs font-medium text-white/55">
            Check items complete to update progress. Edit titles/descriptions inline.
          </div>
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

      {/* Timeline header row (3 columns) */}
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
              className={cn(
                "z-[1] grid h-8 w-8 place-items-center rounded-full border",
                "border-white/10 bg-[#0b2237]",
                nodeTone(s.tone)
              )}
              aria-label={s.tone === "complete" ? "Completed stage" : s.tone === "current" ? "Current stage" : "Upcoming stage"}
            >
              <PathwayIcon kind={s.icon} />
            </div>
            <div className="mt-2 text-[13px] font-bold text-white/90">{s.title}</div>
            <div className="mt-0.5 text-[11px] font-semibold text-white/55">{s.subtitle}</div>
          </div>
        ))}
      </div>

      {/* Milestone detail cards grid (3 columns) */}
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
                        className={cn(
                          "w-full bg-transparent text-[13px] font-semibold text-white/90",
                          "outline-none placeholder:text-white/35"
                        )}
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

                    <button
                      type="button"
                      onClick={() => onDelete(m.id)}
                      className="text-[11px] font-semibold text-white/45 hover:text-white/70"
                    >
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

                {/* Keep status in sync with checkbox and allow manual override if desired */}
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

        {/* If there are fewer than 6 milestones, show subtle empty placeholders to preserve the screenshot-like grid rhythm */}
        {Array.from({ length: Math.max(0, 6 - sorted.length) }).map((_, i) => (
          <div
            key={`ph_${i}`}
            className="rounded-xl border border-dashed border-white/10 bg-white/[0.03] p-3 text-[11px] font-semibold text-white/40"
          >
            Add a milestone to fill this slot.
          </div>
        ))}
      </div>

      {/* Bottom actions (CTA position matches screenshot) */}
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
  // Placeholder role metadata; in a real implementation, fetch role detail by id from backend.
  const fallbackTitle =
    roleId === "n-em"
      ? "Engineering Manager"
      : roleId === "n-pm"
        ? "Product Manager"
        : roleId === "n-cto"
          ? "CTO"
          : "Target Role";

  const industry = roleId.includes("h") ? "HealthTech" : roleId.includes("pm") ? "Technology" : "SaaS";

  const compatibility = roleId === "n-hl" ? 78 : roleId === "n-pm" ? 72 : roleId === "n-em" ? 64 : 58;

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

type MindMapNodeKind = "center" | "role" | "primary" | "child";

type MindMapNode = {
  id: string;
  kind: MindMapNodeKind;
  label: string;
  accent: string; // rgb string e.g. "56 189 248"
  ringWidthPx: number;
  radiusPx: number; // visual size
  x: number;
  y: number;
  icon?: React.ReactNode;
  meta?: {
    title?: string;
    description?: string;
    stats?: Record<string, string>;
  };
};

type MindMapEdge = {
  id: string;
  from: string;
  to: string;
  accent: string; // rgb string
  weight: "primary" | "secondary";
};

const MM_ACCENTS = [
  { name: "cyan", rgb: "56 189 248" }, // #38BDF8
  { name: "green", rgb: "34 197 94" }, // #22C55E
  { name: "emerald", rgb: "52 211 153" }, // #34D399
  { name: "yellow", rgb: "251 191 36" }, // #FBBF24
  { name: "orange", rgb: "251 146 60" }, // #FB923C
  { name: "red", rgb: "248 113 113" }, // #F87171
  { name: "purple", rgb: "167 139 250" }, // #A78BFA
  { name: "blue", rgb: "96 165 250" } // #60A5FA
];

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

function normalizeRoleTitle(title: string) {
  return title.trim().replace(/\s+/g, " ");
}

function roleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
      <path
        fill="currentColor"
        d="M12 12a4.2 4.2 0 1 0-4.2-4.2A4.21 4.21 0 0 0 12 12Zm0 2c-4.1 0-7.6 2.1-7.6 4.7A1.3 1.3 0 0 0 5.7 20h12.6a1.3 1.3 0 0 0 1.3-1.3C19.6 16.1 16.1 14 12 14Z"
      />
    </svg>
  );
}

function categoryIcon(kind: "skills" | "experience" | "projects" | "network" | "proof" | "brand" | "interview" | "market") {
  // simple single-color icons (white-ish) to mirror the reference ring+icon style
  const common = "h-4 w-4";
  switch (kind) {
    case "skills":
      return (
        <svg viewBox="0 0 24 24" className={common} aria-hidden="true">
          <path fill="currentColor" d="M3 12l9-9 9 9-9 9-9-9Zm9-5.6L6.4 12 12 17.6 17.6 12 12 6.4Z" />
        </svg>
      );
    case "experience":
      return (
        <svg viewBox="0 0 24 24" className={common} aria-hidden="true">
          <path
            fill="currentColor"
            d="M10 3h4a2 2 0 0 1 2 2v1h3a2 2 0 0 1 2 2v10a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V8a2 2 0 0 1 2-2h3V5a2 2 0 0 1 2-2Zm4 3V5h-4v1h4Zm6 4H4v9a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-9Z"
          />
        </svg>
      );
    case "projects":
      return (
        <svg viewBox="0 0 24 24" className={common} aria-hidden="true">
          <path fill="currentColor" d="M4 5h16v4H4V5Zm0 6h10v8H4v-8Zm12 0h4v8h-4v-8Z" />
        </svg>
      );
    case "network":
      return (
        <svg viewBox="0 0 24 24" className={common} aria-hidden="true">
          <path
            fill="currentColor"
            d="M7 12a3 3 0 1 1 2.7-4.3l4 2a3 3 0 0 1 4.3 2.7 3 3 0 0 1-4.3 2.7l-4-2A3 3 0 0 1 7 12Z"
          />
        </svg>
      );
    case "proof":
      return (
        <svg viewBox="0 0 24 24" className={common} aria-hidden="true">
          <path
            fill="currentColor"
            d="M9 2h6l2 3h4v17H3V5h4l2-3Zm3 5a5 5 0 1 0 5 5 5 5 0 0 0-5-5Zm-1 5.5 3-2v4l-3-2Z"
          />
        </svg>
      );
    case "brand":
      return (
        <svg viewBox="0 0 24 24" className={common} aria-hidden="true">
          <path fill="currentColor" d="M12 2 3 6v6c0 5 3.8 9.6 9 10 5.2-.4 9-5 9-10V6l-9-4Z" />
        </svg>
      );
    case "interview":
      return (
        <svg viewBox="0 0 24 24" className={common} aria-hidden="true">
          <path fill="currentColor" d="M4 4h16v10H7l-3 3V4Zm4 3h8v2H8V7Zm0 4h6v2H8v-2Z" />
        </svg>
      );
    case "market":
      return (
        <svg viewBox="0 0 24 24" className={common} aria-hidden="true">
          <path
            fill="currentColor"
            d="M3 7h18l-2 14H5L3 7Zm5-4h8l1 3H7l1-3Zm2 8h4v2h-4v-2Z"
          />
        </svg>
      );
    default:
      return null;
  }
}

function getMindMapModel(args: {
  roleTitle: string;
  roleIndustry: string;
  compatibility: number;
  deltas: SkillDelta[];
  width: number;
  height: number;
}) {
  const { roleTitle, roleIndustry, compatibility, deltas, width, height } = args;

  const cx = width / 2;
  const cy = height / 2;

  // Keep central composition slightly above center like the reference (controls bar above).
  const center = { x: cx, y: cy - 10 };

  const reducedForSmall = width < 880 ? 0.82 : width < 1100 ? 0.9 : 1;
  const primaryRadius = Math.round(190 * reducedForSmall);
  const childRadius = Math.round(92 * reducedForSmall);

  // Reference has 8 radial branches; we use our content (skills/deltas etc) but preserve structure.
  const primaries: Array<{
    id: string;
    label: string;
    iconKind: Parameters<typeof categoryIcon>[0];
    children: Array<{ id: string; label: string; description: string }>;
  }> = [
    {
      id: "mm_skills",
      label: "Core skills",
      iconKind: "skills",
      children: deltas.slice(0, 3).map((d) => ({
        id: `mm_skill_${d.id}`,
        label: d.skill,
        description: `Current ${d.current}/5 → Target ${d.target}/5`
      }))
    },
    {
      id: "mm_projects",
      label: "Proof projects",
      iconKind: "projects",
      children: [
        { id: "mm_proj_1", label: "Portfolio artifact", description: "Ship a concrete artifact aligned to the role." },
        { id: "mm_proj_2", label: "Case study", description: "Write a short impact narrative (problem → action → result)." }
      ]
    },
    {
      id: "mm_experience",
      label: "Experience gaps",
      iconKind: "experience",
      children: [
        { id: "mm_exp_1", label: "Scope & ownership", description: "Increase ownership: lead a full slice end-to-end." },
        { id: "mm_exp_2", label: "Decision-making", description: "Practice tradeoffs; document decisions & outcomes." }
      ]
    },
    {
      id: "mm_network",
      label: "Network",
      iconKind: "network",
      children: [
        { id: "mm_net_1", label: "Mentors", description: "Find 1–2 people in-role for feedback loops." },
        { id: "mm_net_2", label: "Peers", description: "Join a peer group and share progress biweekly." }
      ]
    },
    {
      id: "mm_brand",
      label: "Personal brand",
      iconKind: "brand",
      children: [
        { id: "mm_brand_1", label: "LinkedIn", description: "Align headline + highlights to target role signals." },
        { id: "mm_brand_2", label: "Story", description: "Tight narrative: who you help + how you do it." }
      ]
    },
    {
      id: "mm_interview",
      label: "Interview readiness",
      iconKind: "interview",
      children: [
        { id: "mm_int_1", label: "Mock interview", description: "Run weekly mocks; refine stories & frameworks." },
        { id: "mm_int_2", label: "Role-specific prompts", description: "Build a prompt bank; practice under timebox." }
      ]
    },
    {
      id: "mm_market",
      label: "Market fit",
      iconKind: "market",
      children: [
        { id: "mm_mkt_1", label: roleIndustry, description: "Pick a focus niche and tailor examples to it." },
        { id: "mm_mkt_2", label: "Target companies", description: "Create a short list and map requirements." }
      ]
    },
    {
      id: "mm_proof",
      label: "Signals",
      iconKind: "proof",
      children: [
        { id: "mm_sig_1", label: `Compat: ${compatibility}%`, description: "Use compatibility as a starting hypothesis." },
        { id: "mm_sig_2", label: "Outcomes", description: "Convert activities into measurable outcomes." }
      ]
    }
  ];

  // Angles: 8 directions (N, NE, E, SE, S, SW, W, NW)
  // We place the *selected target role* as the primary outer node on the RIGHT (E) to match screenshot emphasis.
  const anglesBySlot = [270, 315, 0, 45, 90, 135, 180, 225];
  const roleAngle = 0;

  // Assign accents consistently; role gets cyan like reference "primary outer node", center also cyan.
  const centerAccent = MM_ACCENTS[0].rgb;
  const roleAccent = MM_ACCENTS[0].rgb;

  // Remaining primaries get other accents (cyclic)
  const nonRoleAccents = MM_ACCENTS.slice(1).map((a) => a.rgb);

  const nodes: MindMapNode[] = [];
  const edges: MindMapEdge[] = [];

  // Center node: YOU
  nodes.push({
    id: "mm_you",
    kind: "center",
    label: "YOU",
    accent: centerAccent,
    ringWidthPx: 3,
    radiusPx: 52,
    x: center.x,
    y: center.y,
    icon: roleIcon(),
    meta: {
      title: "You (Current State)",
      description: "This mind map organizes your roadmap into clusters. Hover nodes for glow; click for details."
    }
  });

  // Primary outer node: target role
  const rolePos = polarPoint(center.x, center.y, primaryRadius, roleAngle);
  nodes.push({
    id: "mm_role",
    kind: "role",
    label: normalizeRoleTitle(roleTitle),
    accent: roleAccent,
    ringWidthPx: 3,
    radiusPx: 48,
    x: rolePos.x,
    y: rolePos.y,
    icon: (
      <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
        <path fill="currentColor" d="M10 3h4a2 2 0 0 1 2 2v1h3a2 2 0 0 1 2 2v10a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V8a2 2 0 0 1 2-2h3V5a2 2 0 0 1 2-2Z" />
      </svg>
    ),
    meta: {
      title: normalizeRoleTitle(roleTitle),
      description: `Target role node. This is the primary outer node for the selected role in your cart.`,
      stats: {
        Industry: roleIndustry,
        Compatibility: `${compatibility}%`
      }
    }
  });

  edges.push({
    id: "e_you_role",
    from: "mm_you",
    to: "mm_role",
    accent: roleAccent,
    weight: "primary"
  });

  // For the rest of the 8 radial slots, place category nodes excluding the role slot.
  const availableSlots = anglesBySlot.filter((a) => a !== roleAngle);
  const primariesForSlots = primaries.slice(0, availableSlots.length);

  primariesForSlots.forEach((p, idx) => {
    const angle = availableSlots[idx];
    const accent = nonRoleAccents[idx % nonRoleAccents.length];

    const pos = polarPoint(center.x, center.y, primaryRadius, angle);
    const primaryId = p.id;

    nodes.push({
      id: primaryId,
      kind: "primary",
      label: p.label,
      accent,
      ringWidthPx: 2,
      radiusPx: 42,
      x: pos.x,
      y: pos.y,
      icon: categoryIcon(p.iconKind),
      meta: {
        title: p.label,
        description: "Category cluster. Click to view sub-items and suggested actions."
      }
    });

    edges.push({
      id: `e_you_${primaryId}`,
      from: "mm_you",
      to: primaryId,
      accent,
      weight: "primary"
    });

    // Child nodes arranged in a mini-fan around the primary along the branch direction.
    const baseAngle = angle;
    const offsets = p.children.length === 1 ? [0] : p.children.length === 2 ? [-16, 12] : [-22, 0, 18];
    p.children.slice(0, 3).forEach((c, cIdx) => {
      const childAngle = baseAngle + offsets[cIdx];
      const childPos = polarPoint(pos.x, pos.y, childRadius, childAngle);

      nodes.push({
        id: c.id,
        kind: "child",
        label: c.label,
        accent,
        ringWidthPx: 2,
        radiusPx: 26,
        x: childPos.x,
        y: childPos.y,
        meta: {
          title: c.label,
          description: c.description
        }
      });

      edges.push({
        id: `e_${primaryId}_${c.id}`,
        from: primaryId,
        to: c.id,
        accent,
        weight: "secondary"
      });
    });
  });

  return { nodes, edges };
}

function nodeSize(n: MindMapNode) {
  // Render nodes as circles; diameter is derived from radiusPx.
  return n.radiusPx;
}

function edgeStyle(edge: MindMapEdge) {
  // Reference connectors: thin, muted slate with subtle glow; we tint slightly by accent.
  const base = edge.weight === "primary" ? 0.42 : 0.32;
  return {
    stroke: `rgba(148, 163, 184, ${base})`,
    strokeWidth: edge.weight === "primary" ? 1.2 : 1.0
  };
}

function MindMapNodeView(props: {
  node: MindMapNode;
  isActive: boolean;
  isHovered: boolean;
  onHover: (id: string | null) => void;
  onClick: (id: string) => void;
}) {
  const { node, isActive, isHovered, onHover, onClick } = props;
  const diameter = nodeSize(node);

  // Glow intensity is stronger for hover/active.
  const glowA = isActive ? 0.45 : isHovered ? 0.34 : 0.22;
  const glowB = isActive ? 0.5 : isHovered ? 0.4 : 0.28;

  // Use CSS variables to keep this component self-contained (no global CSS needed).
  const style = {
    left: node.x,
    top: node.y,
    width: diameter,
    height: diameter,
    transform: "translate(-50%, -50%)",
    ["--mm-accent" as any]: node.accent,
    ["--mm-glow-a" as any]: glowA,
    ["--mm-glow-b" as any]: glowB
  } as React.CSSProperties;

  const isCenter = node.kind === "center";
  const isRole = node.kind === "role";
  const isPrimary = node.kind === "primary";
  const isChild = node.kind === "child";

  return (
    <div style={style} className="absolute z-[2]">
      <button
        type="button"
        onMouseEnter={() => onHover(node.id)}
        onMouseLeave={() => onHover(null)}
        onFocus={() => onHover(node.id)}
        onBlur={() => onHover(null)}
        onClick={() => onClick(node.id)}
        className={cn(
          "group relative grid place-items-center rounded-full",
          "outline-none focus-visible:ring-2 focus-visible:ring-white/25",
          "transition-transform duration-200",
          isActive ? "scale-[1.03]" : isHovered ? "scale-[1.02]" : "scale-100"
        )}
        style={{
          width: diameter,
          height: diameter,
          background: "radial-gradient(circle at 30% 30%, rgba(24, 50, 80, 0.82), rgba(6, 12, 24, 0.96))",
          border: `${node.ringWidthPx}px solid rgba(${node.accent} / 0.92)`,
          boxShadow: `0 0 18px rgba(${node.accent} / var(--mm-glow-a)), 0 0 2px rgba(${node.accent} / var(--mm-glow-b))`
        }}
        aria-label={node.label}
      >
        {/* subtle inner highlight */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-full opacity-70"
          style={{
            background: "radial-gradient(circle at 30% 30%, rgba(255,255,255,0.10), transparent 55%)"
          }}
        />

        {/* icon */}
        {(isCenter || isRole || isPrimary) && (
          <span className={cn("relative z-[1] grid place-items-center", isCenter ? "text-white" : "text-white/90")}>
            {node.icon}
          </span>
        )}

        {/* Center text inside the center/role nodes like reference */}
        {(isCenter || isRole) && (
          <span
            className={cn(
              "relative z-[1] mt-1 block text-center font-semibold tracking-wide",
              isCenter ? "text-[10px] text-white/90" : "text-[10px] text-white/88"
            )}
          >
            {node.label}
          </span>
        )}

        {/* child nodes are just dots; no inner label */}
        {isChild && <span className="sr-only">{node.label}</span>}
      </button>

      {/* Labels: primary label below node; child label beside dot */}
      {isPrimary && (
        <div className="pointer-events-none mt-2 w-[140px] -translate-x-1/2 text-center text-[12px] font-semibold text-white/90" style={{ position: "absolute", left: "50%" }}>
          {node.label}
        </div>
      )}

      {isChild && (
        <div
          className="pointer-events-none text-left text-[11px] font-medium text-white/75"
          style={{
            position: "absolute",
            left: diameter / 2 + 8,
            top: diameter / 2 - 7,
            maxWidth: 180,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis"
          }}
          title={node.label}
        >
          {node.label}
        </div>
      )}

      {/* role label under role node for consistent typography */}
      {isRole && (
        <div className="pointer-events-none mt-2 w-[160px] -translate-x-1/2 text-center text-[12px] font-semibold text-white/92" style={{ position: "absolute", left: "50%" }}>
          {node.label}
        </div>
      )}
    </div>
  );
}

function MindMapSideCard(props: { node: MindMapNode; onClose: () => void }) {
  const { node, onClose } = props;
  return (
    <div className="cn-mv-panelEnter absolute right-4 top-4 z-[20] w-[340px] max-w-[calc(100%-2rem)] rounded-2xl border border-white/10 bg-[#0A1221]/85 p-4 text-white shadow-[0_20px_60px_rgba(0,0,0,0.35)] backdrop-blur">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="truncate text-sm font-bold text-white">{node.meta?.title ?? node.label}</div>
          <div className="mt-1 text-xs font-semibold text-white/70">{node.kind === "center" ? "Center" : node.kind === "role" ? "Target role" : node.kind === "primary" ? "Category" : "Item"}</div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="grid h-9 w-9 place-items-center rounded-xl bg-white/5 text-white/80 ring-1 ring-inset ring-white/10 transition hover:bg-white/10 hover:text-white"
          aria-label="Close details"
        >
          ✕
        </button>
      </div>

      {node.meta?.description && <p className="mt-3 text-sm text-white/80">{node.meta.description}</p>}

      {node.meta?.stats && (
        <div className="mt-4 grid grid-cols-2 gap-2">
          {Object.entries(node.meta.stats).map(([k, v]) => (
            <div key={k} className="rounded-xl bg-white/5 p-3 ring-1 ring-inset ring-white/10">
              <div className="text-[11px] font-semibold text-white/60">{k}</div>
              <div className="mt-1 text-sm font-bold text-white tabular-nums">{v}</div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 rounded-xl bg-white/5 p-3 text-xs text-white/70 ring-1 ring-inset ring-white/10">
        Tip: Hover nodes to highlight their cluster; click nodes to pin details here.
      </div>
    </div>
  );
}

function MindMapTooltip(props: { x: number; y: number; title: string; subtitle?: string }) {
  const { x, y, title, subtitle } = props;

  return (
    <div
      className="pointer-events-none absolute z-[30] max-w-[260px] rounded-xl border border-white/10 bg-[#0A1221]/88 px-3 py-2 text-white shadow-[0_14px_40px_rgba(0,0,0,0.35)] backdrop-blur"
      style={{ left: x + 12, top: y + 12 }}
      role="tooltip"
    >
      <div className="text-xs font-bold text-white">{title}</div>
      {subtitle && <div className="mt-0.5 text-[11px] font-medium text-white/70">{subtitle}</div>}
    </div>
  );
}

function MindMapCanvas(props: {
  roleTitle: string;
  roleIndustry: string;
  compatibility: number;
  deltas: SkillDelta[];
  onGenerate: () => void;
}) {
  const { roleTitle, roleIndustry, compatibility, deltas, onGenerate } = props;
  const reducedMotion = usePrefersReducedMotion();

  const ref = React.useRef<HTMLDivElement | null>(null);
  const [size, setSize] = React.useState({ w: 920, h: 560 });

  const [hoveredId, setHoveredId] = React.useState<string | null>(null);

  // No node should be selected by default. The details panel must only appear after a click.
  const [activeId, setActiveId] = React.useState<string | null>(null);

  const [cursor, setCursor] = React.useState<{ x: number; y: number } | null>(null);

  React.useEffect(() => {
    if (!ref.current) return;

    const el = ref.current;

    const update = () => {
      const r = el.getBoundingClientRect();
      setSize({ w: Math.max(520, Math.floor(r.width)), h: Math.max(440, Math.floor(r.height)) });
    };

    update();
    const ro = new ResizeObserver(() => update());
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const { nodes, edges } = React.useMemo(
    () => getMindMapModel({ roleTitle, roleIndustry, compatibility, deltas, width: size.w, height: size.h }),
    [roleTitle, roleIndustry, compatibility, deltas, size.w, size.h]
  );

  const hoveredNode = hoveredId ? nodes.find((n) => n.id === hoveredId) ?? null : null;

  // Active node is "pinned" by click. Null means "no selection" (panel hidden).
  const activeNode = activeId ? nodes.find((n) => n.id === activeId) ?? null : null;

  // Highlight: when hovering a node, brighten edges connected to it (and its immediate neighborhood).
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
    return s;
  }, [hoveredId, edges]);

  const onMouseMove: React.MouseEventHandler<HTMLDivElement> = (e) => {
    if (!ref.current) return;
    const r = ref.current.getBoundingClientRect();
    setCursor({ x: e.clientX - r.left, y: e.clientY - r.top });
  };

  const onMouseLeave: React.MouseEventHandler<HTMLDivElement> = () => {
    setCursor(null);
    setHoveredId(null);
  };

  return (
    <div
      ref={ref}
      className={cn(
        "relative overflow-hidden rounded-2xl ring-1 ring-inset",
        "ring-white/10",
        "min-h-[520px]"
      )}
      style={{
        background:
          "radial-gradient(circle at 45% 40%, rgba(15, 35, 70, 0.65), rgba(7, 11, 20, 1) 65%)"
      }}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
    >
      {/* subtle vignette */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at 50% 50%, transparent 35%, rgba(0,0,0,0.45) 100%)",
          opacity: 0.65
        }}
      />

      {/* edges (SVG) */}
      <svg className="absolute inset-0 z-[1]" width={size.w} height={size.h} aria-hidden="true">
        <defs>
          <filter id="mm-edge-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="0" stdDeviation="1.2" floodColor="rgba(56,189,248,0.10)" />
          </filter>
        </defs>

        {edges.map((e) => {
          const from = nodes.find((n) => n.id === e.from);
          const to = nodes.find((n) => n.id === e.to);
          if (!from || !to) return null;

          // Clip lines to stop at node edges rather than center, matching reference.
          const dx = to.x - from.x;
          const dy = to.y - from.y;
          const dist = Math.max(1, Math.sqrt(dx * dx + dy * dy));
          const ux = dx / dist;
          const uy = dy / dist;

          const fromPad = from.radiusPx / 2 + 3;
          const toPad = to.radiusPx / 2 + 3;

          const x1 = from.x + ux * fromPad;
          const y1 = from.y + uy * fromPad;
          const x2 = to.x - ux * toPad;
          const y2 = to.y - uy * toPad;

          const base = edgeStyle(e);

          const isHi = hoveredId ? highlightSet.has(e.id) : false;
          const opacity = isHi ? 0.95 : 0.7;
          const stroke = isHi ? `rgba(${e.accent} / 0.50)` : base.stroke;
          const strokeWidth = isHi ? base.strokeWidth + 0.3 : base.strokeWidth;

          return (
            <line
              key={e.id}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke={stroke}
              strokeWidth={strokeWidth}
              opacity={opacity}
              filter="url(#mm-edge-glow)"
              strokeLinecap="round"
            />
          );
        })}
      </svg>

      {/* nodes (HTML overlay) */}
      <div className="absolute inset-0 z-[2]">
        {nodes.map((n) => (
          <MindMapNodeView
            key={n.id}
            node={n}
            isActive={activeId === n.id}
            isHovered={hoveredId === n.id || (hoveredId ? highlightSet.has(n.id) : false)}
            onHover={(id) => setHoveredId(id)}
            onClick={(id) => setActiveId(id)}
          />
        ))}
      </div>

      {/* tooltip follows cursor (for hovered nodes) */}
      {hoveredNode && cursor && hoveredNode.id !== activeId && (
        <MindMapTooltip x={cursor.x} y={cursor.y} title={hoveredNode.meta?.title ?? hoveredNode.label} subtitle={hoveredNode.meta?.description} />
      )}

      {/* pinned side card for clicked node (only after click/select) */}
      {activeNode && <MindMapSideCard node={activeNode} onClose={() => setActiveId(null)} />}

      {/* top controls bar (dark chips, minimal — matches reference layout) */}
      <div className="absolute left-4 top-4 z-[15] flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white/80 backdrop-blur">
          <span className="h-2 w-2 rounded-full bg-[rgba(56,189,248,0.9)] shadow-[0_0_16px_rgba(56,189,248,0.25)]" aria-hidden="true" />
          Mind Map
        </span>

        <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white/70 backdrop-blur">
          Target: <span className="font-bold text-white/90">{normalizeRoleTitle(roleTitle)}</span>
        </span>

        <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white/70 backdrop-blur">
          Industry: <span className="font-bold text-white/90">{roleIndustry}</span>
        </span>

        <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white/70 backdrop-blur">
          Compatibility: <span className="font-bold text-white/90 tabular-nums">{compatibility}%</span>
        </span>
      </div>

      {/* bottom-right CTA */}
      <div className="absolute bottom-4 right-4 z-[15]">
        <button
          type="button"
          onClick={onGenerate}
          className={cn(
            "h-9 rounded-lg px-4 text-xs font-bold",
            "bg-[rgba(34,199,184,1)] text-[#06202A]",
            "shadow-[0_14px_34px_rgba(34,199,184,0.18)]",
            "transition hover:bg-[rgba(24,182,168,1)] hover:shadow-[0_16px_40px_rgba(34,199,184,0.24)]",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/25"
          )}
        >
          Generate Roadmap
        </button>
      </div>

      {/* reduced motion hint (kept subtle) */}
      {!reducedMotion && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-60"
          style={{
            background:
              "radial-gradient(circle at 20% 30%, rgba(56,189,248,0.10), transparent 45%), radial-gradient(circle at 70% 60%, rgba(167,139,250,0.08), transparent 50%)"
          }}
        />
      )}
    </div>
  );
}

// PUBLIC_INTERFACE
export default function RoadmapJourneyPage() {
  /**
   * Roadmap: planning hub for selected roles.
   * Tabs:
   * - Mind Map: radial roadmap mind map centered on YOU, with selected target role as the primary outer node.
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
          {/* Left: role selector */}
          <aside className="lg:col-span-4">
            <div className="sticky top-4 space-y-3">
              <Card title="Selected roles" description="Pick a role to view its mind map and pathway.">
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
              <Card title={`Mind Map — ${activePlan.title}`} description="Center node is YOU. The primary outer node is your selected target role. Hover for glow; click for details.">
                <MindMapCanvas
                  roleTitle={activePlan.title}
                  roleIndustry={activePlan.industry}
                  compatibility={activePlan.compatibility}
                  deltas={activePlan.deltas}
                  onGenerate={() => alert("Generate Roadmap (placeholder).")}
                />
              </Card>
            ) : (
              <Card
                title={`Pathway — ${activePlan.title}`}
                description="A milestone pathway laid out in three stages, matching the reference timeline layout. Completion is tracked via checkbox/status."
              >
                <PathwayTimelineCard
                  planTitle={activePlan.title}
                  milestones={activePlan.milestones}
                  onAdd={addMilestone}
                  onUpdate={updateMilestone}
                  onDelete={deleteMilestone}
                  onToggleDone={(milestoneId, done) => {
                    // Checkbox completion should keep existing progress updates (stored in milestones.status).
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
    </div>
  );
}
