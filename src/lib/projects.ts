/** Demo project data backing the proof-of-concept project pages. */

/** A single demo project. */
export type Project = {
  /** URL slug used as the dynamic route segment. */
  slug: string;
  /** Display name. */
  name: string;
  /** Short one-line summary. */
  summary: string;
  /** Current lifecycle status. */
  status: "Active" | "Planning" | "On hold";
  /** Completion percentage, 0-100. */
  progress: number;
  /** Owning team or person. */
  owner: string;
};

/** The seed set of demo projects. */
export const PROJECTS: readonly Project[] = [
  {
    slug: "website-redesign",
    name: "Website Redesign",
    summary: "Refresh the marketing site with the new brand system.",
    status: "Active",
    progress: 62,
    owner: "Growth",
  },
  {
    slug: "mobile-app",
    name: "Mobile App",
    summary: "Ship the first native companion app for iOS and Android.",
    status: "Planning",
    progress: 18,
    owner: "Product",
  },
  {
    slug: "billing-migration",
    name: "Billing Migration",
    summary: "Move invoicing onto the new subscription platform.",
    status: "On hold",
    progress: 40,
    owner: "Platform",
  },
];

/**
 * Look up a demo project by its slug.
 * @param slug - The project slug from the URL.
 * @returns The matching project, or `undefined` if none matches.
 */
export function getProjectBySlug(slug: string): Project | undefined {
  return PROJECTS.find((project) => project.slug === slug);
}
