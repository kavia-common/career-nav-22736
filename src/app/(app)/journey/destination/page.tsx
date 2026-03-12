"use client";

import * as React from "react";
import Link from "next/link";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

type Role = {
  id: string;
  title: string;
  eta: string;
  fit: number;
  notes: string;
};

export default function DestinationStepPage() {
  const roles: Role[] = [
    { id: "pm", title: "Product Manager", eta: "~18 mo", fit: 72, notes: "Strategy + execution blend." },
    { id: "em", title: "Engineering Manager", eta: "~24 mo", fit: 64, notes: "People leadership + delivery." },
    { id: "sa", title: "Solutions Architect", eta: "~12 mo", fit: 78, notes: "Customer-facing technical depth." }
  ];

  const [destination, setDestination] = React.useState<string | null>("pm");

  return (
    <div>
      <PageHeader
        title="Step 4 — Choose Destination Role"
        subtitle="Pick one target role (you can change it later)."
        actions={
          <Button>
            <Link href="/journey/delta">Continue</Link>
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <section className="lg:col-span-7">
          <Card title="Shortlist" description="Select one destination like setting a GPS endpoint.">
            <div className="space-y-3">
              {roles.map((r) => {
                const selected = r.id === destination;
                return (
                  <button
                    key={r.id}
                    type="button"
                    className={[
                      "w-full text-left rounded-xl p-4 ring-1 ring-inset transition-colors",
                      selected
                        ? "bg-teal-50 ring-teal-100"
                        : "bg-white ring-zinc-200 hover:bg-zinc-50"
                    ].join(" ")}
                    onClick={() => setDestination(r.id)}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-zinc-900">{r.title}</p>
                        <p className="mt-1 text-xs text-zinc-500">{r.eta}</p>
                        <p className="mt-2 text-sm text-zinc-700">{r.notes}</p>
                      </div>
                      <span
                        className={[
                          "shrink-0 rounded-full px-2 py-1 text-xs font-medium ring-1 ring-inset",
                          selected
                            ? "bg-teal-50 text-teal-800 ring-teal-100"
                            : "bg-white text-zinc-700 ring-zinc-200"
                        ].join(" ")}
                      >
                        {selected ? "Destination" : "Option"}
                      </span>
                    </div>
                    <div className="mt-3 h-2 w-full rounded-full bg-zinc-200">
                      <div
                        className="h-2 rounded-full bg-teal-600"
                        style={{ width: `${r.fit}%` }}
                        aria-hidden="true"
                      />
                    </div>
                    <p className="mt-2 text-xs text-zinc-500">Fit: {r.fit}% (placeholder)</p>
                  </button>
                );
              })}
            </div>
          </Card>

          <div className="mt-4">
            <Card
              title="Compare (lightweight stub)"
              description="MVP compare stays in-page. No enterprise compare module."
            >
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {roles.map((r) => (
                  <div
                    key={r.id}
                    className="rounded-lg bg-zinc-50 p-3 ring-1 ring-inset ring-zinc-200"
                  >
                    <p className="text-sm font-semibold text-zinc-900">{r.title}</p>
                    <p className="mt-1 text-xs text-zinc-500">{r.eta}</p>
                    <p className="mt-2 text-xs text-zinc-600">Top gap: (placeholder)</p>
                    <p className="mt-1 text-xs text-zinc-600">Key strength: (placeholder)</p>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </section>

        <aside className="lg:col-span-5">
          <Card
            title="Destination locked (for now)"
            description="This powers your Delta and Roadmap."
          >
            <div className="space-y-3 text-sm text-zinc-700">
              <p>
                Selected destination:{" "}
                <span className="font-semibold text-zinc-900">
                  {roles.find((r) => r.id === destination)?.title ?? "None"}
                </span>
              </p>
              <div className="rounded-lg bg-teal-50 p-3 text-sm text-teal-800 ring-1 ring-inset ring-teal-100">
                Moment: “Destination locked for now. Continue to Delta.”
              </div>
              <div className="flex flex-wrap gap-2">
                <Button>
                  <Link href="/journey/delta">Continue to Step 5</Link>
                </Button>
                <Button variant="ghost">
                  <Link href="/journey/multiverse">Back to multiverse</Link>
                </Button>
              </div>
            </div>
          </Card>
        </aside>
      </div>
    </div>
  );
}
