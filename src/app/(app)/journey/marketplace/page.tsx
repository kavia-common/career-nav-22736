"use client";

import * as React from "react";
import Link from "next/link";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

type Opportunity = {
  id: string;
  title: string;
  type: "Course" | "Mentor" | "Project" | "Conference" | "Job";
  closesGap: string;
  saved: boolean;
};

export default function MarketplaceStepPage() {
  const [items, setItems] = React.useState<Opportunity[]>([
    { id: "o1", title: "Course: Product Analytics Foundations", type: "Course", closesGap: "Metrics & experimentation", saved: false },
    { id: "o2", title: "Mentor: PM leadership coaching", type: "Mentor", closesGap: "Stakeholder management", saved: true },
    { id: "o3", title: "Project: Ship an A/B test case study", type: "Project", closesGap: "Metrics & experimentation", saved: false },
    { id: "o4", title: "Conference: ProductCraft Summit (placeholder)", type: "Conference", closesGap: "Product strategy framing", saved: false }
  ]);

  const toggleSave = (id: string) => {
    setItems((prev) => prev.map((x) => (x.id === id ? { ...x, saved: !x.saved } : x)));
  };

  const categories = [
    { label: "Courses", hint: "Learn quickly with guided curricula." },
    { label: "Mentors", hint: "Get feedback and accountability." },
    { label: "Projects", hint: "Build evidence with hands-on outcomes." },
    { label: "Conferences", hint: "Network and stay current." },
    { label: "Jobs", hint: "Browse privately (indicator in top bar)." }
  ];

  return (
    <div>
      <PageHeader
        title="Step 7 — Growth Marketplace"
        subtitle="Curated opportunities mapped to your top gaps and roadmap items."
        actions={
          <Button variant="secondary">
            <Link href="/dashboard">Finish → Dashboard</Link>
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <section className="lg:col-span-7">
          <Card title="Recommended for you" description="Mapped to your Delta + Roadmap (placeholder).">
            <div className="space-y-3">
              {items.map((x) => (
                <div
                  key={x.id}
                  className="flex flex-col gap-3 rounded-xl bg-white p-4 ring-1 ring-inset ring-zinc-200 sm:flex-row sm:items-start sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-zinc-900">{x.title}</p>
                    <p className="mt-1 text-sm text-zinc-600">{x.type}</p>
                    <p className="mt-2 text-xs text-zinc-500">Closes gap: {x.closesGap}</p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <Button size="sm" variant="secondary" onClick={() => toggleSave(x.id)}>
                      {x.saved ? "Saved" : "Save"}
                    </Button>
                    <Button size="sm">View</Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <div className="mt-4">
            <Card title="Categories" description="Keep the marketplace curated, not overwhelming.">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {categories.map((c) => (
                  <div
                    key={c.label}
                    className="rounded-xl bg-zinc-50 p-4 ring-1 ring-inset ring-zinc-200"
                  >
                    <p className="text-sm font-semibold text-zinc-900">{c.label}</p>
                    <p className="mt-1 text-sm text-zinc-600">{c.hint}</p>
                    <div className="mt-3">
                      <Button size="sm" variant="secondary">
                        Open (stub)
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </section>

        <aside className="lg:col-span-5">
          <Card title="Saved opportunities" description="Your shortlist of growth options.">
            <div className="space-y-2">
              {items.filter((x) => x.saved).length === 0 ? (
                <div className="rounded-lg bg-zinc-50 p-3 text-sm text-zinc-700 ring-1 ring-inset ring-zinc-200">
                  Nothing saved yet. Save 1–3 opportunities to keep momentum.
                </div>
              ) : (
                items
                  .filter((x) => x.saved)
                  .map((x) => (
                    <div
                      key={x.id}
                      className="rounded-lg bg-zinc-50 p-3 ring-1 ring-inset ring-zinc-200"
                    >
                      <p className="text-sm font-medium text-zinc-900">{x.title}</p>
                      <p className="mt-1 text-xs text-zinc-500">Closes: {x.closesGap}</p>
                    </div>
                  ))
              )}
            </div>

            <div className="mt-4 rounded-lg bg-teal-50 p-3 text-sm text-teal-800 ring-1 ring-inset ring-teal-100">
              Private browsing indicator stays visible in the top bar (placeholder).
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <Button>
                <Link href="/dashboard">Go to dashboard</Link>
              </Button>
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
