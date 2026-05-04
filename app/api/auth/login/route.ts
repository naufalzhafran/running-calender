import { NextRequest, NextResponse } from "next/server";
import { ClientResponseError } from "pocketbase";
import { loginAdmin, withAuthCookie } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    if (!process.env.POCKETBASE_URL) {
      return NextResponse.json(
        { message: "PocketBase is not configured" },
        { status: 500 },
      );
    }

    const { email, password } = await req.json();

    const pb = await loginAdmin(email, password);
    return withAuthCookie(NextResponse.json({ success: true }), pb);
  } catch (error) {
    if (error instanceof ClientResponseError && error.status === 400) {
      return NextResponse.json(
        { message: "Invalid credentials" },
        { status: 401 },
      );
    }
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
}
