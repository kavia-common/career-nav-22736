"use client";

import * as React from "react";
import Link from "next/link";
import { MultiverseHeading } from "@/components/layout/MultiverseHeading";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/cn";

type MilestoneStatus = "Not started" | "In progress" | "Done";

type Milestone = {
  id: string;
  title: string;
  date: string;
  description: string;
  status: MilestoneStatus;
  tags?: string[];
  stage?: "now" | "near" | "next";
};

type RolePlan = {
  roleId: string;
  title: string;
  industry: string;
  compatibility: number;
  deltas: Array<{
    id: string;
    skill: string;
    current: number;
    target: number;
  }>;
  milestones: Milestone[];
};

type RoadmapState = {
  activeRoleId: string | null;
  plans: RolePlan[];
};

type OpportunityType = "Course" | "Internship" | "Project" | "Mentorship" | "Certification";

type Opportunity = {
  id: string;
  title: string;
  provider: string;
  type: OpportunityType;
  skills: string[];
  rating: number; // 0..5
  duration: string;
  // If present, the opportunity is explicitly connected to a roadmap milestone title.
  milestoneSupported?: string;
  // If present, this is a "skill gap" resource.
  skillGap?: string;
  // A recommendation line/badge for the card.
  badge?: string;
  // Placeholder deep link.
  href?: string;
  // A match score shown as a badge (e.g., "85% Career Match")
  matchPercent?: number;
};

const ROADMAP_STATE_KEY = "cn_roadmap_state_v1";

/**
 * We purposely keep Marketplace "read-only / recommendation-focused" for this task:
 * - It derives the selected role + roadmap progress from localStorage placeholders.
 * - It does NOT include any "Add to Roadmap" actions.
 * - CTA buttons are informational (View/Open).
 */

function safeParseRoadmapState(raw: string | null): RoadmapState | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as RoadmapState;
    if (!parsed || typeof parsed !== "object") return null;
    const plans = Array.isArray((parsed as any).plans) ? ((parsed as any).plans as RolePlan[]) : [];
    const activeRoleId = typeof (parsed as any).activeRoleId === "string" ? ((parsed as any).activeRoleId as string) : null;
    return { activeRoleId, plans };
  } catch {
    return null;
  }
}

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

function completionSummary(milestones: Milestone[]) {
  const total = milestones.length;
  const done = milestones.filter((m) => m.status === "Done").length;
  const inProgress = milestones.filter((m) => m.status === "In progress").length;
  const notStarted = milestones.filter((m) => m.status === "Not started").length;
  return { total, done, inProgress, notStarted };
}

function countSkillGapsFromDeltas(deltas: RolePlan["deltas"]) {
  // Placeholder heuristic:
  // - Completed: current >= target
  // - In progress: current < target and current > 0
  // - Missing: current === 0 (or very low) and target > 0
  let completed = 0;
  let inProgress = 0;
  let missing = 0;

  for (const d of deltas) {
    const cur = clamp(d.current ?? 0, 0, 5);
    const tgt = clamp(d.target ?? 0, 0, 5);
    if (tgt <= 0) continue;
    if (cur >= tgt) completed += 1;
    else if (cur > 0) inProgress += 1;
    else missing += 1;
  }

  return { completed, inProgress, missing };
}

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

function BadgePill(props: { tone?: "teal" | "slate" | "amber"; children: React.ReactNode }) {
  const { tone = "slate", children } = props;
  const toneCls =
    tone === "teal"
      ? "bg-teal-50 text-teal-800 ring-teal-200"
      : tone === "amber"
        ? "bg-amber-50 text-amber-900 ring-amber-200"
        : "bg-zinc-50 text-zinc-700 ring-zinc-200";

  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset", toneCls)}>
      {children}
    </span>
  );
}

function MetricCard(props: { label: string; value: number; tone: "teal" | "amber" | "slate"; delayMs: number }) {
  const { label, value, tone, delayMs } = props;
  return (
    <div
      className={cn(
        "cn-mp-card group relative overflow-hidden rounded-2xl bg-white p-4 ring-1 ring-inset ring-zinc-200",
        "transition-all duration-200",
        "hover:-translate-y-[2px] hover:shadow-[0_18px_40px_rgba(13,148,136,0.16)] hover:ring-teal-200"
      )}
      style={{ ["--cn-mp-stagger" as any]: `${delayMs}ms` }}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-200 group-hover:opacity-100"
        style={{
          background:
            "radial-gradient(circle at 25% 20%, rgba(20, 184, 166, 0.16), transparent 55%), radial-gradient(circle at 80% 60%, rgba(59, 130, 246, 0.10), transparent 58%)"
        }}
      />
      <div className="relative">
        <div className="text-xs font-semibold text-zinc-600">{label}</div>
        <div className="mt-2 flex items-end justify-between gap-3">
          <div className="text-2xl font-extrabold tracking-tight text-zinc-900 tabular-nums">{value}</div>
          <BadgePill tone={tone}>{tone === "teal" ? "Completed" : tone === "amber" ? "In progress" : "Missing"}</BadgePill>
        </div>
      </div>
    </div>
  );
}

function OpportunityCard(props: { o: Opportunity; delayMs: number }) {
  const { o, delayMs } = props;

  const typeIcon =
    o.type === "Course" ? "🎓" : o.type === "Internship" ? "🧑‍💼" : o.type === "Project" ? "🧩" : o.type === "Mentorship" ? "🤝" : "📜";

  return (
    <article
      className={cn(
        "cn-mp-card group relative overflow-hidden rounded-2xl bg-white p-4 ring-1 ring-inset ring-zinc-200",
        "transition-all duration-200",
        "hover:-translate-y-[2px] hover:shadow-[0_18px_44px_rgba(13,148,136,0.16)] hover:ring-teal-200"
      )}
      style={{ ["--cn-mp-stagger" as any]: `${delayMs}ms` }}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-200 group-hover:opacity-100"
        style={{
          background:
            "radial-gradient(circle at 22% 18%, rgba(20, 184, 166, 0.14), transparent 55%), radial-gradient(circle at 82% 62%, rgba(59, 130, 246, 0.10), transparent 58%)"
        }}
      />

      <header className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-teal-50 text-base ring-1 ring-inset ring-teal-100" aria-hidden="true">
              {typeIcon}
            </span>
            {o.badge && <BadgePill tone="teal">{o.badge}</BadgePill>}
            {typeof o.matchPercent === "number" && <BadgePill tone="amber">{clamp(Math.round(o.matchPercent), 0, 100)}% Career Match</BadgePill>}
          </div>

          <h3 className="mt-3 truncate text-sm font-extrabold text-zinc-900" title={o.title}>
            {o.title}
          </h3>
          <p className="mt-1 text-sm text-zinc-600">
            Provider: <span className="font-semibold text-zinc-800">{o.provider}</span> • {o.type}
          </p>
        </div>

        <div className="shrink-0 text-right">
          <div className="text-xs font-semibold text-zinc-500">Rating</div>
          <div className="mt-1 text-sm font-bold text-zinc-900 tabular-nums">{o.rating.toFixed(1)}</div>
          <div className="mt-1 text-xs font-semibold text-zinc-500">{o.duration}</div>
        </div>
      </header>

      <div className="relative mt-3 flex flex-wrap gap-2">
        {o.skills.slice(0, 5).map((s) => (
          <span
            key={s}
            className={cn(
              "inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold",
              "bg-zinc-50 text-zinc-700 ring-1 ring-inset ring-zinc-200",
              "transition-colors duration-200 group-hover:bg-teal-50 group-hover:text-teal-800 group-hover:ring-teal-200"
            )}
          >
            {s}
          </span>
        ))}
      </div>

      {(o.milestoneSupported || o.skillGap) && (
        <div className="relative mt-3 rounded-xl bg-zinc-50 p-3 ring-1 ring-inset ring-zinc-200">
          {o.milestoneSupported && (
            <div className="text-xs font-semibold text-zinc-600">
              Milestone supported: <span className="font-bold text-zinc-900">{o.milestoneSupported}</span>
            </div>
          )}
          {o.skillGap && (
            <div className={cn("mt-1 inline-flex items-center gap-2 text-xs font-semibold text-zinc-700")}>
              <span className="inline-flex items-center rounded-full bg-rose-50 px-2 py-0.5 text-[11px] font-bold text-rose-700 ring-1 ring-inset ring-rose-200">
                Skill Gap: {o.skillGap}
              </span>
            </div>
          )}
        </div>
      )}

      <footer className="relative mt-4 flex items-center justify-between gap-2">
        <Button
          size="sm"
          variant="secondary"
          className={cn(
            "transition-all duration-200",
            "group-hover:shadow-[0_14px_26px_rgba(20,184,166,0.18)] group-hover:-translate-y-[1px]"
          )}
          onClick={() => {
            // Placeholder action for MVP: informational-only.
            window.alert(`Opening: ${o.title}\n\nThis is a placeholder action (no Add-to-Roadmap in Marketplace).`);
          }}
        >
          View details
        </Button>

        {o.href ? (
          <Link
            href={o.href}
            className={cn(
              "text-xs font-semibold text-teal-700 hover:text-teal-900",
              "transition-colors duration-200"
            )}
          >
            Open →
          </Link>
        ) : (
          <span className="text-xs font-semibold text-zinc-400">AI-curated</span>
        )}
      </footer>
    </article>
  );
}

// PUBLIC_INTERFACE
export default function MarketplaceJourneyPage() {
  /**
   * Marketplace (Journey):
   * AI-powered opportunity marketplace connected to the user's selected role + roadmap progress.
   *
   * Data sources (MVP placeholders):
   * - Reads selected role and plans from localStorage key `cn_roadmap_state_v1` (written by Roadmap page).
   *
   * UX requirements:
   * - Sections fade in sequentially on page load
   * - Cards lift + glow on hover (200–300ms)
   * - Cards animate upward with staggered delays
   *
   * IMPORTANT: Per requirement, this page must NOT include an "Add to Roadmap" button.
   */
  const reducedMotion = usePrefersReducedMotion();

  const [activePlan, setActivePlan] = React.useState<RolePlan | null>(null);
  const [progress, setProgress] = React.useState<{ completed: number; inProgress: number; missing: number }>({ completed: 0, inProgress: 0, missing: 0 });
  const [milestoneTitles, setMilestoneTitles] = React.useState<string[]>([]);
  const [missingSkills, setMissingSkills] = React.useState<string[]>([]);

  // Staged load for sequential section reveal
  const [phase, setPhase] = React.useState(0);

  React.useEffect(() => {
    const parsed = safeParseRoadmapState(window.localStorage.getItem(ROADMAP_STATE_KEY));
    if (!parsed || !parsed.plans || parsed.plans.length === 0) {
      setActivePlan(null);
      return;
    }

    const plan = parsed.activeRoleId ? parsed.plans.find((p) => p.roleId === parsed.activeRoleId) ?? parsed.plans[0] : parsed.plans[0];
    setActivePlan(plan);

    // Skill summary: derived from roadmap delta placeholders
    const skillSummary = countSkillGapsFromDeltas(plan.deltas ?? []);
    setProgress(skillSummary);

    // Roadmap milestones: used for roadmap-based recommendations
    const ms = Array.isArray(plan.milestones) ? plan.milestones : [];
    const sorted = [...ms].sort((a, b) => a.title.localeCompare(b.title));
    setMilestoneTitles(sorted.map((m) => m.title));

    // Missing skills: "Skill Gap Resources" derived from deltas where current === 0 and target > 0 (heuristic)
    const gaps = (plan.deltas ?? [])
      .filter((d) => (d.target ?? 0) > 0 && (d.current ?? 0) <= 0)
      .map((d) => d.skill)
      .filter(Boolean);
    setMissingSkills(gaps.length ? gaps : ["Metrics & experimentation", "Stakeholder alignment"]); // reasonable fallback
  }, []);

  React.useEffect(() => {
    if (reducedMotion) {
      setPhase(5);
      return;
    }
    setPhase(0);
    const timers: number[] = [];
    // sequential fades (top -> bottom)
    timers.push(window.setTimeout(() => setPhase(1), 60));
    timers.push(window.setTimeout(() => setPhase(2), 200));
    timers.push(window.setTimeout(() => setPhase(3), 340));
    timers.push(window.setTimeout(() => setPhase(4), 480));
    timers.push(window.setTimeout(() => setPhase(5), 620));
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, [reducedMotion]);

  const roleTitle = activePlan?.title ?? "Select a role in Roadmap";
  const roadmapMilestones = milestoneTitles.length ? milestoneTitles : ["Build role-relevant proof project", "Deepen a core competency to advanced level", "Target role alignment: map requirements to your evidence"];

  const recommendedForRoadmap: Opportunity[] = [
    {
      id: "rr1",
      title: "React Bootcamp (AI roadmap pick)",
      provider: "Coursera (placeholder)",
      type: "Course",
      skills: ["React", "Frontend", "Components", "Testing"],
      rating: 4.8,
      duration: "3 months",
      milestoneSupported: roadmapMilestones[0],
      badge: "Recommended for your Roadmap",
      matchPercent: 88
    },
    {
      id: "rr2",
      title: "Ship 3 portfolio projects (guided sprint)",
      provider: "Project Studio",
      type: "Project",
      skills: ["Portfolio", "Execution", "Storytelling"],
      rating: 4.7,
      duration: "4 weeks",
      milestoneSupported: roadmapMilestones[1],
      badge: "Recommended for your Roadmap",
      matchPercent: 84
    },
    {
      id: "rr3",
      title: "Mentor session: role alignment + narrative",
      provider: "Mentor Network",
      type: "Mentorship",
      skills: ["Interview readiness", "Narrative", "Positioning"],
      rating: 4.9,
      duration: "60 min",
      milestoneSupported: roadmapMilestones[2],
      badge: "Recommended for your Roadmap",
      matchPercent: 90
    }
  ];

  const skillGapResources: Opportunity[] = missingSkills.slice(0, 3).flatMap((gap, idx) => {
    const base: Opportunity[] = [
      {
        id: `sg_${idx}_a`,
        title: `${gap} Fundamentals`,
        provider: "Skill Academy",
        type: "Course",
        skills: [gap, "Foundations"],
        rating: 4.6,
        duration: "2 weeks",
        skillGap: gap,
        badge: "Close your skill gaps",
        matchPercent: 80
      },
      {
        id: `sg_${idx}_b`,
        title: `Hands-on Lab: ${gap}`,
        provider: "Lab Platform",
        type: "Project",
        skills: [gap, "Hands-on", "Practice"],
        rating: 4.7,
        duration: "3–5 hours",
        skillGap: gap,
        badge: "Close your skill gaps",
        matchPercent: 78
      }
    ];
    return base;
  });

  const exploreAll: Opportunity[] = [
    {
      id: "ex1",
      title: "Career Accelerator: Modern Frontend Systems",
      provider: "Academy",
      type: "Course",
      skills: ["Frontend", "Architecture", "Performance"],
      rating: 4.7,
      duration: "6 weeks",
      badge: "AI-curated",
      matchPercent: 76
    },
    {
      id: "ex2",
      title: "Internship: Product Analytics (remote)",
      provider: "Startup (placeholder)",
      type: "Internship",
      skills: ["Analytics", "SQL", "Experimentation"],
      rating: 4.4,
      duration: "10 weeks",
      badge: "AI-curated",
      matchPercent: 72
    },
    {
      id: "ex3",
      title: "Mentorship: Weekly coaching for role transitions",
      provider: "Mentor Network",
      type: "Mentorship",
      skills: ["Leadership", "Career strategy", "Communication"],
      rating: 4.9,
      duration: "4 sessions",
      badge: "AI-curated",
      matchPercent: 83
    },
    {
      id: "ex4",
      title: "Certification: Cloud Foundations",
      provider: "Cloud Provider",
      type: "Certification",
      skills: ["Cloud", "Architecture", "Ops basics"],
      rating: 4.6,
      duration: "Self-paced",
      badge: "AI-curated",
      matchPercent: 70
    },
    {
      id: "ex5",
      title: "Project: Build an end-to-end case study",
      provider: "Project Studio",
      type: "Project",
      skills: ["Portfolio", "Story", "Impact metrics"],
      rating: 4.8,
      duration: "2 weeks",
      badge: "AI-curated",
      matchPercent: 81
    },
    {
      id: "ex6",
      title: "Course: Interview patterns + role-specific prompts",
      provider: "Interview Gym",
      type: "Course",
      skills: ["Interview", "Frameworks", "Practice"],
      rating: 4.5,
      duration: "1 week",
      badge: "AI-curated",
      matchPercent: 74
    }
  ];

  const recommendedForYou: Opportunity[] = [
    {
      id: "rfy1",
      title: "Guided roadmap sprint: focus + momentum",
      provider: "Career OS",
      type: "Project",
      skills: ["Planning", "Execution", "Accountability"],
      rating: 4.8,
      duration: "10 days",
      badge: "Recommended for you",
      matchPercent: 86
    },
    {
      id: "rfy2",
      title: "Course: Communicating impact to stakeholders",
      provider: "Leadership Lab",
      type: "Course",
      skills: ["Stakeholders", "Communication", "Influence"],
      rating: 4.7,
      duration: "2 weeks",
      badge: "Recommended for you",
      matchPercent: 82
    },
    {
      id: "rfy3",
      title: "Mentorship: Mock interview + feedback loop",
      provider: "Mentor Network",
      type: "Mentorship",
      skills: ["Interview", "Feedback", "Confidence"],
      rating: 4.9,
      duration: "60 min",
      badge: "Recommended for you",
      matchPercent: 89
    }
  ];

  const sectionCls = (idx: number) =>
    cn(
      "transition-all duration-300",
      reducedMotion ? "opacity-100 translate-y-0" : phase >= idx ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
    );

  return (
    <div className="relative">
      <MultiverseHeading
        title="Marketplace"
        subtitle="AI-powered opportunities connected to your Roadmap milestones and skill gaps."
        showAmbient={true}
        showParticles={true}
        actions={
          <div className="flex flex-wrap items-center justify-end gap-2">
            <Button variant="secondary">
              <Link href="/journey/roadmap">Back to Roadmap</Link>
            </Button>
            <Button variant="ghost">
              <Link href="/journey">Back to Journey</Link>
            </Button>
          </div>
        }
      />

      {/* Career Context */}
      <section className={cn(sectionCls(1))} aria-label="Career context">
        <Card
          title={
            <div className="flex flex-col gap-1">
              <div className="text-xs font-semibold text-zinc-500">Your Career Goal</div>
              <div className="text-lg font-extrabold tracking-tight text-zinc-900">{roleTitle}</div>
            </div>
          }
          description="This marketplace adapts recommendations based on your Roadmap and identified skill gaps (local placeholder data)."
          className="cn-mp-section"
        >
          <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <MetricCard label="Skills Completed" value={progress.completed} tone="teal" delayMs={60} />
            <MetricCard label="Skills In Progress" value={progress.inProgress} tone="amber" delayMs={120} />
            <MetricCard label="Skills Missing" value={progress.missing} tone="slate" delayMs={180} />
          </div>

          {!activePlan && (
            <div className="mt-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-900 ring-1 ring-inset ring-amber-200">
              No roadmap found. Visit <Link className="font-semibold underline" href="/journey/roadmap">Roadmap</Link> to select a role and generate milestones.
            </div>
          )}
        </Card>
      </section>

      {/* Recommended for your Roadmap */}
      <section className={cn("mt-4", sectionCls(2))} aria-label="Roadmap-based recommendations">
        <Card
          title="Recommended for your Roadmap"
          description="Opportunities that help you complete your current roadmap milestones."
          className="cn-mp-section"
          actions={<BadgePill tone="teal">AI Recommendations</BadgePill>}
        >
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
            {recommendedForRoadmap.map((o, i) => (
              <OpportunityCard key={o.id} o={o} delayMs={80 + i * 70} />
            ))}
          </div>
        </Card>
      </section>

      {/* Close Your Skill Gaps */}
      <section className={cn("mt-4", sectionCls(3))} aria-label="Skill gap resources">
        <Card
          title="Close Your Skill Gaps"
          description="Resources mapped to skills missing in your roadmap/analysis (placeholder heuristic)."
          className="cn-mp-section"
        >
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
            {skillGapResources.map((o, i) => (
              <OpportunityCard key={o.id} o={o} delayMs={60 + i * 55} />
            ))}
          </div>
        </Card>
      </section>

      {/* Explore All Opportunities */}
      <section className={cn("mt-4", sectionCls(4))} aria-label="Explore all opportunities">
        <Card
          title="Explore All Opportunities"
          description="Browse courses, internships, projects, mentorship, and certifications."
          className="cn-mp-section"
        >
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {exploreAll.map((o, i) => (
              <OpportunityCard key={o.id} o={o} delayMs={40 + i * 45} />
            ))}
          </div>
        </Card>
      </section>

      {/* Recommended For You */}
      <section className={cn("mt-4", sectionCls(5))} aria-label="Recommended for you">
        <Card
          title="Recommended For You"
          description="Personalized picks based on your progress and roadmap context (placeholder)."
          className="cn-mp-section"
        >
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
            {recommendedForYou.map((o, i) => (
              <OpportunityCard key={o.id} o={o} delayMs={70 + i * 65} />
            ))}
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <Button>
              <Link href="/dashboard">Go to dashboard</Link>
            </Button>
            <Button variant="secondary">
              <Link href="/journey/roadmap">Review roadmap</Link>
            </Button>
          </div>

          <p className="mt-4 text-xs text-zinc-500">
            Note: Recommendations are local/placeholder (stored in your browser). This page is intentionally recommendation-focused and does not support “Add to Roadmap”.
          </p>
        </Card>
      </section>

      <style jsx>{`
        /* Premium entrance: stagger each card via CSS variable */
        .cn-mp-card {
          opacity: 0;
          transform: translateY(10px);
          animation: cn-mp-card-in 520ms cubic-bezier(0.22, 1, 0.36, 1) both;
          animation-delay: var(--cn-mp-stagger, 0ms);
        }

        .cn-mp-section :global(.cn-mp-card) {
          /* keep specificity predictable inside Card */
        }

        @keyframes cn-mp-card-in {
          0% {
            opacity: 0;
            transform: translateY(10px);
            filter: blur(1px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
            filter: blur(0);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .cn-mp-card {
            animation: none !important;
            opacity: 1 !important;
            transform: none !important;
            filter: none !important;
          }
        }
      `}</style>
    </div>
  );
}
