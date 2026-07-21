"use client";

import { useActionState, useRef, useTransition } from "react";
import {
  type ActionResult,
  archiveProject,
  createProject,
  deleteProject,
} from "@/app/(app)/projects/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Project } from "@/lib/projects";

const NO_ERROR: ActionResult = { error: null };

/**
 * A single project row with archive and delete controls.
 * @param {object} props - Component props.
 * @param {Project} props.project - The project to render.
 * @returns {ReactElement} The list item.
 */
function ProjectItem({ project }: { project: Project }): React.ReactElement {
  const [isPending, startTransition] = useTransition();
  const isArchived = project.archivedAt !== null;

  return (
    <li className="flex items-center justify-between gap-3 rounded-lg border border-border bg-background px-3 py-2">
      <span className="flex items-center gap-2 truncate">
        <span className="truncate font-medium">{project.name}</span>
        {isArchived && (
          <span className="rounded bg-muted px-1.5 py-0.5 text-muted-foreground text-xs">
            Archived
          </span>
        )}
      </span>
      <span className="flex shrink-0 gap-1.5">
        {!isArchived && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isPending}
            onClick={() => {
              startTransition(async () => {
                await archiveProject(project.id);
              });
            }}
          >
            Archive
          </Button>
        )}
        <Button
          type="button"
          variant="destructive"
          size="sm"
          disabled={isPending}
          onClick={() => {
            startTransition(async () => {
              await deleteProject(project.id);
            });
          }}
        >
          Delete
        </Button>
      </span>
    </li>
  );
}

/**
 * The `/projects` view: a form to add a project and a list of the signed-in
 * user's projects with archive and delete controls. Data is fetched by the
 * server component and passed in; mutations run through server actions that
 * revalidate the route.
 * @param {object} props - Component props.
 * @param {Project[]} props.projects - Non-deleted projects, newest first.
 * @returns {ReactElement} The projects page body.
 */
export function ProjectsView({
  projects,
}: {
  projects: Project[];
}): React.ReactElement {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, isPending] = useActionState(
    async (_prev: ActionResult, formData: FormData) => {
      const result = await createProject(formData);
      if (result.error === null) {
        formRef.current?.reset();
      }
      return result;
    },
    NO_ERROR,
  );

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div>
        <h1 className="font-semibold text-2xl">Projects</h1>
        <p className="text-muted-foreground text-sm">
          Create projects and manage their lifecycle.
        </p>
      </div>

      <form ref={formRef} action={formAction} className="flex gap-2">
        <Input
          name="name"
          placeholder="New project name"
          aria-label="New project name"
          autoComplete="off"
          required
          disabled={isPending}
        />
        <Button type="submit" disabled={isPending}>
          Add project
        </Button>
      </form>
      {state.error && (
        <p role="alert" className="-mt-4 text-destructive text-sm">
          {state.error}
        </p>
      )}

      {projects.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          No projects yet. Add your first one above.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {projects.map((project) => (
            <ProjectItem key={project.id} project={project} />
          ))}
        </ul>
      )}
    </div>
  );
}
