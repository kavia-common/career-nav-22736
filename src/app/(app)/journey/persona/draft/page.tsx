"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ProgressStepper, type Step } from "@/components/ui/ProgressStepper";
import { getPersonaFlowState, setDraftPersona, type DraftPersona } from "@/lib/personaFlow";

const TOP_STEPS: Step[] = [
  {
    id: "upload",
    title: "Upload",
    description: "Add docs + connect LinkedIn.",
    status: "complete"
  },
  {
    id: "analysis",
    title: "AI analysis",
    description: "Extract experience, skills, and highlights.",
    status: "complete"
  },
  {
    id: "review",
    title: "Draft persona",
    description: "Review, edit, confirm.",
    status: "current"
  }
];

function PlaceholderAvatarIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Z"
        className="stroke-zinc-400"
        strokeWidth="1.5"
      />
      <path
        d="M4.5 20a7.5 7.5 0 0 1 15 0"
        className="stroke-zinc-400"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function PencilIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M12 20h9"
        className="stroke-white"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
      <path
        d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4 11.5-11.5Z"
        className="stroke-white"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CheckIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M20 6 9 17l-5-5"
        className="stroke-teal-700"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SkillChip({
  value,
  isEditing,
  onRemove
}: {
  value: string;
  isEditing: boolean;
  onRemove?: () => void;
}) {
  return (
    <span
      className={[
        "group inline-flex items-center gap-2 rounded-full bg-teal-50 px-3 py-1.5 text-sm font-medium text-teal-900",
        "ring-1 ring-inset ring-teal-100",
        "transition-transform duration-200 hover:scale-[1.03]"
      ].join(" ")}
    >
      {value}
      {isEditing && onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="rounded-full px-1 text-teal-800/70 hover:text-teal-900 hover:bg-teal-100"
          aria-label={`Remove skill ${value}`}
          title="Remove skill"
        >
          ×
        </button>
      )}
    </span>
  );
}

function TextInput({
  label,
  value,
  onChange,
  disabled,
  placeholder
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  disabled: boolean;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-zinc-700">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder={placeholder}
        className={[
          "mt-1 h-10 w-full rounded-lg px-3 text-sm ring-1 ring-inset focus:outline-none focus:ring-2 focus:ring-teal-500/40",
          disabled
            ? "bg-zinc-50 text-zinc-800 ring-zinc-200"
            : "bg-white text-zinc-900 ring-zinc-200"
        ].join(" ")}
      />
    </label>
  );
}

function Textarea({
  label,
  value,
  onChange,
  disabled,
  rows = 4,
  placeholder
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  disabled: boolean;
  rows?: number;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-zinc-700">{label}</span>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        rows={rows}
        placeholder={placeholder}
        className={[
          "mt-1 w-full resize-none rounded-lg p-3 text-sm ring-1 ring-inset focus:outline-none focus:ring-2 focus:ring-teal-500/40",
          disabled
            ? "bg-zinc-50 text-zinc-800 ring-zinc-200"
            : "bg-white text-zinc-900 ring-zinc-200"
        ].join(" ")}
      />
    </label>
  );
}

function ExperienceCard({
  idx,
  value,
  isEditing,
  onChange
}: {
  idx: number;
  value: string;
  isEditing: boolean;
  onChange: (v: string) => void;
}) {
  // Lightweight parser for "Role @ Company — impact" style highlights.
  const parts = value.split("—");
  const left = parts[0]?.trim() ?? "";
  const impact = parts.slice(1).join("—").trim();
  const roleCompanySplit = left.split("@").map((s) => s.trim());
  const role = roleCompanySplit[0] ?? "";
  const company = roleCompanySplit.length > 1 ? roleCompanySplit.slice(1).join("@") : "";

  return (
    <div className="relative overflow-hidden rounded-xl bg-white p-4 ring-1 ring-inset ring-zinc-200">
      <div className="absolute left-0 top-0 h-full w-1.5 bg-gradient-to-b from-teal-600/70 via-teal-500/20 to-transparent" />
      <div className="pl-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-sm font-semibold text-zinc-900">
              {role || `Experience ${idx + 1}`}
            </p>
            {company && <p className="text-xs text-zinc-600">{company}</p>}
          </div>
          <span className="rounded-full bg-zinc-50 px-2 py-1 text-xs font-medium text-zinc-600 ring-1 ring-inset ring-zinc-200">
            Extracted
          </span>
        </div>

        {!isEditing ? (
          <p className="mt-3 text-sm text-zinc-700">
            {impact || value || "—"}
          </p>
        ) : (
          <div className="mt-3">
            <Textarea
              label="Edit experience"
              value={value}
              onChange={onChange}
              disabled={!isEditing}
              rows={3}
              placeholder="Role @ Company — Key impact/responsibility"
            />
          </div>
        )}
      </div>
    </div>
  );
}

function WorkStyleInsight({
  title,
  body
}: {
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-xl bg-white p-4 ring-1 ring-inset ring-zinc-200 transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <p className="text-sm font-semibold text-zinc-900">{title}</p>
      <p className="mt-1 text-sm text-zinc-700">{body}</p>
    </div>
  );
}

function SuccessToast({
  message,
  onClose
}: {
  message: string;
  onClose: () => void;
}) {
  return (
    <div
      className={[
        "mt-4 overflow-hidden rounded-xl bg-teal-50 ring-1 ring-inset ring-teal-100",
        "animate-[toastIn_180ms_ease-out]"
      ].join(" ")}
      role="status"
      aria-live="polite"
    >
      <style jsx>{`
        @keyframes toastIn {
          from {
            opacity: 0;
            transform: translateY(-6px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes checkPop {
          0% {
            transform: scale(0.9);
            opacity: 0;
          }
          70% {
            transform: scale(1.08);
            opacity: 1;
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
      `}</style>

      <div className="flex items-start gap-3 p-3">
        <div className="mt-0.5 grid h-9 w-9 place-items-center rounded-full bg-white ring-1 ring-inset ring-teal-100">
          <CheckIcon className="h-5 w-5 animate-[checkPop_220ms_ease-out]" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-teal-900">{message}</p>
          <p className="mt-0.5 text-xs text-teal-900/70">
            Your updates are saved locally for this session.
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="ml-auto rounded-lg px-2 py-1 text-sm font-medium text-teal-900/70 hover:bg-teal-100 hover:text-teal-900"
          aria-label="Dismiss"
        >
          ×
        </button>
      </div>
    </div>
  );
}

function makeDefaultSkillsFromPersona(persona: DraftPersona) {
  return persona.coreSkills;
}

/**
 * PUBLIC_INTERFACE
 * Draft persona review page with view/edit modes, avatar upload, card sections,
 * save success animation, and confirmation routing to Skill Validation.
 */
export default function DraftPersonaPage() {
  const router = useRouter();

  const [persona, setPersona] = React.useState<DraftPersona | null>(null);
  const [isEditing, setIsEditing] = React.useState(false);

  // Avatar is purely client-side (Object URL) for now.
  const [avatarUrl, setAvatarUrl] = React.useState<string | null>(null);
  const [avatarBump, setAvatarBump] = React.useState(0);

  const [skills, setSkills] = React.useState<string[]>([]);
  const [newSkill, setNewSkill] = React.useState("");

  const [summary, setSummary] = React.useState<string>("");
  const [savedToast, setSavedToast] = React.useState<string | null>(null);

  React.useEffect(() => {
    const state = getPersonaFlowState();
    const draft = state.draftPersona;
    setPersona(draft);

    if (draft) {
      setSkills(makeDefaultSkillsFromPersona(draft));
      // Map existing "careerHighlights" first item to "Professional Summary" feel.
      setSummary(draft.careerHighlights?.[0] ?? "");
    }
  }, []);

  React.useEffect(() => {
    if (!savedToast) return;
    const t = window.setTimeout(() => setSavedToast(null), 2600);
    return () => window.clearTimeout(t);
  }, [savedToast]);

  const onPickAvatar = (file: File) => {
    const lower = file.name.toLowerCase();
    const ok = lower.endsWith(".png") || lower.endsWith(".jpg") || lower.endsWith(".jpeg");
    if (!ok) {
      setSavedToast("Please upload a PNG or JPG image.");
      return;
    }

    const next = URL.createObjectURL(file);
    setAvatarUrl((prev) => {
      // Avoid leaking object URLs.
      if (prev) URL.revokeObjectURL(prev);
      return next;
    });

    // Trigger a subtle "updated" animation.
    setAvatarBump((v) => v + 1);
  };

  const save = () => {
    if (!persona) return;

    // Persist local edits back into the DraftPersona structure.
    const next: DraftPersona = {
      ...persona,
      coreSkills: skills,
      careerHighlights: [
        summary.trim().length > 0 ? summary.trim() : persona.careerHighlights?.[0] ?? "",
        ...(persona.careerHighlights?.slice(1) ?? [])
      ]
    };

    setPersona(next);
    setDraftPersona(next);
    setIsEditing(false);
    setSavedToast("Changes saved successfully.");
  };

  const confirmAndContinue = () => {
    // Ensure latest edits are persisted even if user didn't click Save.
    if (persona) {
      const next: DraftPersona = {
        ...persona,
        coreSkills: skills,
        careerHighlights: [
          summary.trim().length > 0 ? summary.trim() : persona.careerHighlights?.[0] ?? "",
          ...(persona.careerHighlights?.slice(1) ?? [])
        ]
      };
      setDraftPersona(next);
    }

    // Spec: Confirm and Continue must route to the NEW Skill Validation page (AI interview UI).
    router.push("/skill-validation");
  };

  const updateIdentity = (patch: Partial<DraftPersona["professionalIdentity"]>) => {
    setPersona((p) => (p ? { ...p, professionalIdentity: { ...p.professionalIdentity, ...patch } } : p));
  };

  const updateHighlight = (idx: number, v: string) => {
    setPersona((p) =>
      p
        ? { ...p, careerHighlights: p.careerHighlights.map((x, i) => (i === idx ? v : x)) }
        : p
    );
  };

  const addSkill = () => {
    const cleaned = newSkill.trim();
    if (!cleaned) return;
    setSkills((prev) => {
      if (prev.some((s) => s.toLowerCase() === cleaned.toLowerCase())) return prev;
      return [...prev, cleaned];
    });
    setNewSkill("");
  };

  const removeSkill = (value: string) => {
    setSkills((prev) => prev.filter((s) => s !== value));
  };

  // Premium fade-in on initial render (subtle).
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  return (
    <div
      className={[
        "transition-opacity duration-500",
        mounted ? "opacity-100" : "opacity-0"
      ].join(" ")}
    >
      <PageHeader
        title="Draft Persona"
        subtitle="Review your AI-generated persona, make edits, then confirm to validate skills."
        actions={
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm">
              <Link href="/journey/persona/analyze">Back</Link>
            </Button>

            {!isEditing ? (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setIsEditing(true)}
                disabled={!persona}
              >
                Edit Persona
              </Button>
            ) : (
              <Button size="sm" onClick={save} disabled={!persona}>
                Save Changes
              </Button>
            )}
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <aside className="lg:col-span-4">
          <Card title="Journey" description="3-step persona flow (minimal).">
            <ProgressStepper steps={TOP_STEPS} />
          </Card>

          {savedToast && <SuccessToast message={savedToast} onClose={() => setSavedToast(null)} />}

          <div className="mt-4 rounded-xl bg-white p-5 ring-1 ring-inset ring-zinc-200">
            <p className="text-sm font-semibold text-zinc-900">Pro tip</p>
            <p className="mt-1 text-sm text-zinc-700">
              Edit mode lets you correct identity, summary, skills, and your photo. Keep it crisp—this
              persona drives the next recommendations.
            </p>
          </div>
        </aside>

        <section className="lg:col-span-8">
          {!persona ? (
            <Card
              title="No draft persona yet"
              description="Run the AI analysis step to generate your draft persona."
              actions={
                <Button>
                  <Link href="/journey/persona">Go to Upload</Link>
                </Button>
              }
            >
              <p className="text-sm text-zinc-700">
                Upload documents, run analysis, then return here to review and confirm.
              </p>
            </Card>
          ) : (
            <div className="space-y-4">
              {/* Profile header */}
              <Card
                className="overflow-hidden"
                title="Profile"
                description={isEditing ? "Edit your identity details and photo." : "A clean snapshot of your professional identity."}
              >
                <div className="grid grid-cols-1 gap-4 md:grid-cols-12 md:items-start">
                  <div className="md:col-span-4">
                    <div className="flex items-start gap-4 md:flex-col">
                      <div className="relative">
                        <style jsx>{`
                          @keyframes avatarPop {
                            from {
                              transform: scale(0.985);
                              opacity: 0.85;
                            }
                            to {
                              transform: scale(1);
                              opacity: 1;
                            }
                          }
                        `}</style>

                        <button
                          type="button"
                          disabled={!isEditing}
                          onClick={() => {
                            if (!isEditing) return;
                            document.getElementById("persona-avatar-input")?.click();
                          }}
                          className={[
                            "group relative grid h-24 w-24 place-items-center overflow-hidden rounded-full bg-zinc-50 ring-1 ring-inset ring-zinc-200",
                            "transition-all duration-200",
                            isEditing ? "cursor-pointer hover:-translate-y-0.5 hover:shadow-md" : "cursor-default",
                            avatarBump > 0 ? "animate-[avatarPop_220ms_ease-out]" : ""
                          ].join(" ")}
                          aria-label={isEditing ? "Edit profile photo" : "Profile photo"}
                          title={isEditing ? "Change photo" : undefined}
                        >
                          {avatarUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={avatarUrl}
                              alt="Profile avatar"
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <PlaceholderAvatarIcon className="h-10 w-10" />
                          )}

                          {/* Edit overlay */}
                          <span
                            className={[
                              "absolute bottom-1 right-1 grid h-8 w-8 place-items-center rounded-full",
                              "bg-teal-600 shadow-sm ring-2 ring-white",
                              "transition-all duration-200",
                              isEditing
                                ? "opacity-100 translate-y-0"
                                : "opacity-0 translate-y-1 pointer-events-none"
                            ].join(" ")}
                          >
                            <PencilIcon className="h-4 w-4" />
                          </span>
                        </button>

                        <input
                          id="persona-avatar-input"
                          type="file"
                          accept="image/png,image/jpeg"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) onPickAvatar(file);
                            // allow selecting the same file again
                            e.currentTarget.value = "";
                          }}
                        />
                      </div>

                      <div className="min-w-0 md:mt-3">
                        <p className="text-sm font-semibold text-zinc-900">Profile photo</p>
                        <p className="mt-1 text-sm text-zinc-600">
                          {isEditing ? "PNG/JPG. Click avatar to upload or replace." : "Used across your journey views."}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="md:col-span-8">
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <TextInput
                        label="Name"
                        value={persona.professionalIdentity.name}
                        onChange={(v) => updateIdentity({ name: v })}
                        disabled={!isEditing}
                        placeholder="Name"
                      />
                      <TextInput
                        label="Current Role"
                        value={persona.professionalIdentity.currentRole}
                        onChange={(v) => updateIdentity({ currentRole: v })}
                        disabled={!isEditing}
                        placeholder="e.g., Product Manager"
                      />
                      <TextInput
                        label="Years of Experience"
                        value={persona.professionalIdentity.yearsOfExperience}
                        onChange={(v) => updateIdentity({ yearsOfExperience: v })}
                        disabled={!isEditing}
                        placeholder="e.g., 6"
                      />
                      <TextInput
                        label="Primary Domain / Industry"
                        value={persona.professionalIdentity.industry}
                        onChange={(v) => updateIdentity({ industry: v })}
                        disabled={!isEditing}
                        placeholder="e.g., FinTech"
                      />
                      {/* Location is requested by spec; the current data model doesn't include it.
                         We expose a UI-only field to keep the UI aligned without changing the shared type. */}
                      <div className="sm:col-span-2">
                        <label className="block">
                          <span className="text-xs font-medium text-zinc-700">Location</span>
                          <input
                            value={(persona as any).location ?? ""}
                            onChange={(e) =>
                              setPersona((p) => (p ? ({ ...p, location: e.target.value } as any) : p))
                            }
                            disabled={!isEditing}
                            placeholder="e.g., New York, USA"
                            className={[
                              "mt-1 h-10 w-full rounded-lg px-3 text-sm ring-1 ring-inset focus:outline-none focus:ring-2 focus:ring-teal-500/40",
                              !isEditing
                                ? "bg-zinc-50 text-zinc-800 ring-zinc-200"
                                : "bg-white text-zinc-900 ring-zinc-200"
                            ].join(" ")}
                          />
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Professional summary */}
              <Card title="Professional Summary" description="Short, high-signal overview of your professional identity.">
                <Textarea
                  label={isEditing ? "Edit summary" : "Summary"}
                  value={summary}
                  onChange={setSummary}
                  disabled={!isEditing}
                  rows={5}
                  placeholder="A concise summary of your strengths, focus areas, and style."
                />
              </Card>

              {/* Core skills */}
              <Card
                title="Core Skills"
                description="Extracted skills displayed as tags. Add/remove to match how you want to be represented."
              >
                <div className="flex flex-wrap gap-2">
                  {skills.map((s) => (
                    <SkillChip key={s} value={s} isEditing={isEditing} onRemove={() => removeSkill(s)} />
                  ))}
                  {skills.length === 0 && (
                    <p className="text-sm text-zinc-600">No skills yet.</p>
                  )}
                </div>

                {isEditing && (
                  <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
                    <label className="w-full">
                      <span className="sr-only">Add skill</span>
                      <input
                        value={newSkill}
                        onChange={(e) => setNewSkill(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            addSkill();
                          }
                        }}
                        placeholder="Add a skill (e.g., Cloud Architecture)"
                        className="h-10 w-full rounded-lg bg-white px-3 text-sm ring-1 ring-inset ring-zinc-200 focus:outline-none focus:ring-2 focus:ring-teal-500/40"
                      />
                    </label>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={addSkill}
                      disabled={newSkill.trim().length === 0}
                    >
                      Add
                    </Button>
                  </div>
                )}
              </Card>

              {/* Key experiences */}
              <Card
                title="Key Experiences"
                description="Important experiences extracted from your documents. Edit to clarify role, company, and impact."
              >
                <div className="space-y-3">
                  {persona.careerHighlights.map((h, idx) => (
                    <ExperienceCard
                      key={idx}
                      idx={idx}
                      value={h}
                      isEditing={isEditing}
                      onChange={(v) => updateHighlight(idx, v)}
                    />
                  ))}
                </div>
              </Card>

              {/* Behavioral traits / work style (lightweight, derived) */}
              <Card
                title="Behavioral Traits / Work Style"
                description="AI-inferred themes (placeholder). These become sharper after validation."
              >
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <WorkStyleInsight
                    title="Leadership"
                    body="Collaborative, sets direction, and unblocks execution."
                  />
                  <WorkStyleInsight
                    title="Decision-making"
                    body="Balances data with pragmatic tradeoffs under ambiguity."
                  />
                  <WorkStyleInsight
                    title="Collaboration"
                    body="Cross-functional alignment with clear communication."
                  />
                </div>
              </Card>

              {/* CTA */}
              <div className="rounded-2xl bg-gradient-to-b from-white to-zinc-50 p-5 ring-1 ring-inset ring-zinc-200">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-zinc-900">Confirm → Skill Validation</p>
                    <p className="mt-1 text-sm text-zinc-600">
                      When you confirm, we’ll validate key skills with short prompts.
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button onClick={confirmAndContinue} disabled={!persona}>
                      Confirm and Continue
                    </Button>

                    {isEditing ? (
                      <Button variant="secondary" onClick={() => setIsEditing(false)}>
                        Cancel
                      </Button>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
