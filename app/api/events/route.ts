import { NextResponse } from "next/server";

import { internalServerError } from "@/lib/api-responses";
import { listEvents } from "@/lib/data";

export async function GET() {
  try {
    return NextResponse.json(await listEvents());
  } catch {
    return internalServerError();
  }
}
