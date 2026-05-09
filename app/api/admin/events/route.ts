import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { withAuthCookie, requireAdminApi } from "@/lib/auth";
import { createEvent } from "@/lib/data";
import { ClientResponseError } from "pocketbase";
import { eventPayloadSchema } from "@/lib/validation";

export async function POST(req: NextRequest) {
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

    const event = await createEvent(pb, {
      title,
      slug,
      event_date,
      end_date,
      location,
      distance,
      description,
    });

    return withAuthCookie(NextResponse.json(event, { status: 201 }), pb);
  } catch (err: unknown) {
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
