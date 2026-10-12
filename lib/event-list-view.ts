import { formatDateInJakarta, getJakartaTodayDateString } from "@/lib/date";
import { getEventStatus, type EventStatus } from "@/lib/event-utils";
import { type EventSummary } from "@/types";

const DESKTOP_DISTANCE_LIMIT = 3;
const MOBILE_DISTANCE_LIMIT = 4;

export type EventCardViewModel = {
  id: string;
  title: string;
  location: string;
  status: EventStatus;
  isPast: boolean;
  dateTime: string;
  fullDateLabel: string;
  monthLabel: string;
  dayLabel: string;
  yearLabel: string | null;
  distanceNames: string[];
  desktopDistanceNames: string[];
  hiddenDesktopDistanceCount: number;
  mobileDistanceNames: string[];
  hiddenMobileDistanceCount: number;
};

export function createEventCardViewModel(
  event: EventSummary,
): EventCardViewModel {
  const status = getEventStatus(event.event_date);
  const distanceNames = event.distance.map((distance) => distance.name.trim());
  const dateTime = event.event_date.slice(0, 10);
  const currentYear = getJakartaTodayDateString().slice(0, 4);
  const eventYear = dateTime.slice(0, 4);

  return {
    id: event.id,
    title: event.title,
    location: event.location,
    status,
    isPast: status.variant === "completed",
    dateTime,
    fullDateLabel: formatDateInJakarta(event.event_date, {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }),
    monthLabel: formatDateInJakarta(event.event_date, { month: "short" }),
    dayLabel: formatDateInJakarta(event.event_date, { day: "numeric" }),
    yearLabel: eventYear === currentYear ? null : eventYear,
    distanceNames,
    desktopDistanceNames: distanceNames.slice(0, DESKTOP_DISTANCE_LIMIT),
    hiddenDesktopDistanceCount: Math.max(
      0,
      distanceNames.length - DESKTOP_DISTANCE_LIMIT,
    ),
    mobileDistanceNames: distanceNames.slice(0, MOBILE_DISTANCE_LIMIT),
    hiddenMobileDistanceCount: Math.max(
      0,
      distanceNames.length - MOBILE_DISTANCE_LIMIT,
    ),
  };
}

export function createEventCardViewModels(events: EventSummary[]) {
  return events.map(createEventCardViewModel);
}
