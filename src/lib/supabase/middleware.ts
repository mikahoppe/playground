import { createServerClient, type SetAllCookies } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import { requireEnv } from "@/lib/env";

/**
 * Route prefixes reachable without a session. Everything else requires an
 * authenticated user; unauthenticated requests are redirected to `/login`.
 */
const PUBLIC_ROUTES: string[] = ["/login", "/signup", "/auth"];

/**
 * Refresh the Supabase session cookie on every request and gate access. Must
 * run in middleware so tokens stay fresh for Server Components. When there is
 * no authenticated user and the request targets a non-public route, the
 * visitor is redirected to `/login`.
 * @param {NextRequest} request - The incoming request.
 * @returns {Promise<NextResponse>} The response carrying refreshed cookies, or
 *   a redirect to the login page.
 */
export async function updateSession(
  request: NextRequest,
): Promise<NextResponse> {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requireEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"),
    {
      cookies: {
        getAll(): ReturnType<typeof request.cookies.getAll> {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: Parameters<SetAllCookies>[0]): void {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          supabaseResponse = NextResponse.next({
            request,
          });
          for (const { name, value, options } of cookiesToSet) {
            supabaseResponse.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  // IMPORTANT: no logic between creating the client and getUser() — the token
  // must be refreshed before anything else reads the session.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isPublicRoute = PUBLIC_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );

  if (!user && !isPublicRoute) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.search = "";
    return NextResponse.redirect(loginUrl);
  }

  return supabaseResponse;
}
