import Link from "next/link";
import type { ReactElement } from "react";
import { signUp } from "@/app/auth/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/**
 * Signup screen. Renders an email/password form wired to the {@link signUp}
 * server action. Errors are passed back via the `?error=` query string after a
 * redirect from the action.
 * @param {object} props - Page props.
 * @param {Promise<{ error?: string }>} props.searchParams - The route's query
 *   parameters.
 * @returns {Promise<ReactElement>} The signup page.
 */
export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}): Promise<ReactElement> {
  const { error } = await searchParams;

  return (
    <main
      id="main-content"
      className="flex min-h-svh items-center justify-center p-4"
    >
      <div className="w-full max-w-sm rounded-xl border border-border bg-card p-6 shadow-sm">
        <h1 className="font-semibold text-xl">Create account</h1>
        <p className="mt-1 text-muted-foreground text-sm">
          Sign up with your email and a password.
        </p>

        {error ? (
          <p className="mt-4 rounded-lg bg-destructive/10 px-3 py-2 text-destructive text-sm">
            {error}
          </p>
        ) : null}

        <form action={signUp} className="mt-6 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5 text-sm">
            <label htmlFor="email" className="font-medium">
              Email
            </label>
            <Input
              id="email"
              type="email"
              name="email"
              autoComplete="email"
              required
              placeholder="you@example.com"
            />
          </div>
          <div className="flex flex-col gap-1.5 text-sm">
            <label htmlFor="password" className="font-medium">
              Password
            </label>
            <Input
              id="password"
              type="password"
              name="password"
              autoComplete="new-password"
              minLength={6}
              required
            />
          </div>
          <Button type="submit" size="lg" className="mt-2">
            Sign up
          </Button>
        </form>

        <p className="mt-6 text-center text-muted-foreground text-sm">
          Already have an account?{" "}
          <Link href="/login" className="text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
