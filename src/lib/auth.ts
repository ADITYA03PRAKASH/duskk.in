import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase/admin";

const JWT_SECRET: string =
  process.env.JWT_SECRET || "duskk_jwt_secret_fallback_key";

if (!process.env.JWT_SECRET) {
  console.warn(
    "[Auth] Warning: JWT_SECRET environment variable is not defined. Using build-safe fallback."
  );
}
const ADMIN_TOKEN_COOKIE = "duskk_admin_token";
const USER_TOKEN_COOKIE = "duskk_user_token";

export interface AdminPayload {
  id: string;
  email: string;
  name: string;
  role: string;
}

export interface UserPayload {
  id: string;
  email: string;
  name: string;
}

export function signAdminToken(admin: AdminPayload): string {
  return jwt.sign(admin, JWT_SECRET, { expiresIn: "7d" });
}

export function signUserToken(user: UserPayload): string {
  return jwt.sign(user, JWT_SECRET, { expiresIn: "30d" });
}

export function verifyToken<T>(token: string): T | null {
  try {
    return jwt.verify(token, JWT_SECRET) as T;
  } catch {
    return null;
  }
}

export async function getSessionAdmin(req?: any): Promise<AdminPayload | null> {
  let token: string | undefined;

  if (req) {
    if (req.cookies && typeof req.cookies.get === "function") {
      token = req.cookies.get(ADMIN_TOKEN_COOKIE)?.value;
    }
    if (!token && req.headers) {
      const cookieHeader = typeof req.headers.get === "function" ? req.headers.get("cookie") : req.headers.cookie;
      if (cookieHeader) {
        const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${ADMIN_TOKEN_COOKIE}=([^;]*)`));
        if (match) token = match[1];
      }
      if (!token) {
        const authHeader = typeof req.headers.get === "function" ? req.headers.get("authorization") : req.headers.authorization;
        if (authHeader && authHeader.startsWith("Bearer ")) {
          token = authHeader.substring(7);
        }
      }
    }
  }

  if (!token) {
    try {
      const cookieStore = cookies();
      token = cookieStore.get(ADMIN_TOKEN_COOKIE)?.value;
    } catch {
      // outside request async storage context
    }
  }

  if (!token) return null;

  const payload = verifyToken<AdminPayload>(token);
  if (!payload) return null;

  return payload;
}

export async function getSessionUser(req?: any): Promise<UserPayload | null> {
  let token: string | undefined;

  if (req) {
    if (req.cookies && typeof req.cookies.get === "function") {
      token = req.cookies.get(USER_TOKEN_COOKIE)?.value;
    }
    if (!token && req.headers) {
      const cookieHeader = typeof req.headers.get === "function" ? req.headers.get("cookie") : req.headers.cookie;
      if (cookieHeader) {
        const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${USER_TOKEN_COOKIE}=([^;]*)`));
        if (match) token = match[1];
      }
    }
  }

  if (!token) {
    try {
      const cookieStore = cookies();
      token = cookieStore.get(USER_TOKEN_COOKIE)?.value;
    } catch {
      // outside request async storage context
    }
  }

  if (!token) return null;

  const payload = verifyToken<UserPayload>(token);
  if (!payload) return null;

  return payload;
}

export { ADMIN_TOKEN_COOKIE, USER_TOKEN_COOKIE };
