import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { query } from "@/lib/db";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const res = await query(
      "SELECT * FROM participants WHERE event_id = $1 ORDER BY name ASC",
      [id],
    );
    return NextResponse.json(res.rows);
  } catch {
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 },
    );
  }
}
