import { redirect } from "next/navigation";

/**
 * Career Roadmap (top-level route)
 *
 * Keep /roadmap stable for navigation; the implementation lives under /journey/roadmap.
 */
export default function RoadmapPage() {
  redirect("/journey/roadmap");
}
