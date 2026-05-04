import { NextResponse } from "next/server";
import { listEvents } from "@/lib/data";

export async function GET() {
  try {
    return NextResponse.json(await listEvents());
  } catch {
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 },
    );
  }
}
