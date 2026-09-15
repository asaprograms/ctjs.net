import type { AuthenticatedUser, Rank, User } from "app/api";
import jwt from "jsonwebtoken";
import type { ReadonlyRequestCookies } from "next/dist/server/web/spec-extension/adapters/request-cookies";
import type { RequestCookies, ResponseCookies } from "next/dist/server/web/spec-extension/cookies";
import type { NextRequest, NextResponse } from "next/server";

const JWT_ISSUER = "ChatTriggers";

export interface Session {
  id: string;
  name: string;
  createdAt: number;
  email: string;
  emailVerified: boolean;
  rank: Rank;
}

function createJWT(value: object): string {
  return jwt.sign(value, process.env.JWT_SECRET, {
    audience: process.env.NEXT_PUBLIC_WEB_ROOT,
    expiresIn: "14d",
    issuer: JWT_ISSUER,
  });
}

function decodeJWT(token: string): object | undefined {
  const value = jwt.verify(token, process.env.JWT_SECRET, {
    audience: process.env.NEXT_PUBLIC_WEB_ROOT,
    issuer: JWT_ISSUER,
  });

  if (typeof value === "string") return undefined;

  return value;
}

function getSession(cookies: RequestCookies | ReadonlyRequestCookies): Session | undefined {
  const cookie = cookies.get(process.env.JWT_COOKIE_NAME);
  if (!cookie) return;

  const token = decodeJWT(cookie.value);
  if (!token) return;

  // Basic sanity check
  if (!("ctUser" in token)) return;

  return token.ctUser as Session;
}

export function getSessionFromCookies(cookies: ReadonlyRequestCookies): Session | undefined {
  return getSession(cookies);
}

export function getSessionFromRequest(req: NextRequest): Session | undefined {
  return getSession(req.cookies);
}

export function setSession(
  cookies: ReadonlyRequestCookies | ResponseCookies,
  user: AuthenticatedUser | null,
) {
  if (!user) {
    cookies.delete(process.env.JWT_COOKIE_NAME);
    return;
  }

  cookies.set({
    name: process.env.JWT_COOKIE_NAME,
    value: createJWT({
      ctUser: {
        id: user.id,
        name: user.name,
        email: user.email,
        emailVerified: user.email_verified,
        rank: user.rank,
        createdAt: user.created_at,
      },
    }),
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  });
}
