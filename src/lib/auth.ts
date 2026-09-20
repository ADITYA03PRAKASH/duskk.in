import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase/admin";

const JWT_SECRET = process.env.JWT_SECRET || "duskk_super_secret_jwt_key_2026_modern_fashion_platform";
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

export async function getSessionAdmin(): Promise<AdminPayload | null> {
  const cookieStore = cookies();
  const token = cookieStore.get(ADMIN_TOKEN_COOKIE)?.value;
  if (!token) return null;

  const payload = verifyToken<AdminPayload>(token);
  if (!payload) return null;

  return payload;
}

export async function getSessionUser(): Promise<UserPayload | null> {
  const cookieStore = cookies();
  const token = cookieStore.get(USER_TOKEN_COOKIE)?.value;
  if (!token) return null;

  const payload = verifyToken<UserPayload>(token);
  if (!payload) return null;

  return payload;
}

export { ADMIN_TOKEN_COOKIE, USER_TOKEN_COOKIE };
