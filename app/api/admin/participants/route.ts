import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { query } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { event_id, name, bib_number, distance } = body;

    const res = await query(
      "INSERT INTO participants (event_id, name, bib_number, distance) VALUES ($1, $2, $3, $4) RETURNING *",
      [event_id, name, bib_number, distance],
    );

    return NextResponse.json(res.rows[0], { status: 201 });
  } catch (err: any) {
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 },
    );
  }
}
