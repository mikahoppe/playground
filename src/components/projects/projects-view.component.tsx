"use client";

import {
  useActionState,
  useCallback,
  useEffect,
  useOptimistic,
  useRef,
  useState,
  useTransition,
} from "react";
import {
  type ActionResult,
  archiveProject,
  createProject,
  deleteProject,
} from "@/app/(app)/projects/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { applyOptimistic, type Project } from "@/lib/projects";
import { getCachedProjects, saveCachedProjects } from "@/lib/projects-db";

const NO_ERROR: ActionResult = { error: null };

/**
 * A single project row with archive and delete controls. The controls call the
 * handlers passed down, which apply the optimistic change and run the server
 * action; `isPending` disables them while any mutation is in flight.
 * @param {object} props - Component props.
 * @param {Project} props.project - The project to render.
 * @param {boolean} props.isPending - Whether a mutation is in flight.
 * @param {(id: string) => void} props.onArchive - Archive handler.
 * @param {(id: string) => void} props.onDelete - Delete handler.
 * @returns {ReactElement} The list item.
 */
function ProjectItem({
  project,
  isPending,
  onArchive,
  onDelete,
}: {
  project: Project;
  isPending: boolean;
  onArchive: (id: string) => void;
  onDelete: (id: string) => void;
}): React.ReactElement {
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
            onClick={() => onArchive(project.id)}
          >
            Archive
          </Button>
        )}
        <Button
          type="button"
          variant="destructive"
          size="sm"
          disabled={isPending}
          onClick={() => onDelete(project.id)}
        >
          Delete
        </Button>
      </span>
    </li>
  );
}

/**
 * Track whether the browser is currently offline, updating on connectivity
 * changes.
 * @returns {boolean} `true` when `navigator.onLine` is false.
 */
function useIsOffline(): boolean {
  const [isOffline, setIsOffline] = useState(false);
  const subscribe = useCallback((): (() => void) => {
    const sync = (): void => setIsOffline(!navigator.onLine);
    sync();
    window.addEventListener("online", sync);
    window.addEventListener("offline", sync);
    return (): void => {
      window.removeEventListener("online", sync);
      window.removeEventListener("offline", sync);
    };
  }, []);
  useEffect(() => subscribe(), [subscribe]);
  return isOffline;
}

/**
 * The `/projects` view: a form to add a project and a list of the signed-in
 * user's projects with archive and delete controls.
 *
 * The server component supplies the authoritative `projects`; that list is
 * mirrored into IndexedDB on every change and read back as the render source
 * only while offline. Mutations apply an optimistic change immediately, then
 * run the server action; `revalidatePath` feeds fresh props back in, which
 * resets the optimistic overlay (and rolls it back if the action failed).
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
  const isOffline = useIsOffline();
  const [cached, setCached] = useState<Project[] | null>(null);

  // Hydrate the offline fallback once; mirror server truth on every change.
  const hydrateCache = useCallback((): void => {
    getCachedProjects().then(setCached);
  }, []);
  const mirrorCache = useCallback((): void => {
    void saveCachedProjects(projects);
  }, [projects]);
  useEffect(() => hydrateCache(), [hydrateCache]);
  useEffect(() => mirrorCache(), [mirrorCache]);

  // Trust the server when online; fall back to the cache only when offline.
  const base = isOffline && cached ? cached : projects;
  const [optimisticProjects, addOptimistic] = useOptimistic(
    base,
    applyOptimistic,
  );

  const [isMutating, startMutation] = useTransition();
  const [state, formAction, isCreating] = useActionState(
    async (_prev: ActionResult, formData: FormData) => {
      const name = String(formData.get("name") ?? "").trim();
      if (name) {
        addOptimistic({
          type: "create",
          project: {
            id: `optimistic-${crypto.randomUUID()}`,
            name,
            createdAt: new Date().toISOString(),
            createdBy: "",
            archivedAt: null,
            archivedBy: null,
            deletedAt: null,
            deletedBy: null,
          },
        });
      }
      const result = await createProject(formData);
      if (result.error === null) {
        formRef.current?.reset();
      }
      return result;
    },
    NO_ERROR,
  );

  const onArchiveProject = (id: string): void => {
    startMutation(async () => {
      addOptimistic({
        type: "archive",
        id,
        at: new Date().toISOString(),
        by: "",
      });
      await archiveProject(id);
    });
  };

  const onDeleteProject = (id: string): void => {
    startMutation(async () => {
      addOptimistic({ type: "delete", id });
      await deleteProject(id);
    });
  };

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
          disabled={isCreating}
        />
        <Button type="submit" disabled={isCreating}>
          Add project
        </Button>
      </form>
      {state.error && (
        <p role="alert" className="-mt-4 text-destructive text-sm">
          {state.error}
        </p>
      )}

      {optimisticProjects.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          No projects yet. Add your first one above.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {optimisticProjects.map((project) => (
            <ProjectItem
              key={project.id}
              project={project}
              isPending={isMutating}
              onArchive={onArchiveProject}
              onDelete={onDeleteProject}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
