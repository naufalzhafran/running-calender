import PocketBase, { type RecordModel } from "pocketbase";

import { type DistanceDetail, type Event, type EventSummary } from "@/types";

export type EventSummaryRecord = RecordModel & {
  title: string;
  event_date: string;
  end_date?: string;
  location: string;
  distance?: DistanceDetail[] | null;
  created: string;
};

export type EventRecord = EventSummaryRecord & {
  slug: string;
  description?: string;
};

export const PB_AUTH_COOKIE_NAME = "pb_auth";
export const PB_ADMIN_COLLECTION = process.env.POCKETBASE_ADMIN_COLLECTION || "admins";
export const PB_EVENTS_COLLECTION = "events";

function getPocketBaseUrl() {
  const url = process.env.POCKETBASE_URL;

  if (!url) {
    throw new Error("POCKETBASE_URL is not configured");
  }

  return url;
}

export function createPocketBaseClient() {
  const client = new PocketBase(getPocketBaseUrl());
  client.autoCancellation(false);
  return client;
}

export function createPocketBaseFromCookie(cookieHeader?: string) {
  const client = createPocketBaseClient();
  client.authStore.loadFromCookie(cookieHeader ?? "", PB_AUTH_COOKIE_NAME);
  return client;
}

export function exportPocketBaseCookie(client: PocketBase) {
  return client.authStore.exportToCookie(
    {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
    },
    PB_AUTH_COOKIE_NAME,
  );
}

export function mapEventSummary(record: EventSummaryRecord): EventSummary {
  return {
    id: record.id,
    title: record.title,
    event_date: record.event_date,
    end_date: record.end_date || null,
    location: record.location,
    distance: Array.isArray(record.distance) ? record.distance : [],
    created_at: record.created,
  };
}

export function mapEvent(record: EventRecord): Event {
  return {
    ...mapEventSummary(record),
    slug: record.slug,
    description: record.description || null,
  };
}
