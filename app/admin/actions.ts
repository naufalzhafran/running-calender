"use server";

import { updateTag } from "next/cache";

import {
  deleteAuthCookie,
  getAuthenticatedAdminClient,
  syncAuthCookie,
} from "@/lib/auth";
import {
  createEvent,
  deleteEvent,
  EVENTS_TAG,
  eventTag,
  updateEvent,
} from "@/lib/data";
import {
  isPocketBaseNotFound,
  isPocketBaseSlugConflict,
} from "@/lib/api-responses";
import { eventPayloadSchema } from "@/lib/validation";
import { clearWallpaperResponseCacheForEvent } from "@/lib/wallpaper-response-cache";
import { type Event } from "@/types";

type EventActionResult =
  | { ok: true; event: Event }
  | { ok: false; message: string };

type DeleteEventActionResult =
  | { ok: true }
  | { ok: false; message: string };

type LogoutActionResult = { ok: true };

function invalidateEventCaches(id: string) {
  updateTag(EVENTS_TAG);
  updateTag(eventTag(id));
}

async function getAdminClient() {
  const pb = await getAuthenticatedAdminClient();

  if (!pb) {
    return null;
  }

  await syncAuthCookie(pb);
  return pb;
}

export async function createEventAction(
  payload: unknown,
): Promise<EventActionResult> {
  const pb = await getAdminClient();

  if (!pb) {
    return { ok: false, message: "Unauthorized" };
  }

  const parsed = eventPayloadSchema.safeParse(payload);

  if (!parsed.success) {
    return { ok: false, message: "Data event tidak valid" };
  }

  try {
    const event = await createEvent(pb, parsed.data);
    invalidateEventCaches(event.id);
    return { ok: true, event };
  } catch (error) {
    if (isPocketBaseSlugConflict(error)) {
      return { ok: false, message: "Slug sudah digunakan" };
    }

    return { ok: false, message: "Gagal membuat event" };
  }
}

export async function updateEventAction(
  id: string,
  payload: unknown,
): Promise<EventActionResult> {
  const pb = await getAdminClient();

  if (!pb) {
    return { ok: false, message: "Unauthorized" };
  }

  const parsed = eventPayloadSchema.safeParse(payload);

  if (!parsed.success) {
    return { ok: false, message: "Data event tidak valid" };
  }

  try {
    const event = await updateEvent(pb, id, parsed.data);
    clearWallpaperResponseCacheForEvent(id);
    invalidateEventCaches(id);
    return { ok: true, event };
  } catch (error) {
    if (isPocketBaseNotFound(error)) {
      return { ok: false, message: "Event tidak ditemukan" };
    }

    if (isPocketBaseSlugConflict(error)) {
      return { ok: false, message: "Slug sudah digunakan" };
    }

    return { ok: false, message: "Gagal memperbarui event" };
  }
}

export async function deleteEventAction(
  id: string,
): Promise<DeleteEventActionResult> {
  const pb = await getAdminClient();

  if (!pb) {
    return { ok: false, message: "Unauthorized" };
  }

  try {
    const deleted = await deleteEvent(pb, id);

    if (!deleted) {
      return { ok: false, message: "Event tidak ditemukan" };
    }

    clearWallpaperResponseCacheForEvent(id);
    invalidateEventCaches(id);
    return { ok: true };
  } catch (error) {
    if (isPocketBaseNotFound(error)) {
      return { ok: false, message: "Event tidak ditemukan" };
    }

    return { ok: false, message: "Gagal menghapus event" };
  }
}

export async function logoutAdminAction(): Promise<LogoutActionResult> {
  await deleteAuthCookie();
  return { ok: true };
}
