import { formatDateInJakarta } from "@/lib/date";
import { getEventStatus, type EventStatus } from "@/lib/event-utils";
import { type EventSummary } from "@/types";

export type EventCardViewModel = {
  id: string;
  title: string;
  location: string;
  status: EventStatus;
  isPast: boolean;
  monthLabel: string;
  dayLabel: string;
  distanceCount: number;
  desktopDistanceNames: string[];
  mobileDistanceNames: string[];
  hiddenMobileDistanceCount: number;
};

export function createEventCardViewModel(
  event: EventSummary,
): EventCardViewModel {
  const status = getEventStatus(event.event_date);
  const mobileDistances = event.distance.slice(0, 4);

  return {
    id: event.id,
    title: event.title,
    location: event.location,
    status,
    isPast: status.variant === "completed",
    monthLabel: formatDateInJakarta(event.event_date, { month: "short" }),
    dayLabel: formatDateInJakarta(event.event_date, { day: "numeric" }),
    distanceCount: event.distance.length,
    desktopDistanceNames: event.distance
      .slice(0, 3)
      .map((distance) => distance.name.trim()),
    mobileDistanceNames: mobileDistances.map((distance) =>
      distance.name.trim(),
    ),
    hiddenMobileDistanceCount: Math.max(
      0,
      event.distance.length - mobileDistances.length,
    ),
  };
}

export function createEventCardViewModels(events: EventSummary[]) {
  return events.map(createEventCardViewModel);
}
