"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { FileUploader } from "@/components/ui/FileUploader";
import {
  addPersonaDoc,
  getPersonaFlowState,
  removePersonaDoc,
  resetPersonaFlow,
  setLinkedInConnected,
  type UploadedDocMeta
} from "@/lib/personaFlow";

type DocKind = "resume" | "jobDescription" | "performanceReview";

const ACCEPT = ".pdf,.docx";

function kindLabel(kind: DocKind) {
  switch (kind) {
    case "resume":
      return "Resume Upload";
    case "jobDescription":
      return "Job Description Upload";
    case "performanceReview":
      return "Performance Review Upload";
  }
}

function kindHelp(kind: DocKind) {
  switch (kind) {
    case "resume":
      return "Upload your most recent resume (PDF or DOCX).";
    case "jobDescription":
      return "Add a job description that reflects your target or current role.";
    case "performanceReview":
      return "Add a recent performance review to capture strengths and impact.";
  }
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(0)} KB`;
  const mb = kb / 1024;
  return `${mb.toFixed(1)} MB`;
}

function SuccessFileCard({
  doc,
  onRemove
}: {
  doc: UploadedDocMeta;
  onRemove: () => void;
}) {
  return (
    <div className="mt-4 rounded-2xl bg-white/90 p-4 ring-1 ring-inset ring-teal-100">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-zinc-900">{doc.name}</p>
          <p className="mt-1 text-xs text-zinc-600">
            {formatBytes(doc.size)} • {doc.type || "file"}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span
            className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-teal-600 text-sm text-white shadow-[0_0_16px_rgba(13,148,136,0.35)]"
            aria-label="Uploaded successfully"
            title="Uploaded successfully"
          >
            ✓
          </span>
          <Button variant="ghost" size="sm" onClick={onRemove}>
            Remove
          </Button>
        </div>
      </div>
    </div>
  );
}

function UploadCard({
  kind,
  doc,
  onSelect,
  onRemove
}: {
  kind: DocKind;
  doc: UploadedDocMeta | null;
  onSelect: (file: File) => void;
  onRemove: () => void;
}) {
  return (
    <Card
      className={[
        "rounded-2xl p-6",
        "bg-white",
        "shadow-sm",
        "ring-1 ring-inset ring-zinc-200",
        "transition-all duration-200",
        "hover:-translate-y-0.5 hover:shadow-md",
        "hover:ring-teal-200"
      ].join(" ")}
      title={kindLabel(kind)}
      description={kindHelp(kind)}
    >
      <div className="mt-2">
        <div className="rounded-2xl bg-gradient-to-b from-teal-50 to-white p-4 ring-1 ring-inset ring-teal-100">
          <FileUploader
            accept={ACCEPT}
            maxSizeMb={10}
            onFileSelected={(file) => onSelect(file)}
          />
        </div>

        {doc ? <SuccessFileCard doc={doc} onRemove={onRemove} /> : null}
      </div>
    </Card>
  );
}

export default function BuildProfileStepPage() {
  const router = useRouter();

  const [docs, setDocs] = React.useState<UploadedDocMeta[]>([]);
  const [linkedInConnected, setConnected] = React.useState(false);

  const [error, setError] = React.useState<string | null>(null);
  const [shake, setShake] = React.useState(false);

  React.useEffect(() => {
    // Requirement: uploads should NOT persist across a page refresh.
    // This app stores the persona flow state in localStorage; clear it on initial mount.
    resetPersonaFlow();

    const state = getPersonaFlowState();
    setDocs(state.docs);
    setConnected(state.linkedInConnected);
  }, []);

  const refresh = () => {
    const state = getPersonaFlowState();
    setDocs(state.docs);
    setConnected(state.linkedInConnected);
  };

  const getDocForKind = (kind: DocKind) => {
    // We don't have a backend schema for doc types yet; use a deterministic in-memory mapping:
    // pick first file per kind using a name prefix we control when adding the meta.
    const prefix = `cn-${kind}-::`;
    return docs.find((d) => d.name.startsWith(prefix)) ?? null;
  };

  const upsertDoc = (kind: DocKind, file: File) => {
    setError(null);

    // Remove any previous doc for this kind.
    const existing = getDocForKind(kind);
    if (existing) removePersonaDoc(existing.id);

    // Store metadata only (no binary persistence). Prefix name to track kind in-memory.
    addPersonaDoc({
      id: `${kind}-${file.name}-${file.size}-${file.lastModified}-${Math.random()
        .toString(16)
        .slice(2)}`,
      name: `cn-${kind}-::${file.name}`,
      size: file.size,
      type: file.type,
      addedAt: new Date().toISOString()
    });

    refresh();
  };

  const removeKind = (kind: DocKind) => {
    const existing = getDocForKind(kind);
    if (existing) removePersonaDoc(existing.id);
    refresh();
  };

  const resume = getDocForKind("resume");
  const jobDescription = getDocForKind("jobDescription");
  const performanceReview = getDocForKind("performanceReview");

  const requiredOk = Boolean(resume && jobDescription && performanceReview);

  const triggerError = (message: string) => {
    setError(message);
    setShake(true);
    window.setTimeout(() => setShake(false), 480);
  };

  return (
    <div>
      {/* Light header area to ensure strong contrast/readability */}
      <div className="mb-6 rounded-2xl bg-white px-6 py-7 shadow-sm ring-1 ring-inset ring-zinc-200/70">
        <div className="relative overflow-hidden rounded-2xl">
          {/* Particle background layer (decorative, behind text) */}
          <div
            className="pointer-events-none absolute inset-0"
            aria-hidden="true"
          >
            {/* Soft vignette to keep text fully readable */}
            <div className="absolute inset-0 bg-gradient-to-b from-white/30 via-white/55 to-white/80" />

            {/* Particles */}
            <span
              className="cn-particle cn-particle-drift left-[10%] top-[18%] h-2 w-2"
              style={
                {
                  background: "rgba(20, 184, 166, 0.28)",
                  "--cn-particle-duration": "9s",
                  "--cn-particle-delay": "0.2s"
                } as React.CSSProperties
              }
            />
            <span
              className="cn-particle cn-particle-drift left-[18%] top-[62%] h-1.5 w-1.5"
              style={
                {
                  background: "rgba(13, 148, 136, 0.24)",
                  "--cn-particle-duration": "7.4s",
                  "--cn-particle-delay": "1.1s"
                } as React.CSSProperties
              }
            />
            <span
              className="cn-particle cn-particle-drift left-[34%] top-[36%] h-2 w-2"
              style={
                {
                  background: "rgba(20, 184, 166, 0.22)",
                  "--cn-particle-duration": "8.4s",
                  "--cn-particle-delay": "0.6s"
                } as React.CSSProperties
              }
            />
            <span
              className="cn-particle cn-particle-drift left-[52%] top-[20%] h-1.5 w-1.5"
              style={
                {
                  background: "rgba(13, 148, 136, 0.26)",
                  "--cn-particle-duration": "10s",
                  "--cn-particle-delay": "1.5s"
                } as React.CSSProperties
              }
            />
            <span
              className="cn-particle cn-particle-drift left-[66%] top-[52%] h-2 w-2"
              style={
                {
                  background: "rgba(20, 184, 166, 0.24)",
                  "--cn-particle-duration": "8.8s",
                  "--cn-particle-delay": "0.9s"
                } as React.CSSProperties
              }
            />
            <span
              className="cn-particle cn-particle-drift left-[78%] top-[30%] h-1.5 w-1.5"
              style={
                {
                  background: "rgba(13, 148, 136, 0.22)",
                  "--cn-particle-duration": "7.9s",
                  "--cn-particle-delay": "1.8s"
                } as React.CSSProperties
              }
            />
            <span
              className="cn-particle cn-particle-drift left-[86%] top-[70%] h-2 w-2"
              style={
                {
                  background: "rgba(20, 184, 166, 0.22)",
                  "--cn-particle-duration": "9.6s",
                  "--cn-particle-delay": "0.4s"
                } as React.CSSProperties
              }
            />
          </div>

          {/* Text layer (above particles) */}
          <div className="relative cn-enter-up px-0 py-0">
            <PageHeader
              title="Build Your Career Persona"
              subtitle="Upload your professional documents so AI can build your persona."
              titleClassName={[
                "cn-page-title cn-page-title--teal",
                // Typewriter settings: ~1.8s typing + short cursor blink then hide.
                "cn-typewriter cn-typewriter--with-cursor",
                // Width/steps tuned for this exact title length to feel natural.
                "[--cn-tw-duration:1.85s] [--cn-tw-delay:0s] [--cn-tw-steps:24] [--cn-tw-width:24ch]",
                "[--cn-cursor-delay:1.95s] [--cn-cursor-duration:700ms]"
              ].join(" ")}
              subtitleClassName={[
                "cn-page-subtitle",
                // Delayed until after typing finishes.
                "cn-subtext-enter [--cn-subtext-delay:2.05s]"
              ].join(" ")}
            />
          </div>
        </div>
      </div>

      <div className="mx-auto mt-8 w-full max-w-5xl">
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          <UploadCard
            kind="resume"
            doc={resume}
            onSelect={(file) => upsertDoc("resume", file)}
            onRemove={() => removeKind("resume")}
          />
          <UploadCard
            kind="jobDescription"
            doc={jobDescription}
            onSelect={(file) => upsertDoc("jobDescription", file)}
            onRemove={() => removeKind("jobDescription")}
          />
          <UploadCard
            kind="performanceReview"
            doc={performanceReview}
            onSelect={(file) => upsertDoc("performanceReview", file)}
            onRemove={() => removeKind("performanceReview")}
          />
        </div>

        <div className="mt-6">
          <Card
            className="rounded-2xl ring-1 ring-inset ring-teal-100"
            title="Connect LinkedIn"
            description="Optionally connect LinkedIn to improve persona accuracy."
            actions={
              !linkedInConnected ? (
                <Button
                  className="transition-transform hover:-translate-y-0.5"
                  variant="primary"
                  onClick={() => {
                    setLinkedInConnected(true);
                    refresh();
                  }}
                >
                  Connect LinkedIn
                </Button>
              ) : (
                <div className="inline-flex items-center gap-2 rounded-xl bg-teal-50 px-3 py-2 text-sm font-semibold text-teal-900 ring-1 ring-inset ring-teal-100">
                  LinkedIn Connected <span aria-hidden="true">✓</span>
                </div>
              )
            }
          >
            <div className="rounded-2xl bg-gradient-to-b from-white to-teal-50 p-4 ring-1 ring-inset ring-teal-100">
              <p className="text-sm text-zinc-700">
                (MVP placeholder — no OAuth yet. This UI simulates a successful connection.)
              </p>
            </div>
          </Card>
        </div>

        <div className="mt-8 flex flex-col items-center justify-center gap-3">
          {error && (
            <p
              className={[
                "rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-800 ring-1 ring-inset ring-rose-200",
                shake ? "cn-shake" : ""
              ].join(" ")}
              role="alert"
            >
              {error}
            </p>
          )}

          <Button
            size="lg"
            className="w-full max-w-sm shadow-sm"
            onClick={() => {
              if (!requiredOk) {
                triggerError(
                  "Please upload required documents before generating persona."
                );
                return;
              }
              router.push("/journey/persona/analyze");
            }}
          >
            Generate Draft Persona
          </Button>

          <p className="text-center text-xs text-zinc-500">
            Required: Resume + Job Description + Performance Review
          </p>
        </div>
      </div>
    </div>
  );
}
