import { NextRequest, NextResponse } from "next/server";

const ALLOWED_ORIGINS = [
  "https://duskk.in",
  "https://www.duskk.in",
  "https://admin.duskk.in",
  "http://localhost:3000",
  "http://admin.localhost:3000",
];

export function middleware(req: NextRequest) {
  const url = req.nextUrl.clone();
  const host = req.headers.get("host") || "";
  const origin = req.headers.get("origin");
  const pathname = url.pathname;

  // 1. CORS Preflight & Response Headers for API Routes
  if (pathname.startsWith("/api/")) {
    const isAllowedOrigin = origin && ALLOWED_ORIGINS.includes(origin);
    const corsOrigin = isAllowedOrigin ? origin : ALLOWED_ORIGINS[0];

    // Handle OPTIONS Preflight
    if (req.method === "OPTIONS") {
      const response = new NextResponse(null, { status: 204 });
      if (origin && isAllowedOrigin) {
        response.headers.set("Access-Control-Allow-Origin", corsOrigin);
        response.headers.set("Access-Control-Allow-Credentials", "true");
        response.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS, PATCH");
        response.headers.set(
          "Access-Control-Allow-Headers",
          "Content-Type, Authorization, X-Requested-With, apikey"
        );
        response.headers.set("Access-Control-Max-Age", "86400");
      }
      return response;
    }

    // Pass through with CORS headers
    const response = NextResponse.next();
    if (origin && isAllowedOrigin) {
      response.headers.set("Access-Control-Allow-Origin", corsOrigin);
      response.headers.set("Access-Control-Allow-Credentials", "true");
      response.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS, PATCH");
      response.headers.set(
        "Access-Control-Allow-Headers",
        "Content-Type, Authorization, X-Requested-With, apikey"
      );
    }
    return response;
  }

  // Skip static assets and internal next requests
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/static") ||
    pathname.includes(".") ||
    pathname.startsWith("/api")
  ) {
    return NextResponse.next();
  }

  const isAdminSubdomain =
    host.startsWith("admin.") ||
    host === "admin.duskk.in";

  // 2. Routing for Admin Subdomain (admin.duskk.in)
  if (isAdminSubdomain) {
    // If accessing root "/" on admin subdomain, rewrite to "/admin"
    if (pathname === "/") {
      url.pathname = "/admin";
      return NextResponse.rewrite(url);
    }

    // If path doesn't already start with /admin, rewrite it under /admin
    if (!pathname.startsWith("/admin")) {
      url.pathname = `/admin${pathname}`;
      return NextResponse.rewrite(url);
    }

    return NextResponse.next();
  }

  // 3. Routing for Main Storefront (duskk.in)
  // In production, prevent accessing /admin under duskk.in domain
  if (process.env.NODE_ENV === "production" && pathname.startsWith("/admin")) {
    return NextResponse.redirect(new URL("https://admin.duskk.in", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
