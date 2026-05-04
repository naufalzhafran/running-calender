import { ClientResponseError } from "pocketbase";

import {
  createPocketBaseClient,
  mapEvent,
  mapParticipant,
  PB_EVENTS_COLLECTION,
  PB_PARTICIPANTS_COLLECTION,
} from "@/lib/pocketbase";
import { type DistanceDetail } from "@/types";

function createPublicClient() {
  return createPocketBaseClient();
}

function isNotFoundError(error: unknown) {
  return error instanceof ClientResponseError && error.status === 404;
}

export async function listEvents() {
  const pb = createPublicClient();
  const records = await pb.collection(PB_EVENTS_COLLECTION).getFullList({
    sort: "event_date",
    requestKey: null,
  });

  return records.map((record) => mapEvent(record as never));
}

export async function getEventById(id: string) {
  const pb = createPublicClient();

  try {
    const record = await pb.collection(PB_EVENTS_COLLECTION).getOne(id, {
      requestKey: null,
    });

    return mapEvent(record as never);
  } catch (error) {
    if (isNotFoundError(error)) {
      return null;
    }

    throw error;
  }
}

export async function listParticipantsByEventId(eventId: string) {
  const pb = createPublicClient();
  const records = await pb.collection(PB_PARTICIPANTS_COLLECTION).getFullList({
    filter: pb.filter("event_id = {:eventId}", { eventId }),
    sort: "name",
    requestKey: null,
  });

  return records.map((record) => mapParticipant(record as never));
}

type EventInput = {
  title: string;
  slug: string;
  event_date: string;
  end_date: string | null;
  location: string;
  distance: DistanceDetail[];
  description: string | null;
};

type ParticipantInput = {
  event_id: string;
  name: string;
  bib_number?: string | null;
  distance?: string | null;
};

function normalizeEventPayload(input: EventInput) {
  return {
    title: input.title,
    slug: input.slug,
    event_date: input.event_date,
    end_date: input.end_date || "",
    location: input.location,
    distance: input.distance,
    description: input.description || "",
  };
}

export async function createEvent(pb: ReturnType<typeof createPocketBaseClient>, input: EventInput) {
  const record = await pb.collection(PB_EVENTS_COLLECTION).create(
    normalizeEventPayload(input),
    { requestKey: null },
  );

  return mapEvent(record as never);
}

export async function updateEvent(
  pb: ReturnType<typeof createPocketBaseClient>,
  id: string,
  input: EventInput,
) {
  const record = await pb.collection(PB_EVENTS_COLLECTION).update(
    id,
    normalizeEventPayload(input),
    { requestKey: null },
  );

  return mapEvent(record as never);
}

export async function deleteEvent(pb: ReturnType<typeof createPocketBaseClient>, id: string) {
  return pb.collection(PB_EVENTS_COLLECTION).delete(id, { requestKey: null });
}

export async function createParticipant(
  pb: ReturnType<typeof createPocketBaseClient>,
  input: ParticipantInput,
) {
  const record = await pb.collection(PB_PARTICIPANTS_COLLECTION).create(
    {
      event_id: input.event_id,
      name: input.name,
      bib_number: input.bib_number || "",
      distance: input.distance || "",
    },
    { requestKey: null },
  );

  return mapParticipant(record as never);
}

export async function deleteParticipant(
  pb: ReturnType<typeof createPocketBaseClient>,
  id: string,
) {
  return pb.collection(PB_PARTICIPANTS_COLLECTION).delete(id, {
    requestKey: null,
  });
}
