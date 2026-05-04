import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { createParticipant } from "@/lib/data";
import { requireAdminApi, withAuthCookie } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const { pb, unauthorizedResponse } = await requireAdminApi();
  if (unauthorizedResponse || !pb) {
    return unauthorizedResponse;
  }

  try {
    const body = await req.json();
    const { event_id, name, bib_number, distance } = body;

    const participant = await createParticipant(pb, {
      event_id,
      name,
      bib_number,
      distance,
    });

    return withAuthCookie(NextResponse.json(participant, { status: 201 }), pb);
  } catch {
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 },
    );
  }
}
