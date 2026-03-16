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
  // NEW: pathway redesign uses lightweight tags instead of form fields.
  tags?: string[];
  // NEW: stage grouping for NOW/NEAR/NEXT.
  stage?: "now" | "near" | "next";
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

function milestoneProgress(m: Milestone) {
  if (m.status === "Done") return 100;
  if (m.status === "In progress") return 50;
  return 0;
}

function completionSummary(milestones: Milestone[]) {
  const total = milestones.length;
  const done = milestones.filter((m) => m.status === "Done").length;
  const inProgress = milestones.filter((m) => m.status === "In progress").length;
  const percent = total === 0 ? 0 : Math.round((done / total) * 100);
  return { total, done, inProgress, percent };
}

function progressRingTone(percent: number) {
  // Keep the futuristic/dark UI: tones are neon-ish.
  if (percent >= 75) return { track: "rgba(16, 185, 129, 0.16)", bar: "rgba(52, 211, 153, 0.95)" }; // emerald
  if (percent >= 40) return { track: "rgba(245, 158, 11, 0.14)", bar: "rgba(251, 191, 36, 0.95)" }; // amber
  return { track: "rgba(255, 255, 255, 0.10)", bar: "rgba(148, 163, 184, 0.85)" }; // slate
}

function stageIcon(kind: "flag" | "lightning" | "target", className?: string) {
  const cls = cn("h-4 w-4", className);
  if (kind === "flag") {
    // start flag
    return (
      <svg viewBox="0 0 24 24" className={cls} aria-hidden="true">
        <path fill="currentColor" d="M6 2h2v2h10l-2 4 2 4H8v10H6V2Zm2 4v4h8.8l-1-2 1-2H8Z" />
      </svg>
    );
  }
  if (kind === "lightning") {
    return (
      <svg viewBox="0 0 24 24" className={cls} aria-hidden="true">
        <path fill="currentColor" d="M13 2 3 14h7l-1 8 12-14h-7l-1-6Z" />
      </svg>
    );
  }
  // target
  return (
    <svg viewBox="0 0 24 24" className={cls} aria-hidden="true">
      <path
        fill="currentColor"
        d="M12 2a10 10 0 1 0 10 10A10.01 10.01 0 0 0 12 2Zm0 2a8 8 0 1 1-8 8 8.01 8.01 0 0 1 8-8Zm0 3a5 5 0 1 0 5 5 5.01 5.01 0 0 0-5-5Zm0 2a3 3 0 1 1-3 3 3.01 3.01 0 0 1 3-3Zm0 2a1 1 0 1 0 1 1 1 1 0 0 0-1-1Z"
      />
    </svg>
  );
}

function computeStageForIndex(idx: number, total: number): "now" | "near" | "next" {
  // 3 columns roughly aligned with timeline; default distribution:
  // - if total <= 2: put into NOW
  // - else: first 3 NOW, next 3 NEAR, rest NEXT (matches the reference example 3/3/2)
  if (total <= 2) return "now";
  if (idx < 3) return "now";
  if (idx < 6) return "near";
  return "next";
}

function normalizeMilestonesForPathway(milestones: Milestone[]) {
  // Ensure stage/tags exist without breaking older saved roadmap data.
  // If stage is already set (future), keep it.
  // Otherwise distribute by index so counters read sensibly.
  const total = milestones.length;
  return milestones.map((m, idx) => {
    const stage = m.stage ?? computeStageForIndex(idx, total);
    const tags =
      m.tags && m.tags.length
        ? m.tags
        : // Derive minimal tags from legacy description if possible; otherwise default to a single category.
          (() => {
            // Very light heuristic; keeps UI clean and non-form-like.
            if (/cert/i.test(m.title)) return ["Certification"];
            if (/lead/i.test(m.title)) return ["Leadership"];
            if (/portfolio|project|ship|build/i.test(m.title)) return ["Experience"];
            if (/network|mentor|community/i.test(m.title)) return ["Relationship"];
            return ["Skill Development"];
          })();
    return { ...m, stage, tags };
  });
}

function ProgressRing(props: { value: number; label: string }) {
  const { value, label } = props;
  const v = clamp(value, 0, 100);
  const tone = progressRingTone(v);

  // SVG ring
  const size = 44;
  const r = 18;
  const c = 2 * Math.PI * r;
  const dash = (v / 100) * c;

  return (
    <div className="flex items-center gap-3">
      <div className="relative grid place-items-center" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox="0 0 44 44" aria-hidden="true">
          <circle cx="22" cy="22" r={r} stroke={tone.track} strokeWidth="5" fill="none" />
          <circle
            cx="22"
            cy="22"
            r={r}
            stroke={tone.bar}
            strokeWidth="5"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={`${dash} ${c - dash}`}
            transform="rotate(-90 22 22)"
            style={{ filter: "drop-shadow(0 0 10px rgba(45, 212, 191, 0.22))" }}
          />
        </svg>
        <div className="absolute text-[10px] font-bold text-white/85 tabular-nums">{v}%</div>
      </div>

      <div className="min-w-0">
        <div className="text-[11px] font-semibold text-white/55">Milestones</div>
        <div className="truncate text-sm font-bold text-white">{label}</div>
      </div>
    </div>
  );
}

function TagChip({ children }: { children: React.ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold",
        "border border-white/10 bg-white/5 text-white/70"
      )}
    >
      {children}
    </span>
  );
}

function StageNode(props: {
  title: string;
  subtitle: string;
  icon: "flag" | "lightning" | "target";
  done: number;
  total: number;
  accentRgb: string; // "r g b"
  isCurrent?: boolean;
}) {
  const { title, subtitle, icon, done, total, accentRgb, isCurrent } = props;
  const complete = total > 0 && done === total;
  const baseGlow = complete ? 0.52 : isCurrent ? 0.46 : 0.30;

  return (
    <div className="relative flex flex-col items-center text-center">
      <div
        className={cn(
          "relative z-[2] grid h-11 w-11 place-items-center rounded-full border",
          "bg-[#071225]/90 backdrop-blur",
          isCurrent ? "scale-[1.02]" : "scale-100",
          "transition-transform duration-200"
        )}
        style={{
          borderColor: `rgba(${accentRgb} / 0.52)`,
          boxShadow: `0 0 22px rgba(${accentRgb} / ${baseGlow}), 0 0 2px rgba(${accentRgb} / 0.55)`
        }}
        aria-label={`${title} stage`}
      >
        <span className="text-white/92" style={{ filter: "drop-shadow(0 0 12px rgba(255,255,255,0.10))" }}>
          {stageIcon(icon)}
        </span>
      </div>

      <div className="mt-2 text-sm font-extrabold tracking-wide text-white">{title}</div>
      <div className="mt-0.5 text-[11px] font-semibold text-white/55">{subtitle}</div>
      <div className="mt-1 text-[11px] font-semibold text-white/70 tabular-nums">
        {done}/{total} complete
      </div>

      {complete && (
        <div
          aria-hidden="true"
          className="mt-2 h-1 w-10 rounded-full"
          style={{
            background: `linear-gradient(90deg, rgba(${accentRgb} / 0.95), rgba(45, 212, 191, 0.35))`,
            boxShadow: `0 0 16px rgba(${accentRgb} / 0.32)`
          }}
        />
      )}
    </div>
  );
}

function MilestoneCard(props: { milestone: Milestone; onToggleDone: (id: string, done: boolean) => void }) {
  const { milestone: m, onToggleDone } = props;
  const done = m.status === "Done";

  return (
    <label
      className={cn(
        "group relative flex gap-3 rounded-2xl border p-3",
        "bg-[#071225]/82 backdrop-blur",
        "transition-all duration-200",
        done ? "opacity-60" : "opacity-100",
        "hover:-translate-y-[1px] hover:shadow-[0_18px_50px_rgba(0,0,0,0.35)]",
        "focus-within:ring-2 focus-within:ring-white/15"
      )}
      style={{
        borderColor: done ? "rgba(148, 163, 184, 0.16)" : "rgba(255, 255, 255, 0.10)",
        boxShadow: done ? "0 0 0 1px rgba(255,255,255,0.03)" : "0 0 0 1px rgba(45, 212, 191, 0.06)"
      }}
    >
      {/* soft glow on hover */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-200 group-hover:opacity-100"
        style={{
          background:
            "radial-gradient(circle at 30% 25%, rgba(45, 212, 191, 0.14), transparent 55%), radial-gradient(circle at 80% 65%, rgba(59, 130, 246, 0.10), transparent 58%)"
        }}
      />

      <span className="relative mt-0.5">
        <input
          type="checkbox"
          checked={done}
          onChange={(e) => onToggleDone(m.id, e.target.checked)}
          className={cn(
            "h-5 w-5 rounded-md border bg-white/5",
            "border-white/20 text-teal-400",
            "transition-all duration-200",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/25",
            done ? "shadow-[0_0_0_3px_rgba(16,185,129,0.10)]" : "shadow-none"
          )}
          aria-label={`Mark milestone ${m.title} complete`}
        />
        {/* checkbox pulse */}
        <span
          aria-hidden="true"
          className={cn("pointer-events-none absolute -inset-2 rounded-lg opacity-0", done ? "opacity-100" : "opacity-0")}
          style={{
            transition: "opacity 220ms ease",
            background: "radial-gradient(circle at 50% 50%, rgba(52, 211, 153, 0.20), transparent 60%)"
          }}
        />
      </span>

      <div className="relative min-w-0 flex-1">
        <div className={cn("text-[13px] font-extrabold text-white/92", done ? "line-through decoration-white/20" : "no-underline")}>
          {m.title}
        </div>

        {m.tags && m.tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {m.tags.slice(0, 4).map((t) => (
              <TagChip key={t}>{t}</TagChip>
            ))}
          </div>
        )}
      </div>
    </label>
  );
}

function PathwayCareerTimeline(props: { planTitle: string; milestones: Milestone[]; onToggleDone: (milestoneId: string, done: boolean) => void }) {
  const { planTitle, milestones, onToggleDone } = props;

  const normalized = React.useMemo(() => normalizeMilestonesForPathway(milestones), [milestones]);

  const stages = React.useMemo(() => {
    const now = normalized.filter((m) => m.stage === "now");
    const near = normalized.filter((m) => m.stage === "near");
    const next = normalized.filter((m) => m.stage === "next");

    const countDone = (arr: Milestone[]) => arr.filter((m) => m.status === "Done").length;

    return {
      now: { items: now, done: countDone(now), total: now.length },
      near: { items: near, done: countDone(near), total: near.length },
      next: { items: next, done: countDone(next), total: next.length }
    };
  }, [normalized]);

  const summary = React.useMemo(() => completionSummary(normalized), [normalized]);

  // pick "current" stage: first stage that isn't complete (or NOW if empty)
  const currentStage = React.useMemo<"now" | "near" | "next">(() => {
    const order: Array<"now" | "near" | "next"> = ["now", "near", "next"];
    for (const s of order) {
      const st = stages[s];
      if (st.total === 0) continue;
      if (st.done < st.total) return s;
    }
    return "now";
  }, [stages]);

  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-2xl border p-4",
        "border-white/10 bg-gradient-to-b from-[#0b1b2b] to-[#07131f]",
        "shadow-[0_18px_50px_rgba(0,0,0,0.22)]"
      )}
      aria-label="Career journey pathway"
    >
      {/* Ambient futuristic background (particles + grid) */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div
          className="absolute inset-0 opacity-[0.22]"
          style={{
            background:
              "radial-gradient(circle at 18% 28%, rgba(20, 184, 166, 0.22), transparent 56%), radial-gradient(circle at 74% 34%, rgba(59, 130, 246, 0.10), transparent 60%), radial-gradient(circle at 60% 82%, rgba(168, 85, 247, 0.10), transparent 55%)"
          }}
        />
        <div
          className="absolute inset-0 opacity-[0.16]"
          style={{
            background:
              "linear-gradient(to right, rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.06) 1px, transparent 1px)",
            backgroundSize: "58px 58px",
            maskImage: "radial-gradient(circle at 50% 35%, black 35%, transparent 74%)"
          }}
        />
        {Array.from({ length: 14 }).map((_, i) => {
          const left = (i * 37) % 100;
          const top = (i * 29) % 100;
          const sizePx = 2 + (i % 4);
          const dur = 7 + (i % 7);
          const delay = (i % 8) * -0.65;
          return (
            <span
              key={i}
              className="absolute rounded-full"
              style={{
                left: `${left}%`,
                top: `${top}%`,
                width: sizePx,
                height: sizePx,
                background: "rgba(45, 212, 191, 0.22)",
                boxShadow: "0 0 16px rgba(45, 212, 191, 0.14)",
                animation: `cn-path-float ${dur}s ease-in-out ${delay}s infinite`
              }}
            />
          );
        })}
      </div>

      {/* Header + top progress tracker */}
      <div className="relative z-[1] mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="text-xs font-semibold text-white/55">Pathway</div>
          <div className="mt-1 truncate text-base font-extrabold text-white">Career Journey — {planTitle}</div>
          <div className="mt-1 text-[11px] font-medium text-white/55">Check milestones to update stage counters and overall progress.</div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 backdrop-blur">
          <ProgressRing value={summary.percent} label={`${summary.done} / ${summary.total} completed`} />
        </div>
      </div>

      {/* Timeline (NOW/NEAR/NEXT) */}
      <div className="relative z-[1] rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-4">
        {/* horizontal line */}
        <div
          aria-hidden="true"
          className="absolute left-6 right-6 top-[30px] hidden h-[2px] md:block"
          style={{
            background: "linear-gradient(90deg, rgba(45,212,191,0.16), rgba(59,130,246,0.12), rgba(168,85,247,0.12))"
          }}
        />
        {/* vertical line for small screens */}
        <div
          aria-hidden="true"
          className="absolute bottom-6 left-[30px] top-6 block w-[2px] md:hidden"
          style={{
            background: "linear-gradient(180deg, rgba(45,212,191,0.16), rgba(59,130,246,0.12), rgba(168,85,247,0.12))"
          }}
        />

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-6">
          <StageNode
            title="NOW"
            subtitle="0–6 months"
            icon="flag"
            done={stages.now.done}
            total={stages.now.total}
            accentRgb="45 212 191"
            isCurrent={currentStage === "now"}
          />
          <StageNode
            title="NEAR"
            subtitle="1–2 years"
            icon="lightning"
            done={stages.near.done}
            total={stages.near.total}
            accentRgb="59 130 246"
            isCurrent={currentStage === "near"}
          />
          <StageNode
            title="NEXT"
            subtitle="2–5 years"
            icon="target"
            done={stages.next.done}
            total={stages.next.total}
            accentRgb="168 85 247"
            isCurrent={currentStage === "next"}
          />
        </div>
      </div>

      {/* Milestone columns aligned with stages */}
      <div className="relative z-[1] mt-4 grid grid-cols-1 gap-3 md:grid-cols-3 md:gap-4">
        {/* NOW */}
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2 px-1">
            <div className="text-xs font-extrabold text-white/90">NOW</div>
            <div className="text-[11px] font-semibold text-white/55 tabular-nums">
              {stages.now.done}/{stages.now.total}
            </div>
          </div>
          <div className="space-y-2">
            {stages.now.total === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.03] p-3 text-[11px] font-semibold text-white/50">
                No milestones in this stage yet.
              </div>
            ) : (
              stages.now.items.map((m) => <MilestoneCard key={m.id} milestone={m} onToggleDone={onToggleDone} />)
            )}
          </div>
        </div>

        {/* NEAR */}
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2 px-1">
            <div className="text-xs font-extrabold text-white/90">NEAR</div>
            <div className="text-[11px] font-semibold text-white/55 tabular-nums">
              {stages.near.done}/{stages.near.total}
            </div>
          </div>
          <div className="space-y-2">
            {stages.near.total === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.03] p-3 text-[11px] font-semibold text-white/50">
                No milestones in this stage yet.
              </div>
            ) : (
              stages.near.items.map((m) => <MilestoneCard key={m.id} milestone={m} onToggleDone={onToggleDone} />)
            )}
          </div>
        </div>

        {/* NEXT */}
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2 px-1">
            <div className="text-xs font-extrabold text-white/90">NEXT</div>
            <div className="text-[11px] font-semibold text-white/55 tabular-nums">
              {stages.next.done}/{stages.next.total}
            </div>
          </div>
          <div className="space-y-2">
            {stages.next.total === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.03] p-3 text-[11px] font-semibold text-white/50">
                No milestones in this stage yet.
              </div>
            ) : (
              stages.next.items.map((m) => <MilestoneCard key={m.id} milestone={m} onToggleDone={onToggleDone} />)
            )}
          </div>
        </div>
      </div>

      <div className="relative z-[1] mt-4 text-[11px] font-semibold text-white/50">
        Tip: This is an MVP view. Milestones are auto-grouped into NOW/NEAR/NEXT based on their position unless a stage is explicitly set in data.
      </div>

      {/* Local keyframes (scoped) */}
      <style jsx>{`
        @keyframes cn-path-float {
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

        @media (prefers-reduced-motion: reduce) {
          span[style*="cn-path-float"] {
            animation: none !important;
          }
        }
      `}</style>
    </section>
  );
}

function seedRolePlan(roleId: string): RolePlan {
  const fallbackTitle = roleId === "n-em" ? "Engineering Manager" : roleId === "n-pm" ? "Product Manager" : roleId === "n-cto" ? "CTO" : "Target Role";

  const industry = roleId.includes("h") ? "HealthTech" : roleId.includes("pm") ? "Technology" : "SaaS";
  const compatibility = roleId === "n-hl" ? 78 : roleId === "n-pm" ? 72 : roleId === "n-em" ? 64 : 58;

  const deltas: SkillDelta[] = [
    { id: uid("d"), skill: "Leadership", current: 3, target: 4 },
    { id: uid("d"), skill: "Strategy", current: 2, target: 4 },
    { id: uid("d"), skill: "Stakeholder alignment", current: 3, target: 5 },
    { id: uid("d"), skill: "Metrics & experimentation", current: 2, target: 4 }
  ];

  const base = todayISO();

  // Seed with a "career journey" flavor (still MVP, local only).
  const milestones: Milestone[] = [
    {
      id: uid("m"),
      title: "AWS Solutions Certification",
      date: base,
      description: "Earn an industry credential to validate baseline cloud capability.",
      status: "Not started",
      tags: ["Certification", "Cloud Architecture"],
      stage: "now"
    },
    {
      id: uid("m"),
      title: "Ship a role-relevant proof project",
      date: base,
      description: "Build and publish a demonstrable artifact aligned to your target role.",
      status: "Not started",
      tags: ["Experience", "Skill Development"],
      stage: "now"
    },
    {
      id: uid("m"),
      title: "Leadership stretch: lead a cross-functional initiative",
      date: base,
      description: "Own scope, stakeholder alignment, and measurable outcomes.",
      status: "Not started",
      tags: ["Leadership", "Experience"],
      stage: "now"
    },
    {
      id: uid("m"),
      title: "Deepen a core competency to advanced level",
      date: base,
      description: "Pick one key competency and build evidence with repeated reps.",
      status: "Not started",
      tags: ["Skill Development"],
      stage: "near"
    },
    {
      id: uid("m"),
      title: "Build relationships with 2 mentors in the target domain",
      date: base,
      description: "Set up monthly checkpoints; collect feedback and referrals.",
      status: "Not started",
      tags: ["Relationship"],
      stage: "near"
    },
    {
      id: uid("m"),
      title: "Target role alignment: map requirements to your evidence",
      date: base,
      description: "Create a clear narrative that connects milestones to role expectations.",
      status: "Not started",
      tags: ["Target Role"],
      stage: "near"
    },
    {
      id: uid("m"),
      title: "Own an end-to-end initiative with measurable impact",
      date: base,
      description: "Drive results with accountability and clear communication.",
      status: "Not started",
      tags: ["Experience", "Leadership"],
      stage: "next"
    },
    {
      id: uid("m"),
      title: "Land the target role (or a stepping-stone role)",
      date: base,
      description: "Use the portfolio + narrative to execute the job search.",
      status: "Not started",
      tags: ["Target Role"],
      stage: "next"
    }
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

function buildCategoriesForRole(args: { roleTitle: string; roleId: string }): MindMapCategory[] {
  /**
   * Build role-specific Mind Map categories/sub-nodes.
   *
   * Requirements (user_input_ref) demand:
   * - Mind Map re-renders immediately when user selects a different role
   * - Nodes/sub-nodes should reflect the selected role
   * - Example nodes for Product Manager: Core Skills (Product Strategy, User Research, Data Analysis),
   *   Proof Projects (Case Study, Portfolio Artifact), Market Fit (Target Companies, Technology Industry)
   *
   * Implementation notes:
   * - We keep the same 7 high-level categories for visual consistency, but vary the sub-node labels/actions per role.
   * - “Market Fit” sub-nodes include role-specific industry wording (e.g., Technology Industry).
   */
  const { roleTitle, roleId } = args;

  const isPM = /product manager/i.test(roleTitle) || roleId === "n-pm";
  const isEM = /engineering manager/i.test(roleTitle) || roleId === "n-em";
  const isCTO = /cto/i.test(roleTitle) || roleId === "n-cto";

  const cats: Array<{ id: string; label: string; colorRgb: string; subs: Array<[string, SkillStatus, string]> }> = [
    {
      id: "core-skills",
      label: "Core Skills",
      colorRgb: "59 130 246", // Blue
      subs: isPM
        ? [
            ["Product Strategy", "In progress", "Draft a 1-page product strategy with a north star metric."],
            ["User Research", "Gap", "Run 5 user interviews and synthesize into actionable insights."],
            ["Data Analysis", "Strong", "Build a KPI dashboard and explain decision tradeoffs."]
          ]
        : isEM
          ? [
              ["People Leadership", "In progress", "Run 1:1s with an agenda; practice coaching with feedback."],
              ["Execution & Delivery", "Gap", "Own a quarterly delivery plan and manage risks proactively."],
              ["Technical Credibility", "In progress", "Write an architecture decision record (ADR) for a real system."]
            ]
          : isCTO
            ? [
                ["Org Strategy", "In progress", "Define a 12-month engineering strategy aligned to company goals."],
                ["Architecture", "Gap", "Design a scalable system; document tradeoffs and constraints."],
                ["Governance", "In progress", "Establish standards: review process, quality gates, and metrics."]
              ]
            : [
                ["Role Foundations", "In progress", "List top 10 competencies and map them to evidence you can show."],
                ["Domain Knowledge", "Gap", "Pick a niche and write 10 insights and 3 contrarian points."],
                ["Analytical Rigor", "In progress", "Create a simple model/dashboard to support a decision."]
              ]
    },
    {
      id: "proof-projects",
      label: "Proof Projects",
      colorRgb: "20 184 166", // Teal
      subs: isPM
        ? [
            ["Case Study", "In progress", "Write a case study: problem → approach → outcome (with numbers)."],
            ["Portfolio Artifact", "Gap", "Ship a spec/deck/demo that signals PM craft."]
          ]
        : isEM
          ? [
              ["Team Impact Artifact", "In progress", "Document an initiative: goals, plan, execution, outcomes."],
              ["Process Improvement", "Gap", "Run a retro and implement 2 durable process changes."]
            ]
          : isCTO
            ? [
                ["Strategic Narrative", "In progress", "Publish a concise strategy memo (vision, bets, risks)."],
                ["Operating Model", "Gap", "Create an org + operating cadence plan (OKRs, reviews, hiring)."]
              ]
            : [
                ["Proof Project", "In progress", "Build a small project that demonstrates key job competencies."],
                ["Portfolio Artifact", "Gap", "Package the work into a clear artifact that recruiters can scan."]
              ]
    },
    {
      id: "market-fit",
      label: "Market Fit",
      colorRgb: "34 197 94", // Green
      subs: isPM
        ? [
            ["Target Companies", "In progress", "Shortlist 15 and map PM requirements to your evidence."],
            ["Technology Industry", "Gap", "Choose a tech niche; study patterns, metrics, and competitor moves."]
          ]
        : isEM
          ? [
              ["Target Companies", "In progress", "Shortlist 15 teams/orgs; map expectations for EM scope."],
              ["Engineering Context", "Gap", "Study how your target companies structure teams and delivery."]
            ]
          : isCTO
            ? [
                ["Target Companies", "In progress", "Shortlist 10; map CTO mandate (growth vs efficiency vs scale)."],
                ["Board/Exec Context", "Gap", "Research what exec stakeholders care about in that market."]
              ]
            : [
                ["Target Companies", "In progress", "Shortlist 15 and extract common requirement themes."],
                ["Industry Knowledge", "Gap", "Pick a niche; write 10 insights and 3 contrarian takes."]
              ]
    },
    {
      id: "interview",
      label: "Interview Readiness",
      colorRgb: "168 85 247", // Purple
      subs: isPM
        ? [
            ["Product Sense", "In progress", "Practice 2 prompts/week; write structured answers."],
            ["Execution", "Gap", "Practice prioritization and tradeoff questions under timebox."]
          ]
        : isEM
          ? [
              ["Leadership Scenarios", "In progress", "Practice conflict/feedback scenarios; document STAR answers."],
              ["System Design", "Gap", "Do 1 system design per week; review with a peer."]
            ]
          : isCTO
            ? [
                ["Exec Communication", "In progress", "Practice concise narratives for strategy, risk, and resourcing."],
                ["Org/Scale Scenarios", "Gap", "Prepare playbooks for hiring, reorgs, incidents, and pivots."]
              ]
            : [
                ["Mock Interviews", "In progress", "Run weekly mocks; record and score yourself."],
                ["Role Prompts", "Gap", "Build a prompt bank and practice under timebox."]
              ]
    },
    {
      id: "brand",
      label: "Personal Brand",
      colorRgb: "239 68 68", // Red
      subs: isPM
        ? [
            ["LinkedIn", "In progress", "Align headline/featured to PM outcomes + artifacts."],
            ["Story", "Gap", "Write your product narrative: user problem → impact → craft."]
          ]
        : isEM
          ? [
              ["Leadership Narrative", "In progress", "Clarify your leadership philosophy with examples."],
              ["Manager Story", "Gap", "Write a story: team outcomes, coaching wins, and delivery impact."]
            ]
          : isCTO
            ? [
                ["Executive Presence", "In progress", "Clarify your operating principles and decision framework."],
                ["Vision", "Gap", "Write a crisp tech vision tied to business outcomes."]
              ]
            : [
                ["LinkedIn", "In progress", "Align headline + featured section to target role signals."],
                ["Story", "Gap", "Write your story: who you help, how, proof, and what you want next."]
              ]
    },
    {
      id: "gaps",
      label: "Experience Gaps",
      colorRgb: "249 115 22", // Orange
      subs: isPM
        ? [
            ["Cross-functional Leadership", "Gap", "Lead a small initiative across design/eng; track outcomes."],
            ["Go-to-market Thinking", "In progress", "Draft positioning + launch plan for a sample feature."]
          ]
        : isEM
          ? [
              ["Scope & Ownership", "Gap", "Own a multi-sprint initiative with clear outcomes and ownership."],
              ["Hiring/Performance", "In progress", "Practice interview loops; calibrate a rubric and feedback."]
            ]
          : isCTO
            ? [
                ["Capital Allocation", "Gap", "Practice resourcing tradeoffs across bets; justify with metrics."],
                ["Risk Management", "In progress", "Create an incident/risk register and review cadence."]
              ]
            : [
                ["Scope & Ownership", "Gap", "Lead one end-to-end slice with clear outcomes and ownership."],
                ["Decision Making", "In progress", "Log decisions + tradeoffs; review outcomes weekly."]
              ]
    },
    {
      id: "network",
      label: "Network",
      colorRgb: "234 179 8", // Yellow
      subs: isPM
        ? [
            ["PM Mentors", "Gap", "Identify 2 PM mentors; set monthly feedback checkpoints."],
            ["Peers", "In progress", "Join a PM peer group; share progress biweekly."]
          ]
        : isEM
          ? [
              ["EM Mentors", "Gap", "Find 2 EM mentors; review people/exec scenarios monthly."],
              ["Peers", "In progress", "Join an EM community; trade playbooks biweekly."]
            ]
          : isCTO
            ? [
                ["Exec Mentors", "Gap", "Find 1–2 exec mentors; review strategy/org decisions monthly."],
                ["Operator Peers", "In progress", "Join a CTO/operator circle; share metrics and lessons."]
              ]
            : [
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
      id: `${c.id}_${roleId}_sub_${idx}`,
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

        {!isSub && <span className={cn("relative z-[1] grid place-items-center", node.kind === "you" ? "text-white" : "text-white/90")}>{icon}</span>}

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

function MindMapCanvas3Layer(props: { selectedRole: RolePlan; fadeMs: number }) {
  const { selectedRole, fadeMs } = props;

  const reducedMotion = usePrefersReducedMotion();
  const ref = React.useRef<HTMLDivElement | null>(null);

  const [size, setSize] = React.useState({ w: 1000, h: 640 });

  const categories = React.useMemo(() => buildCategoriesForRole({ roleTitle: selectedRole.title, roleId: selectedRole.roleId }), [selectedRole.roleId, selectedRole.title]);
  const [expanded, setExpanded] = React.useState<Set<string>>(() => new Set());

  const [hoveredId, setHoveredId] = React.useState<string | null>(null);
  const [cursor, setCursor] = React.useState<{ x: number; y: number } | null>(null);

  // Fade transition when switching roles (and reset expanded/hover state so nodes match the new role immediately).
  const [phase, setPhase] = React.useState<"in" | "out">("in");
  React.useEffect(() => {
    if (reducedMotion) {
      setExpanded(new Set());
      setHoveredId(null);
      setCursor(null);
      setPhase("in");
      return;
    }

    setPhase("out");
    const t1 = window.setTimeout(() => {
      setExpanded(new Set());
      setHoveredId(null);
      setCursor(null);
      setPhase("in");
    }, Math.max(0, Math.floor(fadeMs / 2)));

    return () => window.clearTimeout(t1);
  }, [selectedRole.roleId, reducedMotion, fadeMs]);

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
        background: "radial-gradient(circle at 45% 40%, rgba(15, 35, 70, 0.68), rgba(7, 11, 20, 1) 68%)",
        opacity: phase === "out" ? 0 : 1,
        transition: reducedMotion ? undefined : `opacity ${fadeMs}ms ease`
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

          return <path key={e.id} d={d} fill="none" stroke={stroke} strokeWidth={strokeWidth} opacity={opacity} filter="url(#mm-curve-glow)" strokeLinecap="round" />;
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

        <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white/75 backdrop-blur">
          Target Role: <span className="font-bold text-white/90">{selectedRole.title}</span>
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
   * - Pathway: redesigned career journey timeline (NOW → NEAR → NEXT) with per-stage counters and top progress ring.
   */
  const router = useRouter();

  const [tab, setTab] = React.useState<RoadmapTab>("mindMap");
  const [cartRoleIds, setCartRoleIds] = React.useState<string[]>([]);
  const [plans, setPlans] = React.useState<RolePlan[]>([]);
  const [selectedRole, setSelectedRole] = React.useState<string | null>(null);

  React.useEffect(() => {
    const ids = safeParseStringArray(window.localStorage.getItem(ROLE_CART_KEY));
    setCartRoleIds(ids);

    const restored = loadRoadmapState();
    const restoredPlansById = new Map<string, RolePlan>((restored.plans ?? []).map((p: RolePlan) => [p.roleId, p]));

    const nextPlans = ids.map((id) => restoredPlansById.get(id) ?? seedRolePlan(id));
    setPlans(nextPlans);

    const nextSelected = restored.activeRoleId && ids.includes(restored.activeRoleId) ? restored.activeRoleId : ids[0] ?? null;
    setSelectedRole(nextSelected);
  }, []);

  React.useEffect(() => {
    if (plans.length === 0) return;
    // Keep persisted key name stable for backwards compatibility.
    persistRoadmapState({ activeRoleId: selectedRole, plans });
  }, [selectedRole, plans]);

  const activePlan = React.useMemo(() => {
    if (!selectedRole) return null;
    return plans.find((p) => p.roleId === selectedRole) ?? null;
  }, [plans, selectedRole]);

  const addMilestone = React.useCallback(() => {
    if (!activePlan) return;
    // For the redesigned UI, a new milestone defaults into NOW.
    const m: Milestone = {
      id: uid("m"),
      title: "New milestone",
      date: todayISO(),
      description: "",
      status: "Not started",
      tags: ["Skill Development"],
      stage: "now"
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
              <Card title="Selected roles" description="Pick a role to view its roadmap. The Mind Map updates to match the selected role.">
                <div className="space-y-2">
                  {plans.map((p) => {
                    const active = p.roleId === selectedRole;
                    return (
                      <button
                        key={p.roleId}
                        type="button"
                        onClick={() => setSelectedRole(p.roleId)}
                        className={cn(
                          "w-full rounded-xl p-3 text-left ring-1 ring-inset transition-all",
                          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/35",
                          active
                            ? "bg-teal-50 ring-teal-200 shadow-[0_10px_26px_rgba(20,184,166,0.16)] translate-y-[-1px]"
                            : "bg-white ring-zinc-200 hover:ring-teal-200 hover:shadow-sm hover:translate-y-[-1px]"
                        )}
                        style={
                          active
                            ? {
                                boxShadow: "0 0 0 1px rgba(13, 148, 136, 0.30), 0 14px 30px rgba(20, 184, 166, 0.18), 0 0 22px rgba(20, 184, 166, 0.22)"
                              }
                            : undefined
                        }
                        aria-pressed={active}
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
                      const payload = { selectedRole, plans };
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
              <Card title="Mind Map — role-specific nodes" description="Switch roles on the left to regenerate the map. Click a category to expand its sub-nodes. Hover for glow + tooltips.">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <div className="text-xs font-semibold text-zinc-600">
                    Selected role: <span className="font-bold text-zinc-900">{activePlan.title}</span>
                  </div>
                  <div className="text-xs font-semibold text-zinc-600">
                    Compatibility: <span className="font-bold text-zinc-900 tabular-nums">{activePlan.compatibility}%</span>
                  </div>
                </div>
                <MindMapCanvas3Layer selectedRole={activePlan} fadeMs={400} />
              </Card>
            ) : (
              <Card title={`Pathway — ${activePlan.title}`} description="A career journey timeline across NOW → NEAR → NEXT. Completion updates automatically.">
                <PathwayCareerTimeline
                  planTitle={activePlan.title}
                  milestones={activePlan.milestones}
                  onToggleDone={(milestoneId, done) => {
                    updateMilestone(milestoneId, { status: done ? "Done" : "Not started" });
                  }}
                />

                <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <Button variant="secondary" onClick={() => setTab("mindMap")}>
                    Back to Mind Map
                  </Button>

                  <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                    <Button variant="secondary" onClick={addMilestone}>
                      Add milestone
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
                </div>

                {/* Kept for parity with previous behavior; delete action still exists in state layer for future UI controls */}
                <div className="sr-only" aria-hidden="true">
                  <button onClick={() => deleteMilestone("noop")} />
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
