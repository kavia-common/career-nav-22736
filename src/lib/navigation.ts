export type NavItem = {
  label: string;
  href: string;
  description?: string;
};

/**
 * Primary application navigation items shown in the sidebar.
 *
 * Updated product flow:
 * Landing Page
 * → Build Persona (Document Upload)
 * → Draft Persona Review
 * → Skill Validation
 * → Multiverse Explorer
 * → Destination Selection
 * → Delta (Gap Analysis)
 * → Roadmap
 * → Marketplace
 */
export const PRIMARY_NAV: NavItem[] = [
  { label: "Dashboard", href: "/dashboard" },

  // Build Persona (Document Upload)
  { label: "Build Persona", href: "/journey/build-profile" },

  // Draft Persona Review (kept as a direct nav target for MVP usability)
  { label: "Draft Persona", href: "/journey/persona/draft" },

  { label: "Skill Validation", href: "/skill-validation" },
  { label: "Multiverse Explorer", href: "/multiverse" },
  { label: "Destination Selection", href: "/destination" },
  { label: "Delta (Gap Analysis)", href: "/gap-analysis" },
  { label: "Roadmap", href: "/roadmap" },
  { label: "Marketplace", href: "/marketplace" }
];
