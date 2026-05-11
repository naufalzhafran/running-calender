import { getDaysUntilDate } from "@/lib/date";
import { type DistanceDetail, type Event } from "@/types";

export type EventStatusVariant =
  | "completed"
  | "this-week"
  | "soon"
  | "upcoming";

export type EventStatus = {
  label: string;
  variant: EventStatusVariant;
};

export function createSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function normalizeDistanceName(value: string) {
  return value.trim().toLowerCase();
}

export function getEventStatus(eventDate: string): EventStatus {
  const daysUntilEvent = getDaysUntilDate(eventDate);

  if (daysUntilEvent < 0) {
    return { label: "Selesai", variant: "completed" };
  }

  if (daysUntilEvent <= 7) {
    return { label: "Minggu Ini", variant: "this-week" };
  }

  if (daysUntilEvent <= 30) {
    return { label: "Coming Soon", variant: "soon" };
  }

  return { label: "", variant: "upcoming" };
}

export function splitEventsBySchedule(events: Event[]) {
  return events.reduce(
    (groups, event) => {
      const destination =
        getDaysUntilDate(event.event_date) >= 0
          ? groups.upcomingEvents
          : groups.pastEvents;

      destination.push(event);
      return groups;
    },
    {
      upcomingEvents: [] as Event[],
      pastEvents: [] as Event[],
    },
  );
}

export function pickDistance(
  distances: DistanceDetail[],
  requestedDistance?: string | null,
) {
  if (requestedDistance) {
    const matched = distances.find(
      (distance) =>
        normalizeDistanceName(distance.name) ===
        normalizeDistanceName(requestedDistance),
    );

    if (matched) {
      return matched;
    }
  }

  const upcomingDistances = [...distances]
    .filter((distance) => Boolean(distance.date))
    .sort((left, right) => left.date.localeCompare(right.date));

  return upcomingDistances[0] ?? distances[0] ?? null;
}

export function getCountdownCopy(daysLeft: number) {
  if (daysLeft < 0) {
    return `${Math.abs(daysLeft)} hari sejak event`;
  }

  if (daysLeft === 0) {
    return "Hari ini event dimulai";
  }

  if (daysLeft === 1) {
    return "1 hari lagi menuju event";
  }

  return `${daysLeft} hari lagi menuju event`;
}
