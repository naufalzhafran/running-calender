import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { listParticipantsByEventId } from "@/lib/data";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    return NextResponse.json(await listParticipantsByEventId(id));
  } catch {
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 },
    );
  }
}
