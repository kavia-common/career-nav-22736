"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import {
  buildPlaceholderDraftPersona,
  getPersonaFlowState,
  setDraftPersona
} from "@/lib/personaFlow";

type AnalysisState = "running" | "done";

const ANALYSIS_STEPS = [
  "Parsing documents",
  "Extracting skills",
  "Understanding experience",
  "Generating persona"
] as const;

function AiIcon() {
  return (
    <div className="relative">
      <div className="cn-ai-pulse absolute inset-0 rounded-2xl" aria-hidden="true" />
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white ring-1 ring-inset ring-zinc-200">
        <span className="text-lg font-semibold text-teal-700" aria-hidden="true">
          AI
        </span>
      </div>
    </div>
  );
}

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="mt-4">
      <div className="h-2 w-full rounded-full bg-zinc-100 ring-1 ring-inset ring-zinc-200/70">
        <div
          className="h-2 rounded-full bg-gradient-to-r from-teal-600 to-teal-500 shadow-[0_0_14px_rgba(13,148,136,0.25)] transition-[width] duration-300"
          style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
          aria-hidden="true"
        />
      </div>
      <p className="mt-2 text-xs text-zinc-500">{value}%</p>
    </div>
  );
}

function Particles() {
  // purely decorative particles
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <span className="cn-float cn-particle left-[12%] top-[22%] h-2 w-2" />
      <span className="cn-float cn-particle left-[22%] top-[64%] h-1.5 w-1.5 [animation-delay:0.8s]" />
      <span className="cn-float cn-particle left-[48%] top-[30%] h-1.5 w-1.5 [animation-delay:1.3s]" />
      <span className="cn-float cn-particle left-[68%] top-[18%] h-2 w-2 [animation-delay:0.4s]" />
      <span className="cn-float cn-particle left-[82%] top-[52%] h-1.5 w-1.5 [animation-delay:1.0s]" />
      <span className="cn-float cn-particle left-[64%] top-[74%] h-2 w-2 [animation-delay:1.7s]" />
    </div>
  );
}

export default function PersonaAnalyzePage() {
  const router = useRouter();

  const [state, setState] = React.useState<AnalysisState>("running");
  const [activeIdx, setActiveIdx] = React.useState(0);

  React.useEffect(() => {
    // Deterministic animated steps + completion.
    const t1 = window.setInterval(() => {
      setActiveIdx((i) => (i < ANALYSIS_STEPS.length - 1 ? i + 1 : i));
    }, 850);

    const t2 = window.setTimeout(() => {
      const flow = getPersonaFlowState();
      const persona = buildPlaceholderDraftPersona({
        docs: flow.docs,
        linkedInConnected: flow.linkedInConnected
      });
      setDraftPersona(persona);
      setState("done");
    }, 3400);

    return () => {
      window.clearInterval(t1);
      window.clearTimeout(t2);
    };
  }, []);

  const progress =
    state === "done"
      ? 100
      : Math.round(((activeIdx + 0.5) / ANALYSIS_STEPS.length) * 100);

  return (
    <div>
      {/* White header area (separate from sidebar) */}
      <div className="mb-6 rounded-2xl bg-white px-6 py-6 shadow-sm ring-1 ring-inset ring-zinc-200/70">
        <PageHeader
          title="Build Your Career Persona"
          subtitle="AI is analyzing your documents to create a draft persona."
          actions={
            <Button
              variant="secondary"
              className="bg-white text-zinc-900 ring-1 ring-inset ring-zinc-200 hover:bg-zinc-50"
              onClick={() => router.push("/journey/build-profile")}
            >
              Back
            </Button>
          }
        />
      </div>

      <div className="mx-auto mt-8 w-full max-w-4xl">
        <Card
          className="rounded-2xl"
          title={state === "done" ? "Draft Persona Ready" : "Analyzing Your Career Data"}
          description={
            state === "done"
              ? "We analyzed your documents and created your draft persona."
              : "Please keep this tab open while we process your uploads."
          }
          actions={
            state === "done" ? (
              <Button onClick={() => router.push("/journey/persona/draft")}>
                View Draft Persona
              </Button>
            ) : (
              <div className="flex items-center gap-2 text-sm font-medium text-zinc-600">
                <span
                  className="h-4 w-4 animate-spin rounded-full border-2 border-teal-200 border-t-teal-700"
                  aria-hidden="true"
                />
                Working…
              </div>
            )
          }
        >
          {/* Light glassmorphism analysis container (no teal background) */}
          <div className="relative overflow-hidden rounded-2xl bg-white/70 p-6 ring-1 ring-inset ring-zinc-200/70 shadow-[0_18px_40px_rgba(15,23,42,0.08)] backdrop-blur-md">
            <Particles />
            <div className="relative">
              <div className="flex items-center gap-4">
                <AiIcon />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-zinc-900">
                    {state === "done" ? "Complete" : "Processing"}
                  </p>
                  <p className="mt-1 text-sm text-zinc-600">
                    {state === "done"
                      ? "Your persona draft is ready for review."
                      : "We’ll walk through a few short steps."}
                  </p>
                </div>
              </div>

              <div className="mt-5 space-y-3">
                {ANALYSIS_STEPS.map((label, idx) => {
                  const done = state === "done" ? true : idx < activeIdx;
                  const active = state === "running" && idx === activeIdx;

                  return (
                    <div
                      key={label}
                      className={[
                        "flex items-start gap-3 rounded-2xl p-4 ring-1 ring-inset transition-colors",
                        "bg-white/60",
                        done
                          ? "ring-teal-200/80"
                          : active
                            ? "ring-teal-300/80"
                            : "ring-zinc-200/70"
                      ].join(" ")}
                    >
                      <div className="mt-0.5">
                        {active ? (
                          <span
                            className="h-4 w-4 animate-spin rounded-full border-2 border-teal-200 border-t-teal-700"
                            aria-hidden="true"
                          />
                        ) : (
                          <span
                            className={[
                              "inline-flex h-4 w-4 items-center justify-center rounded-full ring-2 ring-inset",
                              done
                                ? "bg-teal-600 ring-teal-600 shadow-[0_0_18px_rgba(13,148,136,0.25)]"
                                : "bg-transparent ring-zinc-300"
                            ].join(" ")}
                            aria-hidden="true"
                          />
                        )}
                      </div>

                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-zinc-900">{label}</p>
                        <p className="mt-1 text-sm text-zinc-600">
                          {done ? "Done" : active ? "In progress…" : "Pending"}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-5">
                <ProgressBar value={progress} />
              </div>
            </div>
          </div>

          <div className="mt-5 rounded-2xl bg-gradient-to-b from-teal-50 to-white p-5 ring-1 ring-inset ring-teal-100">
            <p className="text-sm font-semibold text-zinc-900">What’s next?</p>
            <p className="mt-1 text-sm text-zinc-600">
              {state === "done"
                ? "Continue to review your draft persona."
                : "We’ll redirect you once processing is complete."}
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
