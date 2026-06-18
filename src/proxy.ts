import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";

const RAW_SECRET = process.env.JWT_SECRET;
if (!RAW_SECRET && process.env.NODE_ENV !== "development") {
  throw new Error("JWT_SECRET environment variable is required in production.");
}
const SECRET = new TextEncoder().encode(
  RAW_SECRET || "dev-only-insecure-fallback"
);
const COOKIE_NAME = "paint_stock_session";

/** Role → default landing page */
const ROLE_ROUTES: Record<string, string> = {
  warehouse: "/warehouse",
  sideroom: "/sideroom",
  admin: "/dashboard",
};

/**
 * Next.js proxy (formerly middleware) - runs on every request.
 * Verifies JWT session cookie and protects routes.
 * No Supabase Auth dependency.
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protected routes
  const protectedRoutes = ["/warehouse", "/sideroom", "/admin", "/dashboard"];
  const isProtected = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // Check session
  let sessionValid = false;
  let sessionRole = "";
  const token = request.cookies.get(COOKIE_NAME)?.value;

  if (token) {
    try {
      const { payload } = await jwtVerify(token, SECRET);
      sessionValid = true;
      sessionRole = (payload.role as string) || "";
    } catch {
      sessionValid = false;
    }
  }

  // Redirect to login if accessing protected route without valid session
  if (isProtected && !sessionValid) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Redirect to role-specific landing page if already logged in and visiting login page
  if (pathname === "/login" && sessionValid) {
    const url = request.nextUrl.clone();
    url.pathname = ROLE_ROUTES[sessionRole] || "/dashboard";
    return NextResponse.redirect(url);
  }

  // Add security headers to all responses
  const response = NextResponse.next();
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico (favicon)
     * - public folder assets
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
