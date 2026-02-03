import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import pool from "@/lib/db";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const client = await pool.connect();
  try {
    const res = await client.query(
      "SELECT * FROM participants WHERE event_id = $1 ORDER BY name ASC",
      [id],
    );
    return NextResponse.json(res.rows);
  } catch (err) {
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 },
    );
  } finally {
    client.release();
  }
}
