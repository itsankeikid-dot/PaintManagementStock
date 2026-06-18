import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const RAW_SECRET = process.env.JWT_SECRET;
if (!RAW_SECRET && process.env.NODE_ENV !== "development") {
  throw new Error("JWT_SECRET environment variable is required in production.");
}
const SECRET = new TextEncoder().encode(
  RAW_SECRET || "dev-only-insecure-fallback"
);

const COOKIE_NAME = "paint_stock_session";
const SESSION_HOURS = 8;

export interface SessionPayload {
  userId: string;
  name: string;
  role: string;
}

/**
 * Creates a signed JWT and sets it as a cookie.
 * Called after successful PIN login.
 *
 * @param payload - User session data (id, name, role)
 */
export async function createSession(payload: SessionPayload): Promise<void> {
  const cookieStore = await cookies();

  const token = await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_HOURS}h`)
    .sign(SECRET);

  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 60 * 60 * SESSION_HOURS,
    path: "/",
  });
}

/**
 * Verifies the session cookie and returns the payload.
 * Returns null if no valid session exists.
 *
 * @returns Session payload or null
 */
export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

/**
 * Requires the current session to have one of the specified roles.
 * Use in server actions to enforce authorization.
 *
 * @param allowedRoles - Array of allowed role strings (e.g. ["admin"])
 * @returns Session payload if authorized
 * @throws Error if not authorized
 */
export async function requireRole(...allowedRoles: string[]): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) {
    throw new Error("Not authenticated");
  }
  if (!allowedRoles.includes(session.role.toLowerCase())) {
    throw new Error("Not authorized");
  }
  return session;
}

/**
 * Removes the session cookie (logout).
 */
export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}
