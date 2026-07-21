import type { Metadata } from "next";
import type { ReactElement } from "react";
import { ProjectsView } from "@/components/projects/projects-view.component";
import {
  mapProjectRow,
  PROJECT_COLUMNS,
  type ProjectRow,
} from "@/lib/projects";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Projects",
};

/**
 * The `/projects` route. Fetches the signed-in user's non-deleted projects
 * (row-level security scopes this to their own rows) newest first and hands
 * them to the client view. Mutations happen through server actions.
 * @returns {Promise<ReactElement>} The rendered projects page.
 */
export default async function ProjectsPage(): Promise<ReactElement> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("projects")
    .select(PROJECT_COLUMNS)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  const projects = ((data as ProjectRow[] | null) ?? []).map(mapProjectRow);

  return <ProjectsView projects={projects} />;
}
