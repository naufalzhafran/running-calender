import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type PocketBase from "pocketbase";

import {
  createPocketBaseClient,
  createPocketBaseFromCookie,
  exportPocketBaseCookie,
  PB_ADMIN_COLLECTION,
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

export function clearAuthCookie() {
  const pb = createPocketBaseClient();
  pb.authStore.clear();

  const response = NextResponse.json({ success: true });
  response.headers.set("Set-Cookie", exportPocketBaseCookie(pb));
  return response;
}
