"use client";

import * as React from "react";
import Link from "next/link";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

type Lane = "Now" | "Near" | "Next";
type Status = "Not started" | "In progress" | "Done";

type RoadmapItem = {
  id: string;
  lane: Lane;
  title: string;
  nextAction: string;
  status?: Status; // only for Now
  gaps: string[];
};

function StatusChip({ value }: { value: Status }) {
  const tone =
    value === "Done"
      ? "bg-teal-50 text-teal-800 ring-teal-100"
      : value === "In progress"
        ? "bg-amber-50 text-amber-800 ring-amber-100"
        : "bg-white text-zinc-700 ring-zinc-200";

  return (
    <span className={`rounded-full px-2 py-1 text-xs font-medium ring-1 ring-inset ${tone}`}>
      {value}
    </span>
  );
}

export default function RoadmapStepPage() {
  const [items, setItems] = React.useState<RoadmapItem[]>([
    {
      id: "n1",
      lane: "Now",
      title: "Write 3 metric-first product stories",
      nextAction: "Draft one story using STAR + metric impact.",
      status: "In progress",
      gaps: ["Metrics & experimentation", "Product strategy framing"]
    },
    {
      id: "n2",
      lane: "Now",
      title: "Run 1 discovery interview (practice)",
      nextAction: "Schedule with a peer and synthesize themes.",
      status: "Not started",
      gaps: ["User research synthesis"]
    },
    {
      id: "ne1",
      lane: "Near",
      title: "Ship an A/B test end-to-end (project)",
      nextAction: "Pick a hypothesis and define success metrics.",
      gaps: ["Metrics & experimentation"]
    },
    {
      id: "x1",
      lane: "Next",
      title: "Own a product roadmap narrative (case study)",
      nextAction: "Build a portfolio artifact with sequencing rationale.",
      gaps: ["Owning a roadmap narrative", "Stakeholder management"]
    }
  ]);

  const lanes: Lane[] = ["Now", "Near", "Next"];

  const setNowStatus = (id: string, status: Status) => {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, status } : it)));
  };

  return (
    <div>
      <PageHeader
        title="Step 6 — Career Roadmap"
        subtitle="Now / Near / Next — a plan you can execute immediately."
        actions={
          <Button>
            <Link href="/journey/marketplace">Continue</Link>
          </Button>
        }
      />

      <Card
        title="Roadmap board"
        description="Each item maps to gaps. The Now lane has simple status chips."
      >
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {lanes.map((lane) => {
            const laneItems = items.filter((i) => i.lane === lane);
            return (
              <div key={lane} className="rounded-xl bg-zinc-50 p-4 ring-1 ring-inset ring-zinc-200">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-zinc-900">{lane}</p>
                  <span className="text-xs text-zinc-500">{laneItems.length} items</span>
                </div>

                <div className="space-y-3">
                  {laneItems.map((it) => (
                    <div key={it.id} className="rounded-xl bg-white p-4 ring-1 ring-inset ring-zinc-200">
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-sm font-semibold text-zinc-900">{it.title}</p>
                        {lane === "Now" && it.status && <StatusChip value={it.status} />}
                      </div>
                      <p className="mt-2 text-sm text-zinc-700">{it.nextAction}</p>

                      <div className="mt-3 flex flex-wrap gap-2">
                        {it.gaps.map((g) => (
                          <span
                            key={g}
                            className="rounded-full bg-teal-50 px-2.5 py-1 text-xs text-teal-800 ring-1 ring-inset ring-teal-100"
                          >
                            {g}
                          </span>
                        ))}
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2">
                        <Button size="sm" variant="secondary">
                          Details (stub)
                        </Button>
                        <Button size="sm">
                          <Link href="/journey/marketplace">Get opportunities</Link>
                        </Button>

                        {lane === "Now" && (
                          <div className="ml-auto flex gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setNowStatus(it.id, "Not started")}
                            >
                              Reset
                            </Button>
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => setNowStatus(it.id, "Done")}
                            >
                              Mark done
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-4 flex flex-wrap justify-end gap-2">
          <Button variant="ghost">
            <Link href="/journey">Back to journey</Link>
          </Button>
        </div>
      </Card>
    </div>
  );
}
