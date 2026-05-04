import { jwtVerify, SignJWT, type JWTPayload } from "jose";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

function getJwtSecret() {
  const jwtSecret = process.env.JWT_SECRET;

  if (!jwtSecret) {
    throw new Error("JWT_SECRET is not configured");
  }

  return new TextEncoder().encode(jwtSecret);
}

export async function signJWT(payload: Record<string, unknown>) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(getJwtSecret());
}

export async function verifyJWT(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getJwtSecret());
    return payload;
  } catch {
    return null;
  }
}

export async function requireAdmin() {
  const token = (await cookies()).get("token")?.value;

  if (!token) {
    return null;
  }

  const payload = await verifyJWT(token);

  if (!payload || payload.role !== "admin") {
    return null;
  }

  return payload;
}

export async function requireAdminApi() {
  const payload = await requireAdmin();

  if (!payload) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  return null;
}
