import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type PocketBase from "pocketbase";

import {
  createPocketBaseClient,
  createPocketBaseFromCookie,
  exportPocketBaseCookie,
  PB_ADMIN_COLLECTION,
  PB_AUTH_COOKIE_NAME,
} from "@/lib/pocketbase";

async function getCookieHeader() {
  const cookieStore = await cookies();

  return cookieStore
    .getAll()
    .map(({ name, value }) => `${name}=${value}`)
    .join("; ");
}

export async function loginAdmin(email: string, password: string) {
  const pb = createPocketBaseClient();
  await pb.collection(PB_ADMIN_COLLECTION).authWithPassword(email, password, {
    requestKey: null,
  });
  return pb;
}

export async function getAuthenticatedAdminClient() {
  const pb = createPocketBaseFromCookie(await getCookieHeader());

  if (!pb.authStore.isValid) {
    return null;
  }

  try {
    await pb.collection(PB_ADMIN_COLLECTION).authRefresh({
      requestKey: null,
    });
  } catch {
    pb.authStore.clear();
    return null;
  }

  return pb;
}

export async function requireAdmin() {
  const pb = await getAuthenticatedAdminClient();
  return pb?.authStore.record ?? null;
}

export async function requireAdminApi() {
  const pb = await getAuthenticatedAdminClient();

  if (!pb) {
    return {
      pb: null,
      unauthorizedResponse: NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 },
      ),
    };
  }

  return {
    pb,
    unauthorizedResponse: null,
  };
}

export function withAuthCookie<T extends NextResponse>(response: T, pb: PocketBase) {
  response.headers.set("Set-Cookie", exportPocketBaseCookie(pb));
  return response;
}

function getTokenExpiration(token: string) {
  const payload = token.split(".")[1];

  if (!payload) {
    return new Date("1970-01-01");
  }

  try {
    const decoded = JSON.parse(Buffer.from(payload, "base64url").toString());

    if (typeof decoded.exp === "number") {
      return new Date(decoded.exp * 1000);
    }
  } catch {
    return new Date("1970-01-01");
  }

  return new Date("1970-01-01");
}

export async function syncAuthCookie(pb: PocketBase) {
  const cookieStore = await cookies();
  const record = pb.authStore.record
    ? JSON.parse(JSON.stringify(pb.authStore.record))
    : null;

  cookieStore.set(
    PB_AUTH_COOKIE_NAME,
    JSON.stringify({
      token: pb.authStore.token,
      record,
    }),
    {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      expires: getTokenExpiration(pb.authStore.token),
    },
  );
}

export async function deleteAuthCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(PB_AUTH_COOKIE_NAME);
}

export function clearAuthCookie() {
  const pb = createPocketBaseClient();
  pb.authStore.clear();

  const response = NextResponse.json({ success: true });
  response.headers.set("Set-Cookie", exportPocketBaseCookie(pb));
  return response;
}
