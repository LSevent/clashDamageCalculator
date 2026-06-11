import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

import { cookies } from "next/headers";

import type { AdminAuthState } from "@/src/types/admin";

const adminCookieName = "clash-admin-session";
const sessionPayload = "clash-admin-session:v1";
const sessionMaxAgeSeconds = 60 * 60 * 12;

function getConfiguredAdminKey() {
  return process.env.ADMIN_ACCESS_KEY?.trim();
}

function createSessionToken(adminKey: string) {
  return createHmac("sha256", adminKey).update(sessionPayload).digest("hex");
}

function safeEqual(first: string, second: string) {
  const firstBuffer = Buffer.from(first);
  const secondBuffer = Buffer.from(second);

  return (
    firstBuffer.length === secondBuffer.length &&
    timingSafeEqual(firstBuffer, secondBuffer)
  );
}

export function isAdminConfigured() {
  return Boolean(getConfiguredAdminKey());
}

export function verifyAdminAccessKey(candidate: string) {
  const adminKey = getConfiguredAdminKey();

  return Boolean(adminKey && safeEqual(candidate, adminKey));
}

export async function getAdminAuthState(): Promise<AdminAuthState> {
  const adminKey = getConfiguredAdminKey();

  if (!adminKey) {
    return {
      configured: false,
      authenticated: false,
    };
  }

  const cookieStore = await cookies();
  const cookieValue = cookieStore.get(adminCookieName)?.value;

  return {
    configured: true,
    authenticated: Boolean(
      cookieValue && safeEqual(cookieValue, createSessionToken(adminKey)),
    ),
  };
}

export async function setAdminSessionCookie() {
  const adminKey = getConfiguredAdminKey();

  if (!adminKey) {
    return false;
  }

  const cookieStore = await cookies();
  cookieStore.set(adminCookieName, createSessionToken(adminKey), {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/admin",
    maxAge: sessionMaxAgeSeconds,
  });

  return true;
}

export async function clearAdminSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.set(adminCookieName, "", {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/admin",
    maxAge: 0,
  });
}
