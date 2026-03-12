import { redirect } from "next/navigation";

/**
 * Legacy route: Career Strategy Workspace (removed).
 *
 * The planning tools were moved into Roadmap (Mind Map / Delta + Pathway tabs).
 */
export default function CareerStrategyRedirectPage() {
  redirect("/journey/roadmap");
}
