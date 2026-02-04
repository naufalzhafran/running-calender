import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import pool from "@/lib/db";

export async function POST(req: NextRequest) {
  const client = await pool.connect();
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

    const res = await client.query(
      "INSERT INTO events (title, slug, event_date, end_date, location, distance, description) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *",
      [title, slug, event_date, end_date, location, distance, description],
    );

    return NextResponse.json(res.rows[0], { status: 201 });
  } catch (err: any) {
    if (err.code === "23505") {
      // Unique violation for slug
      return NextResponse.json(
        { message: "Slug already exists" },
        { status: 400 },
      );
    }
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 },
    );
  } finally {
    client.release();
  }
}
