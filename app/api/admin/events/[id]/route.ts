import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { requireAdminApi } from "@/lib/auth";
import { query } from "@/lib/db";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const unauthorizedResponse = await requireAdminApi();
  if (unauthorizedResponse) {
    return unauthorizedResponse;
  }

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
      "UPDATE events SET title = $1, slug = $2, event_date = $3, end_date = $4, location = $5, distance = $6, description = $7 WHERE id = $8 RETURNING *",
      [title, slug, event_date, end_date, location, distance, description, id],
    );

    if (res.rowCount === 0) {
      return NextResponse.json({ message: "Event not found" }, { status: 404 });
    }

    return NextResponse.json(res.rows[0]);
  } catch (err: unknown) {
    if (err && typeof err === "object" && "code" in err && err.code === "23505") {
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

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const unauthorizedResponse = await requireAdminApi();
  if (unauthorizedResponse) {
    return unauthorizedResponse;
  }

  try {
    const res = await query(
      "DELETE FROM events WHERE id = $1 RETURNING *",
      [id],
    );

    if (res.rowCount === 0) {
      return NextResponse.json({ message: "Event not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Event deleted successfully" });
  } catch {
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 },
    );
  }
}
