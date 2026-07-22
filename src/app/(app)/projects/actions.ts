"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

/** Outcome of a project mutation: either success or a human-readable error. */
export type ActionResult = { error: string } | { error: null };

/**
 * Outcome of creating a project: on success it carries the new row's id so the
 * caller can register an undo (soft-delete) for it.
 */
export type CreateResult = { error: string } | { error: null; id: string };

const OK: ActionResult = { error: null };

/**
 * Resolve the signed-in user's id, or `null` when there is no session.
 * @returns {Promise<string | null>} The user id, or `null`.
 */
async function currentUserId(): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}

/**
 * Create a project owned by the signed-in user. The database defaults
 * `created_by` to `auth.uid()`, so only the name is written here.
 * @param {FormData} formData - The submitted form (`name`).
 * @returns {Promise<CreateResult>} The new id on success, or an error.
 */
export async function createProject(formData: FormData): Promise<CreateResult> {
  const raw = formData.get("name");
  const name = typeof raw === "string" ? raw.trim() : "";
  if (!name) {
    return { error: "Enter a project name." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("projects")
    .insert({ name })
    .select("id")
    .single();
  if (error) {
    return { error: error.message };
  }

  revalidatePath("/projects");
  return { error: null, id: (data as { id: string }).id };
}

/**
 * Archive a project (soft): record who archived it and when. Scoped to the
 * signed-in creator by row-level security.
 * @param {string} id - The project id to archive.
 * @returns {Promise<ActionResult>} Success, or an auth/database error.
 */
export async function archiveProject(id: string): Promise<ActionResult> {
  const userId = await currentUserId();
  if (!userId) {
    return { error: "You must be signed in." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("projects")
    .update({ archived_at: new Date().toISOString(), archived_by: userId })
    .eq("id", id);
  if (error) {
    return { error: error.message };
  }

  revalidatePath("/projects");
  return OK;
}

/**
 * Delete a project (soft): record who deleted it and when. The row is kept so
 * the audit trail survives; reads filter deleted rows out.
 * @param {string} id - The project id to delete.
 * @returns {Promise<ActionResult>} Success, or an auth/database error.
 */
export async function deleteProject(id: string): Promise<ActionResult> {
  const userId = await currentUserId();
  if (!userId) {
    return { error: "You must be signed in." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("projects")
    .update({ deleted_at: new Date().toISOString(), deleted_by: userId })
    .eq("id", id);
  if (error) {
    return { error: error.message };
  }

  revalidatePath("/projects");
  return OK;
}

/**
 * Reverse an archive: clear the archive columns. The inverse of
 * {@link archiveProject}, used by undo.
 * @param {string} id - The project id to unarchive.
 * @returns {Promise<ActionResult>} Success, or a database error.
 */
export async function unarchiveProject(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("projects")
    .update({ archived_at: null, archived_by: null })
    .eq("id", id);
  if (error) {
    return { error: error.message };
  }

  revalidatePath("/projects");
  return OK;
}

/**
 * Reverse a soft delete: clear the delete columns so the project reappears.
 * The inverse of {@link deleteProject}, used by undo.
 * @param {string} id - The project id to restore.
 * @returns {Promise<ActionResult>} Success, or a database error.
 */
export async function restoreProject(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("projects")
    .update({ deleted_at: null, deleted_by: null })
    .eq("id", id);
  if (error) {
    return { error: error.message };
  }

  revalidatePath("/projects");
  return OK;
}
