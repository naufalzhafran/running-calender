import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { query } from "@/lib/db";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const res = await query(
      "DELETE FROM participants WHERE id = $1 RETURNING *",
      [id],
    );

    if (res.rowCount === 0) {
      return NextResponse.json(
        { message: "Participant not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ message: "Participant deleted successfully" });
  } catch (err) {
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 },
    );
  }
}
