import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { ClientResponseError } from "pocketbase";
import { requireAdminApi, withAuthCookie } from "@/lib/auth";
import { deleteEvent, updateEvent } from "@/lib/data";
import { eventPayloadSchema } from "@/lib/validation";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { pb, unauthorizedResponse } = await requireAdminApi();
  if (unauthorizedResponse || !pb) {
    return unauthorizedResponse;
  }

  try {
    const parsed = eventPayloadSchema.safeParse(await req.json());

    if (!parsed.success) {
      return NextResponse.json(
        { message: "Invalid event payload" },
        { status: 400 },
      );
    }

    const {
      title,
      slug,
      event_date,
      end_date,
      location,
      distance,
      description,
    } = parsed.data;

    const event = await updateEvent(pb, id, {
      title,
      slug,
      event_date,
      end_date,
      location,
      distance,
      description,
    });

    return withAuthCookie(NextResponse.json(event), pb);
  } catch (err: unknown) {
    if (err instanceof ClientResponseError && err.status === 404) {
      return NextResponse.json({ message: "Event not found" }, { status: 404 });
    }
    if (
      err instanceof ClientResponseError &&
      err.status === 400 &&
      typeof err.response?.data?.slug?.message === "string"
    ) {
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
  const { pb, unauthorizedResponse } = await requireAdminApi();
  if (unauthorizedResponse || !pb) {
    return unauthorizedResponse;
  }

  try {
    const deleted = await deleteEvent(pb, id);
    if (!deleted) {
      return NextResponse.json({ message: "Event not found" }, { status: 404 });
    }
    return withAuthCookie(
      NextResponse.json({ message: "Event deleted successfully" }),
      pb,
    );
  } catch (err) {
    if (err instanceof ClientResponseError && err.status === 404) {
      return NextResponse.json({ message: "Event not found" }, { status: 404 });
    }
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 },
    );
  }
}
