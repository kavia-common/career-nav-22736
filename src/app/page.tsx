"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

/**
 * Landing Page (Marketing)
 *
 * Premium teal/white glassmorphism landing page for Career Navigator.
 *
 * Requirements (authoritative):
 * - “Explore How It Works” must smoothly scroll to the Career GPS section on this page.
 * - Only two primary buttons should perform navigation/interaction:
 *   1) Start Your Career Journey -> navigates to /journey/build-profile
 *   2) Explore How It Works -> smooth scroll only (no route navigation)
 * - No Journey page exists anymore.
 */
export default function LandingPage() {
  const [scrolled, setScrolled] = React.useState(false);

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useRevealOnScroll();

  // PUBLIC_INTERFACE
  function scrollToCareerGps() {
    /** Smooth-scroll to the Career GPS section on the landing page. */
    const el = document.getElementById("career-gps");
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div className="min-h-dvh bg-white text-zinc-900">
      {/* Sticky navigation (transparent -> solid on scroll) */}
      <header
        className={[
          "sticky top-0 z-50 transition-all",
          scrolled
            ? "border-b border-zinc-200 bg-white/90 shadow-sm backdrop-blur"
            : "border-b border-transparent bg-white/10 backdrop-blur"
        ].join(" ")}
      >
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 lg:px-6">
          <Link href="/" className="group flex items-center gap-2">
            <span
              className="h-2.5 w-2.5 rounded-full bg-teal-600 group-hover:bg-teal-700"
              aria-hidden="true"
            />
            <span className="text-sm font-semibold tracking-tight text-zinc-900">
              Career Navigator
            </span>
          </Link>

          <nav className="hidden items-center gap-1 md:flex" aria-label="Primary">
            <a className="cn-navlink" href="#career-gps">
              How It Works
            </a>
            {/* Must be non-navigating to other pages; keep as button */}
            <button
              type="button"
              className="cn-navlink"
              aria-label="Sign in (coming soon)"
              onClick={(e) => e.preventDefault()}
            >
              Sign In
            </button>
          </nav>

          <div className="flex items-center gap-2">
            {/* Non-navigating (per requirement) */}
            <Button
              variant="ghost"
              size="sm"
              type="button"
              onClick={(e) => e.preventDefault()}
              aria-label="Sign in (coming soon)"
            >
              Sign In
            </Button>

            {/* Non-navigating (per requirement) */}
            <Button
              size="sm"
              variant="secondary"
              type="button"
              onClick={(e) => e.preventDefault()}
              aria-label="Get started (info only)"
            >
              Get Started
            </Button>
          </div>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="pointer-events-none absolute inset-0" aria-hidden="true">
            <div className="absolute -top-28 left-1/2 h-[28rem] w-[56rem] -translate-x-1/2 rounded-full bg-teal-100/70 blur-3xl" />
            <div className="absolute -bottom-28 left-1/2 h-[28rem] w-[56rem] -translate-x-1/2 rounded-full bg-teal-50/70 blur-3xl" />
            <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(24,24,27,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(24,24,27,0.06)_1px,transparent_1px)] bg-[size:44px_44px] opacity-[0.23]" />
          </div>

          <div className="mx-auto grid w-full max-w-7xl grid-cols-1 items-center gap-10 px-4 py-14 lg:grid-cols-12 lg:px-6 lg:py-20">
            <div className="relative lg:col-span-6">
              <div className="cn-reveal">
                <p className="inline-flex items-center gap-2 rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-800 ring-1 ring-inset ring-teal-100">
                  Modern Career Navigation
                  <span
                    className="h-1.5 w-1.5 rounded-full bg-teal-600"
                    aria-hidden="true"
                  />
                </p>

                <h1 className="mt-4 text-4xl font-semibold tracking-tight text-zinc-900 sm:text-5xl">
                  Navigate Your Career With Clarity
                </h1>

                <p className="mt-4 text-base leading-relaxed text-zinc-600">
                  Career Navigator helps you build a clear persona, validate your skills, explore
                  branching paths, choose a destination role, and close the gap with a practical
                  roadmap.
                </p>

                <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
                  {/* Primary CTA #1 (navigates) */}
                  <Link href="/journey/build-profile" className="inline-flex">
                    <Button size="lg" aria-label="Start Your Career Journey">
                      Start Your Career Journey
                    </Button>
                  </Link>

                  {/* Primary CTA #2 (smooth scroll only) */}
                  <Button
                    size="lg"
                    variant="secondary"
                    type="button"
                    aria-label="Explore How It Works"
                    onClick={scrollToCareerGps}
                  >
                    Explore How It Works
                  </Button>
                </div>

                <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
                  {[
                    { label: "Persona baseline", value: "~5 min" },
                    { label: "Skill validation", value: "10–15 min" },
                    { label: "Roadmap output", value: "Now/Near/Next" }
                  ].map((x) => (
                    <div
                      key={x.label}
                      className="rounded-2xl bg-white/70 p-4 ring-1 ring-inset ring-zinc-200/80 backdrop-blur cn-reveal"
                      style={{ transitionDelay: "40ms" }}
                    >
                      <p className="text-xs font-medium text-zinc-600">{x.label}</p>
                      <p className="mt-1 text-lg font-semibold text-zinc-900">{x.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: animated multiverse visualization */}
            <div className="relative lg:col-span-6">
              <div className="cn-reveal rounded-3xl bg-white/70 p-5 ring-1 ring-inset ring-zinc-200/80 backdrop-blur">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-zinc-900">
                      Professional Multiverse
                    </p>
                    <p className="mt-1 text-sm text-zinc-600">
                      One role can lead to multiple futures—see branching possibilities.
                    </p>
                  </div>
                  <span className="rounded-full bg-teal-50 px-2.5 py-1 text-xs font-semibold text-teal-800 ring-1 ring-inset ring-teal-100">
                    Animated
                  </span>
                </div>

                <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <GlassRolePill title="Product Manager" meta="~18 mo" tone="teal" />
                  <GlassRolePill
                    title="Engineering Manager"
                    meta="~24 mo"
                    tone="zinc"
                  />
                  <GlassRolePill
                    title="Solutions Architect"
                    meta="~12 mo"
                    tone="zinc"
                  />
                  <GlassRolePill
                    title="Founder (early stage)"
                    meta="~30 mo"
                    tone="zinc"
                  />
                </div>

                <div className="relative mt-5 overflow-hidden rounded-2xl bg-zinc-50/70 p-4 ring-1 ring-inset ring-zinc-200/80">
                  <div className="pointer-events-none absolute inset-0" aria-hidden="true">
                    <div className="cn-orbit cn-orbit--a" />
                    <div className="cn-orbit cn-orbit--b" />
                    <div className="cn-orbit cn-orbit--c" />
                    <div className="cn-shimmer" />
                  </div>

                  <p className="relative text-sm font-semibold text-zinc-900">
                    Branching signal
                  </p>
                  <p className="relative mt-1 text-sm text-zinc-600">
                    A lightweight, accessible animated graph motif (no heavy canvas dependencies).
                  </p>

                  <div className="relative mt-4 grid grid-cols-3 gap-2">
                    {["Baseline", "Branches", "Destination"].map((x, i) => (
                      <div
                        key={x}
                        className={[
                          "rounded-lg px-3 py-2 text-xs font-medium ring-1 ring-inset",
                          i === 1
                            ? "bg-teal-50/70 text-teal-900 ring-teal-100"
                            : "bg-white text-zinc-700 ring-zinc-200"
                        ].join(" ")}
                      >
                        {x}
                      </div>
                    ))}
                  </div>

                  {/* Non-navigating buttons (requirement) */}
                  <div className="relative mt-4 flex flex-wrap gap-2">
                    <Button
                      variant="secondary"
                      type="button"
                      onClick={(e) => e.preventDefault()}
                      aria-label="Open multiverse (preview only)"
                    >
                      Open multiverse (preview)
                    </Button>
                    <Button
                      variant="ghost"
                      type="button"
                      onClick={(e) => e.preventDefault()}
                      aria-label="View guided journey (preview only)"
                    >
                      View guided journey (preview)
                    </Button>
                  </div>
                </div>
              </div>

              <div
                className="pointer-events-none absolute -bottom-16 -right-16 h-64 w-64 rounded-full bg-teal-100/60 blur-3xl"
                aria-hidden="true"
              />
            </div>
          </div>
        </section>

        {/* Problem Section */}
        <section className="border-t border-zinc-200 bg-zinc-50">
          <div className="mx-auto w-full max-w-7xl px-4 py-14 lg:px-6">
            <div className="cn-reveal">
              <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">
                The Problem
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-900">
                Career Growth Is Not Linear
              </h2>
              <p className="mt-2 max-w-2xl text-sm text-zinc-600">
                Traditional ladders are simple to draw—but real careers branch, loop, and diverge.
              </p>
            </div>

            <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2">
              <HoverLiftCard
                title="Traditional career ladder"
                desc="A single path with rigid rungs and unclear detours."
              >
                <div className="mt-4 grid grid-cols-1 gap-2">
                  {["Junior", "Mid", "Senior", "Lead"].map((x, idx) => (
                    <div
                      key={x}
                      className={[
                        "rounded-xl bg-white/70 px-4 py-3 ring-1 ring-inset ring-zinc-200/80 backdrop-blur",
                        idx === 3 ? "ring-teal-100" : ""
                      ].join(" ")}
                    >
                      <p className="text-sm font-semibold text-zinc-900">{x}</p>
                      <p className="mt-1 text-xs text-zinc-600">Single-track progress</p>
                    </div>
                  ))}
                </div>
              </HoverLiftCard>

              <HoverLiftCard
                title="Real career paths (branching)"
                desc="Multiple plausible futures based on your strengths, constraints, and goals."
              >
                <div className="mt-4 space-y-3">
                  {[
                    { from: "Software Engineer", to: "Product Manager" },
                    { from: "Software Engineer", to: "Solutions Architect" },
                    { from: "Software Engineer", to: "Engineering Manager" }
                  ].map((x) => (
                    <div
                      key={x.to}
                      className="rounded-xl bg-white/70 p-4 ring-1 ring-inset ring-zinc-200/80 backdrop-blur"
                    >
                      <p className="text-xs font-medium text-zinc-500">Branch</p>
                      <p className="mt-1 text-sm font-semibold text-zinc-900">
                        {x.from} → {x.to}
                      </p>
                      <div className="mt-3 h-2 w-full rounded-full bg-zinc-200">
                        <div className="h-2 w-[62%] rounded-full bg-teal-600" aria-hidden="true" />
                      </div>
                    </div>
                  ))}
                </div>
              </HoverLiftCard>
            </div>
          </div>
        </section>

        {/* Professional Multiverse Section */}
        <section className="bg-white">
          <div className="mx-auto w-full max-w-7xl px-4 py-14 lg:px-6">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-start">
              <div className="lg:col-span-5 cn-reveal">
                <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">
                  Professional Multiverse
                </p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-900">
                  Explore Your Professional Multiverse
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-zinc-600">
                  A single role can evolve into different destinations. Career Navigator helps you map
                  these futures so you can choose intentionally—not randomly.
                </p>

                {/* Non-navigating buttons */}
                <div className="mt-6 flex flex-wrap gap-2">
                  <Button
                    variant="secondary"
                    type="button"
                    onClick={(e) => e.preventDefault()}
                    aria-label="Explore paths (info only)"
                  >
                    Explore paths (info)
                  </Button>
                  <Button
                    variant="ghost"
                    type="button"
                    onClick={(e) => e.preventDefault()}
                    aria-label="Choose destination (info only)"
                  >
                    Choose destination (info)
                  </Button>
                </div>
              </div>

              <div className="lg:col-span-7 cn-reveal">
                <Card
                  title="Animated role network (example)"
                  description="A responsive, accessible visualization hinting at branching roles."
                >
                  <div className="relative overflow-hidden rounded-2xl bg-zinc-50/70 p-5 ring-1 ring-inset ring-zinc-200/80">
                    <div className="pointer-events-none absolute inset-0" aria-hidden="true">
                      <div className="cn-role-net cn-role-net--grid" />
                      <div className="cn-role-net cn-role-net--pulse" />
                    </div>

                    <div className="relative grid grid-cols-1 gap-3 sm:grid-cols-2">
                      {[
                        { role: "Software Engineer", tag: "Now", tone: "teal" as const },
                        { role: "Solutions Architect", tag: "Near", tone: "zinc" as const },
                        { role: "Product Manager", tag: "Near", tone: "zinc" as const },
                        { role: "Engineering Manager", tag: "Next", tone: "zinc" as const }
                      ].map((x) => (
                        <div
                          key={x.role}
                          className={[
                            "rounded-2xl p-4 ring-1 ring-inset backdrop-blur",
                            x.tone === "teal"
                              ? "bg-teal-50/70 ring-teal-100 text-teal-950"
                              : "bg-white/70 ring-zinc-200/80 text-zinc-900"
                          ].join(" ")}
                        >
                          <p className="text-sm font-semibold">{x.role}</p>
                          <p className="mt-1 text-xs text-zinc-600">{x.tag} horizon (placeholder)</p>
                          <div className="mt-3 h-2 w-full rounded-full bg-zinc-200">
                            <div
                              className={[
                                "h-2 rounded-full",
                                x.tone === "teal" ? "bg-teal-600 w-[72%]" : "bg-zinc-400 w-[55%]"
                              ].join(" ")}
                              aria-hidden="true"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* Career GPS Section (How it works) */}
        <section id="career-gps" className="border-t border-zinc-200 bg-zinc-50">
          <div className="mx-auto w-full max-w-7xl px-4 py-14 lg:px-6">
            <div className="cn-reveal">
              <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">
                Career GPS
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-900">
                Your Career GPS
              </h2>
              <p className="mt-2 max-w-2xl text-sm text-zinc-600">
                A simple system that turns ambiguity into a sequence of decisions and actions.
              </p>
            </div>

            <div className="mt-8 grid grid-cols-1 gap-4 lg:grid-cols-5">
              {[
                { t: "Build Persona", d: "Create a clear baseline from your real experience.", icon: "🧭" },
                { t: "Validate Skills", d: "Turn keywords into evidence and confidence.", icon: "✅" },
                { t: "Explore Paths", d: "See branching futures and timelines.", icon: "🌐" },
                { t: "Choose Destination", d: "Pick a target role with clarity.", icon: "🎯" },
                { t: "Close the Gap", d: "Focus on the highest-impact deltas.", icon: "🧩" }
              ].map((s, idx) => (
                <div key={s.t} className="cn-reveal" style={{ transitionDelay: `${idx * 35}ms` }}>
                  <HoverLiftCard title={s.t} desc={s.d} compact>
                    <div className="mt-4 flex items-center justify-between">
                      <span className="text-2xl" aria-hidden="true">
                        {s.icon}
                      </span>
                      <span className="rounded-full bg-teal-50 px-2.5 py-1 text-xs font-semibold text-teal-800 ring-1 ring-inset ring-teal-100">
                        Step {idx + 1}
                      </span>
                    </div>
                  </HoverLiftCard>
                </div>
              ))}
            </div>

            {/* Non-navigating banner CTA */}
            <div className="mt-8 rounded-3xl bg-white/70 p-6 ring-1 ring-inset ring-zinc-200/80 backdrop-blur cn-reveal">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-zinc-900">Built for long-term growth</p>
                  <p className="mt-1 text-sm text-zinc-600">
                    The goal isn’t a single jump—it’s a system you can reuse whenever you change directions.
                  </p>
                </div>
                <Button
                  size="lg"
                  variant="secondary"
                  type="button"
                  onClick={(e) => e.preventDefault()}
                  aria-label="See an example journey (info only)"
                >
                  See an example journey
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Roadmap Section (with line draw on scroll) */}
        <section className="bg-white">
          <div className="mx-auto w-full max-w-7xl px-4 py-14 lg:px-6">
            <div className="cn-reveal">
              <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">Roadmap</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-900">
                A Roadmap Built For Long-Term Growth
              </h2>
              <p className="mt-2 max-w-2xl text-sm text-zinc-600">
                Organize progress into horizons so you always know what matters next.
              </p>
            </div>

            <div className="mt-10 cn-reveal">
              <div className="relative">
                {/* "Draw" line on scroll by toggling scaleX */}
                <div className="absolute left-4 top-0 h-full w-px bg-zinc-200 md:left-1/2 md:-translate-x-1/2 md:w-full md:h-px md:top-4 md:bg-zinc-200" />
                <div className="cn-timeline-line absolute left-4 top-0 h-full w-px bg-teal-600 md:left-1/2 md:-translate-x-1/2 md:w-full md:h-px md:top-4" />

                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                  <TimelineLane
                    title="Now"
                    range="0–6 months"
                    bullets={[
                      "Confirm baseline persona",
                      "Validate 3–5 core skills",
                      "Ship 1 evidence-building project"
                    ]}
                  />
                  <TimelineLane
                    title="Near"
                    range="1–2 years"
                    bullets={[
                      "Close top gap areas",
                      "Build role-aligned artifacts",
                      "Strengthen key competencies"
                    ]}
                  />
                  <TimelineLane
                    title="Next"
                    range="2–5 years"
                    bullets={[
                      "Expand scope and leadership",
                      "Optimize positioning",
                      "Pursue destination-aligned opportunities"
                    ]}
                  />
                </div>
              </div>

              {/* Non-navigating button */}
              <div className="mt-8 flex justify-center">
                <Button
                  size="lg"
                  type="button"
                  onClick={(e) => e.preventDefault()}
                  aria-label="View a sample roadmap (info only)"
                >
                  View a sample roadmap
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Privacy Section */}
        <section id="privacy" className="border-t border-zinc-200 bg-zinc-50">
          <div className="mx-auto w-full max-w-7xl px-4 py-14 lg:px-6">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-start">
              <div className="lg:col-span-5 cn-reveal">
                <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">Privacy</p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-900">
                  Your Career Data Is Private
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-zinc-600">
                  Your exploration remains private. Employers cannot see external opportunities or your browsing unless
                  you explicitly give permission.
                </p>
              </div>

              <div className="lg:col-span-7">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {[
                    { title: "Private exploration", desc: "Your path exploration is not visible to employers." },
                    { title: "Permission-based sharing", desc: "Only share what you choose, when you choose." },
                    { title: "Clear boundaries", desc: "Separate internal career growth from external browsing." },
                    { title: "Control & transparency", desc: "Designed for strong controls as the platform evolves." }
                  ].map((p, idx) => (
                    <div key={p.title} className="cn-reveal" style={{ transitionDelay: `${idx * 30}ms` }}>
                      <Card className="h-full">
                        <p className="text-sm font-semibold text-zinc-900">{p.title}</p>
                        <p className="mt-1 text-sm text-zinc-600">{p.desc}</p>
                        <div className="mt-3 h-2 w-full rounded-full bg-zinc-200">
                          <div className="h-2 w-[70%] rounded-full bg-teal-600" aria-hidden="true" />
                        </div>
                      </Card>
                    </div>
                  ))}
                </div>

                <div className="mt-6 cn-reveal">
                  <Button
                    variant="secondary"
                    type="button"
                    onClick={(e) => e.preventDefault()}
                    aria-label="Learn more about privacy (coming soon)"
                  >
                    Learn more (coming soon)
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA Section (Explore How It Works must smooth-scroll) */}
        <section className="bg-white">
          <div className="mx-auto w-full max-w-7xl px-4 py-16 lg:px-6">
            <div className="cn-reveal rounded-3xl bg-teal-600 p-8 text-white shadow-sm ring-1 ring-inset ring-teal-700/30 md:p-10">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-12 md:items-center">
                <div className="md:col-span-8">
                  <p className="text-xs font-semibold uppercase tracking-wide text-teal-50/90">
                    Start navigating today
                  </p>
                  <h2 className="mt-2 text-3xl font-semibold tracking-tight">
                    Start Navigating Your Career Today
                  </h2>
                  <p className="mt-2 text-sm text-teal-50/90">
                    Build your persona, validate skills, explore paths, choose a destination, and generate a practical
                    roadmap.
                  </p>
                </div>

                <div className="md:col-span-4 md:flex md:justify-end">
                  <div className="flex flex-col gap-3 sm:flex-row md:flex-col md:items-stretch">
                    <Link href="/journey/build-profile" className="inline-flex">
                      <Button size="lg" variant="secondary" aria-label="Start Your Career Journey (final CTA)">
                        Start Your Career Journey
                      </Button>
                    </Link>

                    <Button
                      size="lg"
                      variant="ghost"
                      className="text-white hover:bg-white/10"
                      type="button"
                      onClick={scrollToCareerGps}
                      aria-label="Explore How It Works (final CTA)"
                    >
                      Explore How It Works
                    </Button>
                  </div>
                </div>
              </div>

              <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
                {[
                  { v: "Baseline", d: "Create your starting point" },
                  { v: "Destination", d: "Pick a target role" },
                  { v: "Roadmap", d: "Execute Now/Near/Next" }
                ].map((x) => (
                  <div key={x.v} className="rounded-2xl bg-white/10 p-4 ring-1 ring-inset ring-white/15">
                    <p className="text-xs font-semibold text-white/90">{x.v}</p>
                    <p className="mt-1 text-sm text-white/80">{x.d}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Footer (no external navigation) */}
        <footer className="border-t border-zinc-200 bg-zinc-50">
          <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-10 lg:flex-row lg:items-center lg:justify-between lg:px-6">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-teal-600" aria-hidden="true" />
              <span className="text-sm font-semibold text-zinc-900">Career Navigator</span>
              <span className="text-xs text-zinc-500">© {new Date().getFullYear()}</span>
            </div>

            <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-zinc-600">
              <a href="#career-gps" className="hover:text-zinc-900">
                How It Works
              </a>
              <a href="#privacy" className="hover:text-zinc-900">
                Privacy
              </a>
              <button type="button" className="hover:text-zinc-900" onClick={(e) => e.preventDefault()}>
                Terms
              </button>
              <button type="button" className="hover:text-zinc-900" onClick={(e) => e.preventDefault()}>
                Contact
              </button>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}

function GlassRolePill({
  title,
  meta,
  tone
}: {
  title: string;
  meta: string;
  tone: "teal" | "zinc";
}) {
  const ring =
    tone === "teal"
      ? "bg-teal-50/70 ring-teal-100 text-teal-950"
      : "bg-white/70 ring-zinc-200/80 text-zinc-900";

  return (
    <div className={`rounded-2xl p-4 ring-1 ring-inset backdrop-blur ${ring}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold">{title}</p>
          <p className="mt-1 text-xs text-zinc-600">{meta}</p>
        </div>
        <span
          className={[
            "mt-0.5 h-2.5 w-2.5 rounded-full",
            tone === "teal" ? "bg-teal-600" : "bg-zinc-300"
          ].join(" ")}
          aria-hidden="true"
        />
      </div>
      <div className="mt-3 h-2 w-full rounded-full bg-zinc-200">
        <div
          className={[
            "h-2 rounded-full",
            tone === "teal" ? "bg-teal-600 w-[72%]" : "bg-zinc-400 w-[56%]"
          ].join(" ")}
          aria-hidden="true"
        />
      </div>
      <p className="mt-2 text-xs text-zinc-600">Example signal (placeholder)</p>
    </div>
  );
}

function HoverLiftCard({
  title,
  desc,
  children,
  compact
}: {
  title: string;
  desc: string;
  children: React.ReactNode;
  compact?: boolean;
}) {
  return (
    <div className="cn-reveal">
      <div
        className={[
          "group rounded-3xl bg-white/70 ring-1 ring-inset ring-zinc-200/80 backdrop-blur transition-all",
          "hover:-translate-y-0.5 hover:shadow-lg hover:shadow-teal-900/5",
          compact ? "p-5" : "p-6"
        ].join(" ")}
      >
        <p className="text-sm font-semibold text-zinc-900">{title}</p>
        <p className="mt-1 text-sm text-zinc-600">{desc}</p>
        {children}
      </div>
    </div>
  );
}

function TimelineLane({
  title,
  range,
  bullets
}: {
  title: string;
  range: string;
  bullets: string[];
}) {
  return (
    <div className="relative rounded-3xl bg-white/70 p-6 ring-1 ring-inset ring-zinc-200/80 backdrop-blur cn-reveal">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">{title}</p>
          <p className="mt-1 text-sm font-semibold text-zinc-900">{range}</p>
        </div>
        <span className="h-3 w-3 rounded-full bg-teal-600" aria-hidden="true" />
      </div>

      <ul className="mt-4 space-y-2 text-sm text-zinc-700">
        {bullets.map((b) => (
          <li key={b} className="flex items-start gap-2">
            <span className="mt-2 h-1.5 w-1.5 rounded-full bg-teal-600" aria-hidden="true" />
            <span>{b}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Hook: reveals elements on scroll using IntersectionObserver.
 * This powers the "fade in + upward motion" requirement without extra dependencies.
 */
function useRevealOnScroll() {
  React.useEffect(() => {
    const nodes = Array.from(document.querySelectorAll<HTMLElement>(".cn-reveal"));
    if (nodes.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            (entry.target as HTMLElement).classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.15 }
    );

    for (const el of nodes) observer.observe(el);

    return () => observer.disconnect();
  }, []);
}
