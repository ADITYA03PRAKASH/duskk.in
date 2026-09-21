import { NextRequest, NextResponse } from "next/server";

const ALLOWED_ORIGINS = [
  "https://duskk.in",
  "https://www.duskk.in",
  "https://admin.duskk.in",
  "https://duskkin.vercel.app",
  "http://localhost:3000",
  "http://admin.localhost:3000",
];

export function middleware(req: NextRequest) {
  const url = req.nextUrl.clone();
  const rawHost = req.headers.get("host") || "";
  // Strip port if present (e.g. localhost:3000 -> localhost)
  const hostname = rawHost.split(":")[0].toLowerCase();
  const origin = req.headers.get("origin");
  const pathname = url.pathname;

  // 1. CORS Preflight & Response Headers for API Routes
  if (pathname.startsWith("/api/")) {
    const isAllowedOrigin =
      origin &&
      (ALLOWED_ORIGINS.includes(origin) || origin.endsWith(".vercel.app"));
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

  // 2. Admin Subdomain Routing (admin.duskk.in, admin.localhost)
  const isAdminSubdomain =
    hostname === "admin.duskk.in" ||
    hostname === "admin.localhost" ||
    hostname.startsWith("admin.");

  if (isAdminSubdomain) {
    // If a user explicitly accesses /admin or /admin/* on the admin subdomain,
    // redirect them to the clean path (e.g. admin.duskk.in/admin/products -> admin.duskk.in/products)
    if (pathname === "/admin") {
      url.pathname = "/";
      return NextResponse.redirect(url);
    }
    if (pathname.startsWith("/admin/")) {
      url.pathname = pathname.replace(/^\/admin/, "");
      return NextResponse.redirect(url);
    }

    // Internal Rewrite (NOT a browser redirect):
    // https://admin.duskk.in/          -> internally renders /admin
    // https://admin.duskk.in/login     -> internally renders /admin/login
    // https://admin.duskk.in/products  -> internally renders /admin/products
    // https://admin.duskk.in/orders    -> internally renders /admin/orders
    // https://admin.duskk.in/categories-> internally renders /admin/categories
    // https://admin.duskk.in/cms       -> internally renders /admin/cms
    // https://admin.duskk.in/customers -> internally renders /admin/customers
    // https://admin.duskk.in/inventory -> internally renders /admin/inventory
    // https://admin.duskk.in/coupons   -> internally renders /admin/coupons
    url.pathname = `/admin${pathname === "/" ? "" : pathname}`;
    return NextResponse.rewrite(url);
  }

  // 3. Custom Production Storefront Domains (duskk.in & www.duskk.in)
  // If someone manually accesses https://duskk.in/admin or https://www.duskk.in/admin,
  // redirect them to the dedicated admin portal https://admin.duskk.in
  const isCustomStorefrontDomain =
    hostname === "duskk.in" ||
    hostname === "www.duskk.in";

  if (isCustomStorefrontDomain && (pathname === "/admin" || pathname.startsWith("/admin/"))) {
    const subpath = pathname === "/admin" ? "" : pathname.replace(/^\/admin/, "");
    return NextResponse.redirect(new URL(`https://admin.duskk.in${subpath}`, req.url));
  }

  // 4. Vercel Preview Domains (duskkin.vercel.app, *.vercel.app) & Localhost (localhost:3000)
  // These pass through directly so / and /admin/* work out of the box for testing and dev
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
