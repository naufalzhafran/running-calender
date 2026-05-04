import { NextRequest, NextResponse } from "next/server";
import { signJWT } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    if (!process.env.ADMIN_USER || !process.env.ADMIN_PASS) {
      return NextResponse.json(
        { message: "Admin credentials are not configured" },
        { status: 500 },
      );
    }

    const { username, password } = await req.json();

    if (
      username === process.env.ADMIN_USER &&
      password === process.env.ADMIN_PASS
    ) {
      const token = await signJWT({ role: "admin" });

      const response = NextResponse.json({ success: true });
      response.cookies.set("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/",
        maxAge: 60 * 60 * 24, // 24 hours
      });

      return response;
    }

    return NextResponse.json(
      { message: "Invalid credentials" },
      { status: 401 },
    );
  } catch {
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
}
