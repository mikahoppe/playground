/**
 * Project entities backing the `/projects` route.
 *
 * A project carries only a display `name` plus lifecycle audit fields. All
 * three lifecycle events are recorded as an "at" timestamp and a "by" user id;
 * archiving and deleting are soft (the row stays, the columns are set).
 *
 * The table shape lives in `supabase/migrations`; this module holds the
 * TypeScript view of it and the row → domain mapping used by the page and
 * server actions.
 */

/** A project row exactly as stored in Supabase (snake_case columns). */
export type ProjectRow = {
  id: string;
  name: string;
  created_at: string;
  created_by: string;
  archived_at: string | null;
  archived_by: string | null;
  deleted_at: string | null;
  deleted_by: string | null;
};

/** A project in the shape the app works with (camelCase). */
export type Project = {
  /** Primary key. */
  id: string;
  /** Display name. */
  name: string;
  /** ISO timestamp the project was created. */
  createdAt: string;
  /** User id that created the project. */
  createdBy: string;
  /** ISO timestamp the project was archived, or `null` if not archived. */
  archivedAt: string | null;
  /** User id that archived the project, or `null`. */
  archivedBy: string | null;
  /** ISO timestamp the project was (soft) deleted, or `null`. */
  deletedAt: string | null;
  /** User id that deleted the project, or `null`. */
  deletedBy: string | null;
};

/** Columns selected for every project read, kept in sync with {@link ProjectRow}. */
export const PROJECT_COLUMNS =
  "id, name, created_at, created_by, archived_at, archived_by, deleted_at, deleted_by";

/**
 * Map a raw Supabase row to the app's {@link Project} shape.
 * @param row - The row as returned by Supabase.
 * @returns The project in camelCase form.
 */
export function mapProjectRow(row: ProjectRow): Project {
  return {
    id: row.id,
    name: row.name,
    createdAt: row.created_at,
    createdBy: row.created_by,
    archivedAt: row.archived_at,
    archivedBy: row.archived_by,
    deletedAt: row.deleted_at,
    deletedBy: row.deleted_by,
  };
}

/**
 * Whether a project is archived (and not deleted).
 * @param project - The project to test.
 * @returns `true` when the project has been archived but not deleted.
 */
export function isArchived(project: Project): boolean {
  return project.archivedAt !== null && project.deletedAt === null;
}
