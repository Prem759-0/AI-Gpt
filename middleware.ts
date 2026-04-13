import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

function shouldSkip(pathname: string): boolean {
  return (
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/robots.txt") ||
    pathname.startsWith("/sitemap")
  );
}

export function middleware(request: NextRequest): NextResponse {
  const target = process.env.BRANCH_REDIRECT_URL;
  if (!target || shouldSkip(request.nextUrl.pathname)) {
    return NextResponse.next();
  }

  let targetUrl: URL;
  try {
    targetUrl = new URL(target);
  } catch {
    return NextResponse.next();
  }

  if (request.nextUrl.host === targetUrl.host) {
    return NextResponse.next();
  }

  const redirectUrl = new URL(request.nextUrl.pathname + request.nextUrl.search, targetUrl);
  return NextResponse.redirect(redirectUrl, 307);
}

export const config = {
  matcher: ["/:path*"]
};
