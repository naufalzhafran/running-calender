import { revalidateTag } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";

import {
  internalServerError,
  invalidPayloadResponse,
  isPocketBaseNotFound,
  isPocketBaseSlugConflict,
  jsonError,
  notFoundResponse,
} from "@/lib/api-responses";
import { requireAdminApi, withAuthCookie } from "@/lib/auth";
import { deleteEvent, EVENTS_TAG, eventTag, updateEvent } from "@/lib/data";
import { eventPayloadSchema } from "@/lib/validation";
import { clearWallpaperResponseCacheForEvent } from "@/lib/wallpaper-response-cache";

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
      return invalidPayloadResponse();
    }

    const event = await updateEvent(pb, id, parsed.data);
    clearWallpaperResponseCacheForEvent(id);
    revalidateTag(EVENTS_TAG, "max");
    revalidateTag(eventTag(id), "max");

    return withAuthCookie(NextResponse.json(event), pb);
  } catch (err: unknown) {
    if (isPocketBaseNotFound(err)) {
      return notFoundResponse();
    }

    if (isPocketBaseSlugConflict(err)) {
      return jsonError("Slug already exists", 400);
    }

    return internalServerError();
  }
}

export async function DELETE(
  _request: NextRequest,
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
      return notFoundResponse();
    }

    clearWallpaperResponseCacheForEvent(id);
    revalidateTag(EVENTS_TAG, "max");
    revalidateTag(eventTag(id), "max");
    return withAuthCookie(
      NextResponse.json({ message: "Event deleted successfully" }),
      pb,
    );
  } catch (err) {
    if (isPocketBaseNotFound(err)) {
      return notFoundResponse();
    }

    return internalServerError();
  }
}
