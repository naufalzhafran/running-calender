import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { query } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      title,
      slug,
      event_date,
      end_date,
      location,
      distance,
      description,
    } = body;

    const res = await query(
      "INSERT INTO events (title, slug, event_date, end_date, location, distance, description) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *",
      [title, slug, event_date, end_date, location, distance, description],
    );

    return NextResponse.json(res.rows[0], { status: 201 });
  } catch (err: unknown) {
    if (err && typeof err === 'object' && 'code' in err && err.code === "23505") {
      return NextResponse.json(
        { message: "Slug already exists" },
        { status: 400 },
      );
    }
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 },
    );
  }
}
