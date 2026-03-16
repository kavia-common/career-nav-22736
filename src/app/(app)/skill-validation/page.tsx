"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { MultiverseHeading } from "@/components/layout/MultiverseHeading";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";

type InterviewPhase = "intro" | "question" | "processing" | "complete";

type InterviewStep = {
  id: string;
  question: string;
  hint?: string;
};

/**
 * A tiny deterministic PRNG so the UI feels "alive" but remains stable per session.
 * Not cryptographically secure; only used for subtle UI variations (confidence drift).
 */
function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// PUBLIC_INTERFACE
export default function SkillValidationPage() {
  /** Skill Validation page: AI interview-style interaction UI (MVP simulation, no backend calls yet). */
  const router = useRouter();

  const steps: InterviewStep[] = React.useMemo(
    () => [
      {
        id: "problem-solving",
        question:
          "To start, walk me through a recent problem you solved at work. What was your approach?",
        hint: "Focus on your process, tradeoffs, and impact."
      },
      {
        id: "collaboration",
        question:
          "Tell me about a time you influenced a decision without formal authority. What did you do?",
        hint: "Highlight communication and stakeholder alignment."
      },
      {
        id: "learning",
        question:
          "What’s a skill you learned in the last 6 months, and how did you build competence quickly?",
        hint: "Share sources, practice loops, and outcomes."
      }
    ],
    []
  );

  const total = steps.length;

  const [phase, setPhase] = React.useState<InterviewPhase>("intro");
  const [activeIndex, setActiveIndex] = React.useState(0);

  // Simulated user answer input.
  const [answer, setAnswer] = React.useState("");

  // "AI typing" for question prompt.
  const [typedQuestion, setTypedQuestion] = React.useState("");
  const [isTyping, setIsTyping] = React.useState(false);

  // Processing state progress (0..100)
  const [processingPct, setProcessingPct] = React.useState(0);

  // Confidence indicator (0..100), updated subtly per step.
  const [confidence, setConfidence] = React.useState(72);

  // For subtle animations and stable randomness.
  const seedRef = React.useRef<number>(() => {
    // stable per tab session
    const now = Date.now();
    return (now ^ (now >>> 3)) & 0xffffffff;
  }) as unknown as React.MutableRefObject<number>;
  const rand = React.useMemo(() => mulberry32(seedRef.current), []);

  const activeStep = steps[activeIndex];

  const progressPct = Math.round(((activeIndex + (phase === "complete" ? 1 : 0)) / total) * 100);

  // Kick off question typing when entering question phase or changing question.
  React.useEffect(() => {
    if (phase !== "question") return;
    const full = activeStep.question;

    let i = 0;
    setTypedQuestion("");
    setIsTyping(true);

    const baseDelay = 14; // ms/char
    const jitter = 18;

    const id = window.setInterval(() => {
      // "Typing" with slight variability
      const sliceLen = 1 + (rand() > 0.86 ? 1 : 0);
      i = Math.min(full.length, i + sliceLen);
      setTypedQuestion(full.slice(0, i));

      if (i >= full.length) {
        window.clearInterval(id);
        setIsTyping(false);
      }
    }, baseDelay + Math.round(rand() * jitter));

    return () => window.clearInterval(id);
  }, [phase, activeIndex, activeStep.question, rand]);

  // Processing animation + confidence update
  React.useEffect(() => {
    if (phase !== "processing") return;

    setProcessingPct(0);

    // slightly adjust confidence as if "model confidence" changed for this step
    const drift = Math.round((rand() - 0.5) * 18); // -9..+9
    setConfidence((c) => Math.min(96, Math.max(42, c + drift)));

    const startedAt = Date.now();
    const durationMs = 2400 + Math.round(rand() * 1200);

    const tick = () => {
      const t = Math.min(1, (Date.now() - startedAt) / durationMs);
      // ease-out curve
      const eased = 1 - Math.pow(1 - t, 3);
      const pct = Math.min(100, Math.round(eased * 100));
      setProcessingPct(pct);

      if (pct < 100) {
        requestAnimationFrame(tick);
      } else {
        // transition to next question / completion
        window.setTimeout(() => {
          setAnswer("");
          if (activeIndex + 1 >= total) {
            setPhase("complete");
          } else {
            setActiveIndex((v) => v + 1);
            setPhase("question");
          }
        }, 360);
      }
    };

    const raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [phase, activeIndex, total, rand]);

  const canSubmit = answer.trim().length >= 20 && !isTyping && phase === "question";

  const handleStart = () => {
    setActiveIndex(0);
    setAnswer("");
    setPhase("question");
  };

  const handleSubmit = () => {
    if (!canSubmit) return;
    setPhase("processing");
  };

  const handleSkip = () => {
    // Skip still "processes" quickly, to keep experience coherent.
    setAnswer("(Skipped)");
    setPhase("processing");
  };

  const handleRestart = () => {
    setConfidence(72);
    setPhase("intro");
    setActiveIndex(0);
    setAnswer("");
    setProcessingPct(0);
  };

  const confidenceLabel =
    confidence >= 85 ? "High" : confidence >= 65 ? "Good" : confidence >= 50 ? "Medium" : "Low";

  return (
    <div className="relative">
      <MultiverseHeading
        title="Skill Validation"
        subtitle="An AI interview-style assessment to calibrate your current strengths."
        showAmbient={true}
        showParticles={true}
      />

      {/* Ambient background */}
      <div
        className="pointer-events-none absolute inset-x-0 -top-10 -z-10 h-[420px] overflow-hidden"
        aria-hidden="true"
      >
        <div className="cn-sv-ambient" />
        <div className="cn-sv-grid" />
        <div className="cn-sv-glow cn-sv-glow--a" />
        <div className="cn-sv-glow cn-sv-glow--b" />
      </div>

      <div className="mx-auto max-w-3xl">
        <Card className="relative overflow-hidden p-0">
          {/* Card chrome / header */}
          <div className="border-b border-zinc-200/70 bg-white/70 px-5 py-4 backdrop-blur">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  AI Interview
                </p>
                <p className="mt-0.5 text-sm text-zinc-700">
                  {phase === "complete"
                    ? "Completed"
                    : `Step ${Math.min(activeIndex + 1, total)} of ${total}`}
                </p>
              </div>

              <div className="flex items-center gap-3">
                {/* Confidence pill */}
                <div className="rounded-full bg-zinc-50 px-3 py-1 ring-1 ring-inset ring-zinc-200">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-zinc-600">Confidence</span>
                    <span
                      className={cn(
                        "text-xs font-semibold",
                        confidence >= 85
                          ? "text-teal-700"
                          : confidence >= 65
                            ? "text-zinc-800"
                            : "text-amber-700"
                      )}
                    >
                      {confidenceLabel}
                    </span>
                  </div>
                  <div className="mt-1 h-1.5 w-32 overflow-hidden rounded-full bg-zinc-200">
                    <div
                      className={cn(
                        "h-full rounded-full transition-[width] duration-500",
                        confidence >= 85
                          ? "bg-teal-600"
                          : confidence >= 65
                            ? "bg-zinc-700"
                            : "bg-amber-500"
                      )}
                      style={{ width: `${confidence}%` }}
                    />
                  </div>
                </div>

                {/* Overall progress */}
                <div className="hidden w-36 sm:block">
                  <div className="flex items-center justify-between text-xs text-zinc-600">
                    <span>Progress</span>
                    <span className="tabular-nums">{phase === "complete" ? "100" : progressPct}%</span>
                  </div>
                  <div className="mt-1 h-2 overflow-hidden rounded-full bg-zinc-200">
                    <div
                      className="h-full rounded-full bg-teal-600 transition-[width] duration-500"
                      style={{ width: `${phase === "complete" ? 100 : progressPct}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="relative px-5 py-6">
            {/* Subtle shimmer */}
            <div className="pointer-events-none absolute inset-0 opacity-40" aria-hidden="true">
              <div className="cn-sv-shimmer" />
            </div>

            {/* Phase panels */}
            <div className="relative">
              {phase === "intro" && (
                <div className="cn-sv-panel cn-sv-panel--enter">
                  <div className="flex items-start gap-3">
                    <div className="cn-sv-avatar">
                      <div className="cn-sv-avatarPulse" aria-hidden="true" />
                      <span className="text-xs font-semibold text-teal-900">AI</span>
                    </div>
                    <div className="min-w-0">
                      <h2 className="text-lg font-semibold text-zinc-900">
                        Let’s validate your skills
                      </h2>
                      <p className="mt-1 text-sm text-zinc-600">
                        You’ll answer a few short prompts. The AI will “process” each response and
                        estimate confidence as it calibrates.
                      </p>
                      <ul className="mt-4 space-y-2 text-sm text-zinc-700">
                        <li className="flex gap-2">
                          <span className="mt-1 inline-block h-1.5 w-1.5 rounded-full bg-teal-600" />
                          <span>Typing-style question delivery and smooth transitions.</span>
                        </li>
                        <li className="flex gap-2">
                          <span className="mt-1 inline-block h-1.5 w-1.5 rounded-full bg-teal-600" />
                          <span>Processing state with progress and subtle motion.</span>
                        </li>
                        <li className="flex gap-2">
                          <span className="mt-1 inline-block h-1.5 w-1.5 rounded-full bg-teal-600" />
                          <span>Completion screen with next-step call to action.</span>
                        </li>
                      </ul>

                      <div className="mt-6 flex flex-wrap gap-2">
                        <Button onClick={handleStart} rightIcon={<span aria-hidden="true">→</span>}>
                          Start interview
                        </Button>
                        <Button variant="secondary" onClick={() => router.push("/journey")}>
                          Back to Journey
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {phase === "question" && (
                <div className="cn-sv-panel cn-sv-panel--enter">
                  <div className="flex items-start gap-3">
                    <div className="cn-sv-avatar">
                      <div className="cn-sv-avatarPulse" aria-hidden="true" />
                      <span className="text-xs font-semibold text-teal-900">AI</span>
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                          Prompt
                        </p>
                        <div className="flex items-center gap-2">
                          <span
                            className={cn(
                              "inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset",
                              isTyping
                                ? "bg-teal-50 text-teal-800 ring-teal-200"
                                : "bg-zinc-50 text-zinc-700 ring-zinc-200"
                            )}
                          >
                            <span
                              className={cn(
                                "h-1.5 w-1.5 rounded-full",
                                isTyping ? "bg-teal-600 cn-sv-dotPulse" : "bg-zinc-400"
                              )}
                              aria-hidden="true"
                            />
                            {isTyping ? "Typing" : "Ready"}
                          </span>
                        </div>
                      </div>

                      <div className="mt-2 rounded-xl bg-zinc-50 p-4 ring-1 ring-inset ring-zinc-200">
                        <p className="text-sm leading-relaxed text-zinc-900">
                          <span className="cn-sv-typeCursor">{typedQuestion}</span>
                        </p>
                        {activeStep.hint && (
                          <p className="mt-2 text-xs text-zinc-600">{activeStep.hint}</p>
                        )}
                      </div>

                      <div className="mt-4">
                        <label className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                          Your response
                        </label>
                        <textarea
                          className={cn(
                            "mt-2 w-full resize-none rounded-xl bg-white p-3 text-sm text-zinc-900",
                            "ring-1 ring-inset ring-zinc-200 shadow-sm",
                            "focus:outline-none focus:ring-2 focus:ring-teal-500/30"
                          )}
                          rows={5}
                          value={answer}
                          onChange={(e) => setAnswer(e.target.value)}
                          placeholder="Type your answer..."
                        />

                        <div className="mt-2 flex items-center justify-between gap-3">
                          <p className="text-xs text-zinc-500">
                            Minimum ~20 characters to submit.
                          </p>
                          <p className="text-xs tabular-nums text-zinc-500">
                            {answer.trim().length} chars
                          </p>
                        </div>

                        <div className="mt-4 flex flex-wrap gap-2">
                          <Button onClick={handleSubmit} disabled={!canSubmit}>
                            Submit answer
                          </Button>
                          <Button variant="secondary" onClick={handleSkip}>
                            Skip
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {phase === "processing" && (
                <div className="cn-sv-panel cn-sv-panel--enter">
                  <div className="flex items-start gap-3">
                    <div className="cn-sv-avatar">
                      <div className="cn-sv-avatarPulse" aria-hidden="true" />
                      <span className="text-xs font-semibold text-teal-900">AI</span>
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                        Processing
                      </p>
                      <h2 className="mt-1 text-base font-semibold text-zinc-900">
                        Analyzing your response…
                      </h2>
                      <p className="mt-1 text-sm text-zinc-600">
                        Extracting signals, mapping to competencies, estimating confidence.
                      </p>

                      <div className="mt-5 rounded-xl bg-zinc-50 p-4 ring-1 ring-inset ring-zinc-200">
                        <div className="flex items-center justify-between text-xs text-zinc-600">
                          <span>Model run</span>
                          <span className="tabular-nums">{processingPct}%</span>
                        </div>
                        <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-zinc-200">
                          <div
                            className="h-full rounded-full bg-teal-600 transition-[width] duration-200"
                            style={{ width: `${processingPct}%` }}
                          />
                        </div>

                        <div className="mt-4 grid gap-3 sm:grid-cols-3">
                          <div className="cn-sv-chip">
                            <span className="cn-sv-chipDot cn-sv-chipDot--a" aria-hidden="true" />
                            <span>Parsing</span>
                          </div>
                          <div className="cn-sv-chip">
                            <span className="cn-sv-chipDot cn-sv-chipDot--b" aria-hidden="true" />
                            <span>Scoring</span>
                          </div>
                          <div className="cn-sv-chip">
                            <span className="cn-sv-chipDot cn-sv-chipDot--c" aria-hidden="true" />
                            <span>Calibrating</span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-5 flex items-center gap-2 text-sm text-zinc-700">
                        <span
                          className="h-4 w-4 animate-spin rounded-full border-2 border-teal-600/25 border-t-teal-600"
                          aria-hidden="true"
                        />
                        <span>Generating next prompt…</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {phase === "complete" && (
                <div className="cn-sv-panel cn-sv-panel--enter">
                  <div className="flex items-start gap-3">
                    <div className="cn-sv-avatar cn-sv-avatar--complete">
                      <span className="text-xs font-semibold text-teal-900">AI</span>
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                        Complete
                      </p>
                      <h2 className="mt-1 text-lg font-semibold text-zinc-900">
                        Skill validation finished
                      </h2>
                      <p className="mt-1 text-sm text-zinc-600">
                        We’ve captured your responses and calibrated an initial confidence profile.
                        Next, explore your career multiverse.
                      </p>

                      <div className="mt-5 rounded-xl bg-gradient-to-br from-teal-50 to-white p-4 ring-1 ring-inset ring-teal-100">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-teal-900">
                              Confidence snapshot
                            </p>
                            <p className="mt-1 text-xs text-teal-900/70">
                              Based on your answers in this session.
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-teal-900/70">Overall</p>
                            <p className="text-2xl font-bold tabular-nums text-teal-900">
                              {confidence}%
                            </p>
                          </div>
                        </div>

                        <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-teal-100">
                          <div
                            className="h-full rounded-full bg-teal-600 transition-[width] duration-700"
                            style={{ width: `${confidence}%` }}
                          />
                        </div>
                      </div>

                      <div className="mt-6 flex flex-wrap gap-2">
                        <Button onClick={() => router.push("/multiverse")}>View Multiverse</Button>
                        <Button variant="secondary" onClick={handleRestart}>
                          Run again
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Bottom fade / accent */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-zinc-50/90 to-transparent" />
        </Card>

        <p className="mt-4 text-xs text-zinc-500">
          Note: This is a UI/UX simulation. Backend scoring/analysis can be wired later.
        </p>
      </div>
    </div>
  );
}
