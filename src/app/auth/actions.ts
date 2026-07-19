"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * Read and validate the email/password pair from a submitted auth form.
 * @param {FormData} formData - The submitted form data.
 * @returns {{ email: string; password: string } | null} The credentials, or
 *   `null` when either field is missing.
 */
function readCredentials(
  formData: FormData,
): { email: string; password: string } | null {
  const email = formData.get("email");
  const password = formData.get("password");

  if (typeof email !== "string" || typeof password !== "string") {
    return null;
  }

  return { email, password };
}

/**
 * Sign in an existing user with email and password. On success the session
 * cookie is written and the user is sent to the app root; on failure they are
 * returned to `/login` with an error message in the query string.
 * @param {FormData} formData - The login form data (`email`, `password`).
 * @returns {Promise<void>} Never returns — always redirects.
 */
export async function signIn(formData: FormData): Promise<void> {
  const credentials = readCredentials(formData);
  if (!credentials) {
    redirect("/login?error=Enter+your+email+and+password");
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(credentials);

  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/", "layout");
  redirect("/");
}

/**
 * Register a new user with email and password. When the Supabase project
 * requires email confirmation, no session is created until the user confirms;
 * that case is surfaced on the signup page. On failure the user is returned to
 * `/signup` with an error message.
 * @param {FormData} formData - The signup form data (`email`, `password`).
 * @returns {Promise<void>} Never returns — always redirects.
 */
export async function signUp(formData: FormData): Promise<void> {
  const credentials = readCredentials(formData);
  if (!credentials) {
    redirect("/signup?error=Enter+your+email+and+password");
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp(credentials);

  if (error) {
    redirect(`/signup?error=${encodeURIComponent(error.message)}`);
  }

  // Email confirmation enabled: signUp succeeds but no session is returned.
  if (!data.session) {
    redirect("/login?message=Check+your+email+to+confirm+your+account");
  }

  revalidatePath("/", "layout");
  redirect("/");
}

/**
 * Sign the current user out and return them to the login page.
 * @returns {Promise<void>} Never returns — always redirects.
 */
export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();

  revalidatePath("/", "layout");
  redirect("/login");
}
