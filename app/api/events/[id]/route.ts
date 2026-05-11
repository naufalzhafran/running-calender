import { NextResponse, type NextRequest } from "next/server";

import { internalServerError, notFoundResponse } from "@/lib/api-responses";
import { getEventById } from "@/lib/data";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  try {
    const event = await getEventById(id);

    if (!event) {
      return notFoundResponse();
    }

    return NextResponse.json(event);
  } catch {
    return internalServerError();
  }
}
