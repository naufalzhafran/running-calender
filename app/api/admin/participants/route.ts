import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import pool from "@/lib/db";

export async function POST(req: NextRequest) {
  const client = await pool.connect();
  try {
    const body = await req.json();
    const { event_id, name, bib_number } = body;

    const res = await client.query(
      "INSERT INTO participants (event_id, name, bib_number) VALUES ($1, $2, $3) RETURNING *",
      [event_id, name, bib_number],
    );

    return NextResponse.json(res.rows[0], { status: 201 });
  } catch (err: any) {
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 },
    );
  } finally {
    client.release();
  }
}
