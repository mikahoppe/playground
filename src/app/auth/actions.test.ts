import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Mimic Next.js's `redirect`, which halts execution by throwing. Carrying the
 * target URL on the thrown error lets tests assert where a redirect pointed.
 */
class RedirectError extends Error {
  constructor(public readonly url: string) {
    super(`REDIRECT:${url}`);
  }
}

const mockRedirect = vi.fn((url: string): never => {
  throw new RedirectError(url);
});
const mockRevalidatePath = vi.fn();

const mockAuth = {
  signInWithPassword: vi.fn(),
  signUp: vi.fn(),
  signOut: vi.fn(),
};

vi.mock("next/navigation", () => ({ redirect: mockRedirect }));
vi.mock("next/cache", () => ({ revalidatePath: mockRevalidatePath }));
vi.mock("@/lib/supabase/server", () => ({
  createClient: () => Promise.resolve({ auth: mockAuth }),
}));

// Imported after the mocks are registered so the actions bind to the stubs.
const { signIn, signUp, signOut } = await import("./actions");

/**
 * Build a `FormData` with the given email/password fields.
 * @param {Record<string, string>} fields - Field entries to append.
 * @returns {FormData} The populated form data.
 */
function formDataOf(fields: Record<string, string>): FormData {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    data.append(key, value);
  }
  return data;
}

describe("auth actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.signInWithPassword.mockResolvedValue({ error: null });
    mockAuth.signUp.mockResolvedValue({
      data: { session: { user: { id: "u1" } } },
      error: null,
    });
    mockAuth.signOut.mockResolvedValue({ error: null });
  });

  describe("signIn", () => {
    it("signs in and redirects home on success", async () => {
      await expect(
        signIn(formDataOf({ email: "a@b.com", password: "secret" })),
      ).rejects.toThrow(RedirectError);

      expect(mockAuth.signInWithPassword).toHaveBeenCalledWith({
        email: "a@b.com",
        password: "secret",
      });
      expect(mockRevalidatePath).toHaveBeenCalledWith("/", "layout");
      expect(mockRedirect).toHaveBeenLastCalledWith("/");
    });

    it("redirects back to /login with the error message on failure", async () => {
      mockAuth.signInWithPassword.mockResolvedValue({
        error: { message: "Invalid login credentials" },
      });

      await expect(
        signIn(formDataOf({ email: "a@b.com", password: "wrong" })),
      ).rejects.toThrow(RedirectError);

      expect(mockRedirect).toHaveBeenLastCalledWith(
        "/login?error=Invalid%20login%20credentials",
      );
      expect(mockRevalidatePath).not.toHaveBeenCalled();
    });

    it("rejects a submission missing credentials before calling Supabase", async () => {
      await expect(signIn(formDataOf({ email: "a@b.com" }))).rejects.toThrow(
        RedirectError,
      );

      expect(mockAuth.signInWithPassword).not.toHaveBeenCalled();
      expect(mockRedirect).toHaveBeenLastCalledWith(
        "/login?error=Enter+your+email+and+password",
      );
    });
  });

  describe("signUp", () => {
    it("signs up and redirects home when a session is returned", async () => {
      await expect(
        signUp(formDataOf({ email: "a@b.com", password: "secret" })),
      ).rejects.toThrow(RedirectError);

      expect(mockAuth.signUp).toHaveBeenCalledWith({
        email: "a@b.com",
        password: "secret",
      });
      expect(mockRedirect).toHaveBeenLastCalledWith("/");
    });

    it("routes to login with a confirmation notice when no session is returned", async () => {
      mockAuth.signUp.mockResolvedValue({
        data: { session: null },
        error: null,
      });

      await expect(
        signUp(formDataOf({ email: "a@b.com", password: "secret" })),
      ).rejects.toThrow(RedirectError);

      expect(mockRedirect).toHaveBeenLastCalledWith(
        "/login?message=Check+your+email+to+confirm+your+account",
      );
    });

    it("redirects back to /signup with the error message on failure", async () => {
      mockAuth.signUp.mockResolvedValue({
        data: { session: null },
        error: { message: "User already registered" },
      });

      await expect(
        signUp(formDataOf({ email: "a@b.com", password: "secret" })),
      ).rejects.toThrow(RedirectError);

      expect(mockRedirect).toHaveBeenLastCalledWith(
        "/signup?error=User%20already%20registered",
      );
    });
  });

  describe("signOut", () => {
    it("signs out and redirects to /login", async () => {
      await expect(signOut()).rejects.toThrow(RedirectError);

      expect(mockAuth.signOut).toHaveBeenCalledOnce();
      expect(mockRevalidatePath).toHaveBeenCalledWith("/", "layout");
      expect(mockRedirect).toHaveBeenLastCalledWith("/login");
    });
  });
});
