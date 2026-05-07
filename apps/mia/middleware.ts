import { NextResponse, type NextRequest } from "next/server";

const COOKIE_NAME = "naples_admin_auth";

export function middleware(req: NextRequest) {
  if (req.nextUrl.pathname.startsWith("/login")) return NextResponse.next();
  if (req.nextUrl.pathname.startsWith("/api/login")) return NextResponse.next();
  if (req.nextUrl.pathname.startsWith("/_next")) return NextResponse.next();
  if (req.nextUrl.pathname.startsWith("/favicon")) return NextResponse.next();

  const cookie = req.cookies.get(COOKIE_NAME)?.value;
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return NextResponse.next();
  if (cookie !== expected) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("from", req.nextUrl.pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon).*)"],
};
