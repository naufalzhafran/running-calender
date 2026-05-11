import { NextRequest, NextResponse } from "next/server";
import { ClientResponseError } from "pocketbase";

import { internalServerError, jsonError } from "@/lib/api-responses";
import { loginAdmin, withAuthCookie } from "@/lib/auth";
import { checkRateLimit, getRateLimitClientIp } from "@/lib/rate-limit";
import { loginPayloadSchema } from "@/lib/validation";

const LOGIN_ATTEMPT_LIMIT = 10;
const LOGIN_WINDOW_MS = 15 * 60 * 1000;

export async function POST(req: NextRequest) {
  try {
    if (!process.env.POCKETBASE_URL) {
      return jsonError("PocketBase is not configured", 500);
    }

    const parsed = loginPayloadSchema.safeParse(await req.json());

    if (!parsed.success) {
      return jsonError("Invalid request payload", 400);
    }

    const { email, password } = parsed.data;
    const clientIp = getRateLimitClientIp(req.headers.get("x-forwarded-for"));
    const limiter = checkRateLimit(
      `login:${clientIp}:${email.toLowerCase()}`,
      LOGIN_ATTEMPT_LIMIT,
      LOGIN_WINDOW_MS,
    );

    if (!limiter.allowed) {
      return NextResponse.json(
        { message: "Too many login attempts. Try again later." },
        {
          status: 429,
          headers: {
            "Retry-After": String(limiter.retryAfterSeconds),
          },
        },
      );
    }

    const pb = await loginAdmin(email, password);
    return withAuthCookie(NextResponse.json({ success: true }), pb);
  } catch (error) {
    if (error instanceof ClientResponseError && error.status === 400) {
      return jsonError("Invalid credentials", 401);
    }

    return internalServerError("Internal server error");
  }
}
