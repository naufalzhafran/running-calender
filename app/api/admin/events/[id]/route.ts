import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import pool from "@/lib/db";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const client = await pool.connect();
  try {
    const body = await req.json();
    const { title, slug, event_date, location, distance, description } = body;

    const res = await client.query(
      "UPDATE events SET title = $1, slug = $2, event_date = $3, location = $4, distance = $5, description = $6 WHERE id = $7 RETURNING *",
      [title, slug, event_date, location, distance, description, id],
    );

    if (res.rowCount === 0) {
      return NextResponse.json({ message: "Event not found" }, { status: 404 });
    }

    return NextResponse.json(res.rows[0]);
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

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const client = await pool.connect();
  try {
    const res = await client.query(
      "DELETE FROM events WHERE id = $1 RETURNING *",
      [id],
    );

    if (res.rowCount === 0) {
      return NextResponse.json({ message: "Event not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Event deleted successfully" });
  } catch (err) {
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 },
    );
  } finally {
    client.release();
  }
}
