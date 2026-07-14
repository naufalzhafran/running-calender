import { revalidateTag } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";

import {
  internalServerError,
  invalidPayloadResponse,
  isPocketBaseSlugConflict,
  jsonError,
} from "@/lib/api-responses";
import { withAuthCookie, requireAdminApi } from "@/lib/auth";
import {
  createEvent,
  EVENTS_TAG,
  eventTag,
  listAdminEvents,
} from "@/lib/data";
import { eventPayloadSchema } from "@/lib/validation";

export async function GET() {
  const { pb, unauthorizedResponse } = await requireAdminApi();
  if (unauthorizedResponse || !pb) {
    return unauthorizedResponse;
  }

  try {
    return withAuthCookie(NextResponse.json(await listAdminEvents(pb)), pb);
  } catch {
    return internalServerError();
  }
}

export async function POST(req: NextRequest) {
  const { pb, unauthorizedResponse } = await requireAdminApi();
  if (unauthorizedResponse || !pb) {
    return unauthorizedResponse;
  }

  try {
    const parsed = eventPayloadSchema.safeParse(await req.json());

    if (!parsed.success) {
      return invalidPayloadResponse();
    }

    const event = await createEvent(pb, parsed.data);
    revalidateTag(EVENTS_TAG, "max");
    revalidateTag(eventTag(event.id), "max");

    return withAuthCookie(NextResponse.json(event, { status: 201 }), pb);
  } catch (err: unknown) {
    if (isPocketBaseSlugConflict(err)) {
      return jsonError("Slug already exists", 400);
    }

    return internalServerError();
  }
}
