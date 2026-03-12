"use client";

/**
 * Shared utilities for the 3-step persona onboarding flow.
 *
 * This is intentionally UI-only / local-first:
 * - Uploaded documents are represented as lightweight metadata (name/size/type).
 * - The draft persona is placeholder data seeded after "AI analysis".
 *
 * When backend integration is added, replace these with real API calls and server state.
 */

export type UploadedDocMeta = {
  id: string;
  name: string;
  size: number;
  type: string;
  addedAt: string; // ISO date
};

export type DraftPersona = {
  professionalIdentity: {
    name: string;
    currentRole: string;
    yearsOfExperience: string;
    industry: string;
  };
  coreSkills: string[];
  careerHighlights: string[];
  domainExpertise: string[];
};

type PersonaFlowState = {
  docs: UploadedDocMeta[];
  linkedInConnected: boolean;
  draftPersona: DraftPersona | null;
};

const STORAGE_KEY = "career_nav.persona_flow.v1";

function safeParse(json: string | null): PersonaFlowState | null {
  if (!json) return null;
  try {
    return JSON.parse(json) as PersonaFlowState;
  } catch {
    return null;
  }
}

function getDefaultState(): PersonaFlowState {
  return {
    docs: [],
    linkedInConnected: false,
    draftPersona: null
  };
}

/**
 * PUBLIC_INTERFACE
 * Read the persona flow state from localStorage.
 */
export function getPersonaFlowState(): PersonaFlowState {
  if (typeof window === "undefined") return getDefaultState();
  const parsed = safeParse(window.localStorage.getItem(STORAGE_KEY));
  return parsed ?? getDefaultState();
}

/**
 * PUBLIC_INTERFACE
 * Write persona flow state to localStorage.
 */
export function setPersonaFlowState(next: PersonaFlowState) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}

/**
 * PUBLIC_INTERFACE
 * Add a document metadata entry to state.
 */
export function addPersonaDoc(meta: UploadedDocMeta) {
  const state = getPersonaFlowState();
  setPersonaFlowState({
    ...state,
    docs: [meta, ...state.docs]
  });
}

/**
 * PUBLIC_INTERFACE
 * Remove a document metadata entry from state by id.
 */
export function removePersonaDoc(id: string) {
  const state = getPersonaFlowState();
  setPersonaFlowState({
    ...state,
    docs: state.docs.filter((d) => d.id !== id)
  });
}

/**
 * PUBLIC_INTERFACE
 * Set LinkedIn connection status in state.
 */
export function setLinkedInConnected(connected: boolean) {
  const state = getPersonaFlowState();
  setPersonaFlowState({
    ...state,
    linkedInConnected: connected
  });
}

/**
 * PUBLIC_INTERFACE
 * Save a draft persona into state.
 */
export function setDraftPersona(persona: DraftPersona) {
  const state = getPersonaFlowState();
  setPersonaFlowState({
    ...state,
    draftPersona: persona
  });
}

/**
 * PUBLIC_INTERFACE
 * Clear all persona flow state (docs, LinkedIn connection, persona).
 */
export function resetPersonaFlow() {
  setPersonaFlowState(getDefaultState());
}

/**
 * PUBLIC_INTERFACE
 * Deterministically seed a placeholder persona based on uploaded documents + LinkedIn status.
 * Used after the AI analysis screen completes.
 */
export function buildPlaceholderDraftPersona(input: {
  docs: UploadedDocMeta[];
  linkedInConnected: boolean;
}): DraftPersona {
  const hasDocs = input.docs.length > 0;
  const sourceNote = input.linkedInConnected && hasDocs ? "docs + LinkedIn" : input.linkedInConnected ? "LinkedIn" : "docs";

  const coreSkills = [
    "Communication",
    "Stakeholder management",
    "Problem solving",
    "Project execution"
  ];

  // Add a couple "document-shaped" skills to make the UI feel responsive to uploads.
  const extraFromDocs = input.docs
    .slice(0, 2)
    .map((d) => d.name.toLowerCase())
    .some((n) => n.includes("product") || n.includes("pm"))
    ? ["Product strategy", "Roadmapping"]
    : ["Collaboration", "Analytical thinking"];

  return {
    professionalIdentity: {
      name: "Draft (AI-extracted)",
      currentRole: "Role inferred from uploads",
      yearsOfExperience: "—",
      industry: `Inferred (${sourceNote})`
    },
    coreSkills: [...new Set([...coreSkills, ...extraFromDocs])],
    careerHighlights: [
      "Delivered measurable impact across cross-functional initiatives.",
      "Owned ambiguous problems end-to-end and shipped iterative improvements.",
      "Built repeatable processes to improve team execution quality."
    ],
    domainExpertise: ["Generalist", "Systems thinking", "Customer-facing work"]
  };
}
