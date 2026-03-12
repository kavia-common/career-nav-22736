import { redirect } from "next/navigation";

/**
 * Legacy route kept for backwards compatibility with earlier MVP iterations.
 * The current UX starts with Build Persona (document upload).
 */
export default function OnboardingPage() {
  redirect("/journey/build-profile");
}
