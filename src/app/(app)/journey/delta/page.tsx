"use client";

import * as React from "react";
import Link from "next/link";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";

type Category = "Skills" | "Competencies" | "Experiences";

type Gap = {
  id: string;
  title: string;
  severity: number; // 0-100
  why: string;
  category: Category;
};

function severityLabel(v: number) {
  if (v >= 80) return "High";
  if (v >= 50) return "Medium";
  return "Low";
}

export default function DeltaStepPage() {
  const [hasDestination] = React.useState(true); // placeholder; would come from app state later
  const [category, setCategory] = React.useState<Category>("Skills");
  const [showAll, setShowAll] = React.useState(false);

  const gaps: Gap[] = [
    { id: "g1", title: "Product strategy framing", severity: 78, why: "Needed to define outcomes + tradeoffs.", category: "Competencies" },
    { id: "g2", title: "Stakeholder management", severity: 64, why: "Core for cross-functional alignment.", category: "Competencies" },
    { id: "g3", title: "Metrics & experimentation", severity: 52, why: "Required to validate direction with data.", category: "Skills" },
    { id: "g4", title: "User research synthesis", severity: 48, why: "Improves problem clarity and prioritization.", category: "Skills" },
    { id: "g5", title: "Owning a roadmap narrative", severity: 44, why: "Helps communicate sequencing + impact.", category: "Competencies" },
    { id: "g6", title: "Leading discovery workshops", severity: 55, why: "Creates shared understanding quickly.", category: "Experiences" },
    { id: "g7", title: "Shipping an A/B test", severity: 60, why: "Evidence of experimentation practice.", category: "Experiences" }
  ];

  if (!hasDestination) {
    return (
      <div>
        <PageHeader
          title="Step 5 — Gap Analysis (Delta)"
          subtitle="See the highest-impact gaps to reach your destination."
        />
        <EmptyState
          title="No destination selected"
          description="Pick a destination role to compute your personalized Delta."
          action={
            <Button>
              <Link href="/journey/destination">Choose destination</Link>
            </Button>
          }
        />
      </div>
    );
  }

  const filtered = gaps.filter((g) => g.category === category);
  const visible = showAll ? filtered : filtered.slice(0, 5);

  return (
    <div>
      <PageHeader
        title="Step 5 — Gap Analysis (Delta)"
        subtitle="A prioritized punch list — top gaps first."
        actions={
          <Button>
            <Link href="/journey/roadmap">Continue</Link>
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <section className="lg:col-span-8">
          <Card
            title="Top gaps"
            description="Start with the top 5, then expand when you’re ready."
            actions={
              <div className="flex gap-2">
                {(["Skills", "Competencies", "Experiences"] as const).map((c) => (
                  <button
                    key={c}
                    type="button"
                    className={[
                      "rounded-full px-3 py-1.5 text-sm ring-1 ring-inset transition-colors",
                      c === category
                        ? "bg-teal-50 text-teal-800 ring-teal-100"
                        : "bg-white text-zinc-700 ring-zinc-200 hover:bg-zinc-50"
                    ].join(" ")}
                    onClick={() => {
                      setCategory(c);
                      setShowAll(false);
                    }}
                  >
                    {c}
                  </button>
                ))}
              </div>
            }
          >
            <ul className="space-y-3">
              {visible.map((g) => (
                <li key={g.id} className="rounded-lg bg-zinc-50 p-3 ring-1 ring-inset ring-zinc-200">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-zinc-900">{g.title}</p>
                      <p className="mt-1 text-sm text-zinc-700">{g.why}</p>
                      <p className="mt-1 text-xs text-zinc-500">Why it matters: {g.why}</p>
                    </div>
                    <span className="shrink-0 text-xs font-medium text-zinc-600">
                      {severityLabel(g.severity)}
                    </span>
                  </div>

                  <div className="mt-3 h-2 w-full rounded-full bg-zinc-200">
                    <div
                      className="h-2 rounded-full bg-teal-600"
                      style={{ width: `${g.severity}%` }}
                      aria-hidden="true"
                    />
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button size="sm" variant="secondary">
                      View details (stub)
                    </Button>
                    <Button size="sm">
                      <Link href="/journey/marketplace">Get opportunities</Link>
                    </Button>
                  </div>
                </li>
              ))}
            </ul>

            <div className="mt-4 flex justify-end">
              <Button variant="ghost" onClick={() => setShowAll((v) => !v)}>
                {showAll ? "Show top 5" : "Show more"}
              </Button>
            </div>
          </Card>
        </section>

        <aside className="lg:col-span-4">
          <Card title="Current vs Target (placeholder)" description="Keep visuals simple and clear.">
            <div className="space-y-3 text-sm text-zinc-700">
              <p>Example: severity reflects distance to target for your destination role.</p>
              <div className="rounded-lg bg-teal-50 p-3 text-sm text-teal-800 ring-1 ring-inset ring-teal-100">
                MVP visual: severity bar + “why it matters” one-liner.
              </div>
              <Button variant="ghost">
                <Link href="/journey">Back to journey</Link>
              </Button>
            </div>
          </Card>
        </aside>
      </div>
    </div>
  );
}
