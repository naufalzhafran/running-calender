import PocketBase, { type RecordModel } from "pocketbase";

import { type DistanceDetail, type Event, type Participant } from "@/types";

type EventRecord = RecordModel & {
  title: string;
  slug: string;
  event_date: string;
  end_date?: string;
  location: string;
  distance?: DistanceDetail[] | null;
  description?: string;
  created: string;
};

type ParticipantRecord = RecordModel & {
  event_id: string;
  name: string;
  bib_number?: string;
  distance?: string;
  created: string;
};

export const PB_AUTH_COOKIE_NAME = "pb_auth";
export const PB_ADMIN_COLLECTION = process.env.POCKETBASE_ADMIN_COLLECTION || "admins";
export const PB_EVENTS_COLLECTION = "events";
export const PB_PARTICIPANTS_COLLECTION = "participants";

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

export function mapEvent(record: EventRecord): Event {
  return {
    id: record.id,
    title: record.title,
    slug: record.slug,
    event_date: record.event_date,
    end_date: record.end_date || null,
    location: record.location,
    distance: Array.isArray(record.distance) ? record.distance : [],
    description: record.description || null,
    created_at: record.created,
  };
}

export function mapParticipant(record: ParticipantRecord): Participant {
  return {
    id: record.id,
    event_id: record.event_id,
    name: record.name,
    bib_number: record.bib_number || null,
    distance: record.distance || null,
    created_at: record.created,
  };
}
