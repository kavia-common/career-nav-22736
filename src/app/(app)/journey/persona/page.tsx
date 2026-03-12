"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ProgressStepper, type Step } from "@/components/ui/ProgressStepper";

const TOP_STEPS: Step[] = [
  {
    id: "upload",
    title: "Upload",
    description: "Add docs + connect LinkedIn.",
    status: "current"
  },
  {
    id: "analysis",
    title: "AI analysis",
    description: "Extract experience, skills, and highlights.",
    status: "upcoming"
  },
  {
    id: "review",
    title: "Draft persona",
    description: "Review, edit, confirm.",
    status: "upcoming"
  }
];

export default function PersonaIndexPage() {
  const router = useRouter();

  return (
    <div>
      <PageHeader
        title="Persona Onboarding"
        subtitle="A simplified 3-step flow: upload → AI analysis → draft persona review."
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <aside className="lg:col-span-4">
          <Card title="Journey" description="3-step persona flow (minimal).">
            <ProgressStepper steps={TOP_STEPS} />
          </Card>
        </aside>

        <section className="lg:col-span-8">
          <Card
            title="Step 1: Build Persona"
            description="Upload professional documents and optionally connect LinkedIn."
            actions={
              <Button onClick={() => router.push("/journey/build-profile")}>
                Start Upload
              </Button>
            }
          >
            <div className="space-y-3 text-sm text-zinc-700">
              <p>
                This flow replaces the old crowded Build Profile experience with a
                quick upload + review loop.
              </p>
              <div className="rounded-xl bg-teal-50 p-3 ring-1 ring-inset ring-teal-100">
                <p className="text-sm font-medium text-teal-900">
                  After you confirm your draft persona, you’ll continue to Skill Validation.
                </p>
              </div>
            </div>
          </Card>
        </section>
      </div>
    </div>
  );
}
