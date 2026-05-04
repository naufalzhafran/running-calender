import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { ClientResponseError } from "pocketbase";
import { requireAdminApi, withAuthCookie } from "@/lib/auth";
import { deleteParticipant } from "@/lib/data";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { pb, unauthorizedResponse } = await requireAdminApi();
  if (unauthorizedResponse || !pb) {
    return unauthorizedResponse;
  }

  try {
    const deleted = await deleteParticipant(pb, id);
    if (!deleted) {
      return NextResponse.json(
        { message: "Participant not found" },
        { status: 404 },
      );
    }

    return withAuthCookie(
      NextResponse.json({ message: "Participant deleted successfully" }),
      pb,
    );
  } catch (err) {
    if (err instanceof ClientResponseError && err.status === 404) {
      return NextResponse.json(
        { message: "Participant not found" },
        { status: 404 },
      );
    }
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 },
    );
  }
}
