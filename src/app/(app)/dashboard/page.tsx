"use client";

import * as React from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { StatCard } from "@/components/ui/StatCard";

type DashboardData = {
  profileCompleteness: number;
  currentRole: string | null;
  nextActions: Array<{ id: string; title: string; status: "Now" | "Near" | "Next" }>;
  topGaps: Array<{ id: string; title: string; severity: number }>;
};

function severityLabel(v: number) {
  if (v >= 80) return "High";
  if (v >= 50) return "Medium";
  return "Low";
}

export default function DashboardPage() {
  const [isLoading, setIsLoading] = React.useState(true);
  const [data, setData] = React.useState<DashboardData | null>(null);

  React.useEffect(() => {
    const t = setTimeout(() => {
      setData({
        profileCompleteness: 62,
        currentRole: "Software Engineer",
        nextActions: [
          { id: "a1", title: "Confirm top 10 skills in your profile baseline", status: "Now" },
          { id: "a2", title: "Upload a recent resume version", status: "Now" },
          { id: "a3", title: "Start a skill validation session", status: "Near" }
        ],
        topGaps: [
          { id: "g1", title: "Product strategy framing", severity: 78 },
          { id: "g2", title: "Stakeholder management", severity: 64 },
          { id: "g3", title: "Metrics & experimentation", severity: 52 }
        ]
      });
      setIsLoading(false);
    }, 700);

    return () => clearTimeout(t);
  }, []);

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle="Your career snapshot and next best actions."
        actions={
          <Button variant="secondary">
            {/* Guided first-run experience */}
            <a href="/profile">Continue</a>
          </Button>
        }
      />

      {isLoading && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
          <div className="lg:col-span-8">
            <Skeleton className="h-28 w-full" />
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
              <Skeleton className="h-56 w-full" />
              <Skeleton className="h-56 w-full" />
            </div>
          </div>
          <div className="lg:col-span-4">
            <Skeleton className="h-44 w-full" />
            <div className="mt-4">
              <Skeleton className="h-56 w-full" />
            </div>
          </div>
        </div>
      )}

      {!isLoading && data && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
          <section className="lg:col-span-8">
            <Card
              title="Career snapshot"
              description="Baseline state built from imported documents and your edits."
              actions={<Button size="sm">View profile</Button>}
            >
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="rounded-lg bg-zinc-50 p-3 ring-1 ring-inset ring-zinc-200">
                  <p className="text-xs text-zinc-600">Current role</p>
                  <p className="mt-1 text-sm font-semibold text-zinc-900">
                    {data.currentRole ?? "Not set"}
                  </p>
                </div>
                <div className="rounded-lg bg-zinc-50 p-3 ring-1 ring-inset ring-zinc-200">
                  <p className="text-xs text-zinc-600">Profile completeness</p>
                  <p className="mt-1 text-sm font-semibold text-zinc-900">
                    {data.profileCompleteness}%
                  </p>
                  <div className="mt-2 h-2 w-full rounded-full bg-zinc-200">
                    <div
                      className="h-2 rounded-full bg-teal-600"
                      style={{ width: `${data.profileCompleteness}%` }}
                      aria-hidden="true"
                    />
                  </div>
                </div>
                <div className="rounded-lg bg-zinc-50 p-3 ring-1 ring-inset ring-zinc-200">
                  <p className="text-xs text-zinc-600">Momentum</p>
                  <p className="mt-1 text-sm font-semibold text-zinc-900">2-day streak</p>
                  <p className="mt-1 text-xs text-zinc-500">Last activity: today</p>
                </div>
              </div>
            </Card>

            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <StatCard label="Validated strengths" value="3" hint="Placeholder" />
              <StatCard label="Open gaps" value="12" hint="Placeholder" />
              <StatCard label="Roadmap items" value="9" hint="Placeholder" />
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
              <Card title="Next best actions" description="Pulled from your Roadmap (Now/Near/Next).">
                {data.nextActions.length === 0 ? (
                  <EmptyState
                    title="No actions yet"
                    description="Complete onboarding to generate a roadmap."
                    action={<Button>Go to onboarding</Button>}
                  />
                ) : (
                  <ul className="space-y-3">
                    {data.nextActions.map((a) => (
                      <li
                        key={a.id}
                        className="flex items-start justify-between gap-3 rounded-lg bg-zinc-50 p-3 ring-1 ring-inset ring-zinc-200"
                      >
                        <div>
                          <p className="text-sm font-medium text-zinc-900">{a.title}</p>
                          <p className="mt-1 text-xs text-zinc-500">Horizon: {a.status}</p>
                        </div>
                        <Button size="sm" variant="secondary">
                          Open
                        </Button>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>

              <Card title="Marketplace recommendations" description="Opportunities mapped to your biggest gaps.">
                <div className="space-y-3">
                  {["Course: Product Analytics", "Mentor: PM Leadership", "Project: Ship an A/B test"].map(
                    (x) => (
                      <div
                        key={x}
                        className="flex items-start justify-between gap-3 rounded-lg bg-white p-3 ring-1 ring-inset ring-zinc-200"
                      >
                        <div>
                          <p className="text-sm font-medium text-zinc-900">{x}</p>
                          <p className="mt-1 text-xs text-zinc-500">
                            Closes: Metrics & experimentation
                          </p>
                        </div>
                        <Button size="sm" variant="ghost">
                          View
                        </Button>
                      </div>
                    )
                  )}
                </div>
              </Card>
            </div>
          </section>

          <aside className="lg:col-span-4">
            <Card title="Multiverse preview" description="Possible futures based on your baseline.">
              <div className="space-y-2">
                {["Product Manager", "Engineering Manager", "Solutions Architect", "Founder (early stage)"].map(
                  (r) => (
                    <div
                      key={r}
                      className="flex items-center justify-between gap-3 rounded-lg bg-zinc-50 p-3 ring-1 ring-inset ring-zinc-200"
                    >
                      <p className="text-sm font-medium text-zinc-900">{r}</p>
                      <span className="text-xs text-zinc-500">~18 mo</span>
                    </div>
                  )
                )}
              </div>
            </Card>

            <div className="mt-4">
              <Card title="Delta summary" description="Top gaps to reach your destination (placeholder).">
                {data.topGaps.length === 0 ? (
                  <EmptyState
                    title="No delta computed"
                    description="Set a destination and confirm your baseline."
                    action={<Button>Set destination</Button>}
                  />
                ) : (
                  <ul className="space-y-3">
                    {data.topGaps.map((g) => (
                      <li key={g.id} className="rounded-lg bg-zinc-50 p-3 ring-1 ring-inset ring-zinc-200">
                        <div className="flex items-start justify-between gap-3">
                          <p className="text-sm font-medium text-zinc-900">{g.title}</p>
                          <span className="text-xs font-medium text-zinc-600">
                            {severityLabel(g.severity)}
                          </span>
                        </div>
                        <div className="mt-2 h-2 w-full rounded-full bg-zinc-200">
                          <div
                            className="h-2 rounded-full bg-teal-600"
                            style={{ width: `${g.severity}%` }}
                            aria-hidden="true"
                          />
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
