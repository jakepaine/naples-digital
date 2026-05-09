import { createServerClient } from "@supabase/ssr";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

// Protect everything under /portal — must be signed in.
// /login + /auth/* + /api/* + the home page are public.
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isProtected =
    pathname.startsWith("/portal") || pathname === "/me";
  if (!isProtected) {
    return NextResponse.next();
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    // Auth not configured — let the request through (dev fallback)
    return NextResponse.next();
  }

  const res = NextResponse.next();
  const sb = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return req.cookies.getAll();
      },
      setAll(
        cookiesToSet: Array<{ name: string; value: string; options?: any }>,
      ) {
        for (const { name, value, options } of cookiesToSet) {
          res.cookies.set(name, value, options as any);
        }
      },
    },
  });

  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) {
    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }
  return res;
}

export const config = {
  matcher: ["/portal/:path*", "/me"],
};
