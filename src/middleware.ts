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
  const host = (req.headers.get("host") || "").toLowerCase();
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
        response.headers.set(
          "Access-Control-Allow-Methods",
          "GET, POST, PUT, DELETE, OPTIONS, PATCH"
        );
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
      response.headers.set(
        "Access-Control-Allow-Methods",
        "GET, POST, PUT, DELETE, OPTIONS, PATCH"
      );
      response.headers.set(
        "Access-Control-Allow-Headers",
        "Content-Type, Authorization, X-Requested-With, apikey"
      );
    }
    return response;
  }

  // Skip static assets, favicon, images, and next internals
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
    host === "admin.duskk.in" ||
    host.startsWith("admin.localhost");

  // 2. Routing for Admin Subdomain (e.g. admin.duskk.in)
  if (isAdminSubdomain) {
    // If user accesses /admin directly on admin subdomain, redirect to clean path
    if (pathname === "/admin") {
      url.pathname = "/";
      return NextResponse.redirect(url);
    }
    if (pathname.startsWith("/admin/")) {
      url.pathname = pathname.replace(/^\/admin/, "");
      return NextResponse.redirect(url);
    }

    // Rewrite clean paths to internal /admin routes
    // e.g. admin.duskk.in/ -> /admin
    // e.g. admin.duskk.in/products -> /admin/products
    // e.g. admin.duskk.in/login -> /admin/login
    url.pathname = `/admin${pathname === "/" ? "" : pathname}`;
    return NextResponse.rewrite(url);
  }

  // 3. Routing for Main Storefront (duskk.in / www.duskk.in)
  // In production, prevent accessing /admin under duskk.in domain and redirect to admin.duskk.in
  const isProductionHost =
    host.includes("duskk.in") ||
    (process.env.NODE_ENV === "production" && !host.includes("localhost"));

  if (isProductionHost && (pathname === "/admin" || pathname.startsWith("/admin/"))) {
    const subpath = pathname === "/admin" ? "" : pathname.replace(/^\/admin/, "");
    return NextResponse.redirect(new URL(`https://admin.duskk.in${subpath}`, req.url));
  }

  // Local development (localhost:3000) or standard storefront routes pass through directly
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
