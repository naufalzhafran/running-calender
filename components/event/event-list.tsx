import Link from "next/link";
import { MapPin } from "lucide-react";

import { type EventCardViewModel } from "@/lib/event-list-view";
import { type EventStatus } from "@/lib/event-utils";
import { cn } from "@/lib/utils";

const STAGGER_CLASSES = [
  "stagger-1",
  "stagger-2",
  "stagger-3",
  "stagger-4",
  "stagger-5",
  "stagger-6",
];

const STATUS_BADGE_CLASSES: Record<EventStatus["variant"], string> = {
  completed: "bg-muted text-muted-foreground",
  "this-week": "bg-amber-100 text-amber-800",
  soon: "bg-primary/10 text-primary",
  upcoming: "bg-muted text-muted-foreground",
};

function getStaggerClass(index: number) {
  return STAGGER_CLASSES[Math.min(index, STAGGER_CLASSES.length - 1)];
}

function StatusBadge({ status }: { status: EventStatus }) {
  if (!status.label) {
    return null;
  }

  return (
    <span
      className={cn(
        "mb-2 inline-block rounded-full px-2 py-0.5 text-xs font-medium",
        STATUS_BADGE_CLASSES[status.variant],
      )}
    >
      {status.label}
    </span>
  );
}

function DistancePill({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full bg-muted px-2 py-1 text-xs font-medium text-muted-foreground">
      {children}
    </span>
  );
}

function DesktopDistancePreview({ event }: { event: EventCardViewModel }) {
  if (event.distanceNames.length === 0) {
    return null;
  }

  return (
    <div className="hidden w-44 shrink-0 flex-wrap content-center justify-end gap-1.5 border-l border-border/30 px-4 sm:flex">
      {event.desktopDistanceNames.map((distanceName, index) => (
        <DistancePill key={`${distanceName}-${index}`}>{distanceName}</DistancePill>
      ))}
      {event.hiddenDesktopDistanceCount > 0 && (
        <span className="px-1 py-1 text-xs text-muted-foreground">
          +{event.hiddenDesktopDistanceCount}
        </span>
      )}
    </div>
  );
}

function MobileDistancePills({ event }: { event: EventCardViewModel }) {
  if (event.distanceNames.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-2 border-t border-border/30 px-4 py-3 sm:hidden">
      {event.mobileDistanceNames.map((distanceName, index) => (
        <DistancePill key={`${distanceName}-${index}`}>{distanceName}</DistancePill>
      ))}
      {event.hiddenMobileDistanceCount > 0 && (
        <span className="px-1 py-1 text-xs text-muted-foreground">
          +{event.hiddenMobileDistanceCount}
        </span>
      )}
    </div>
  );
}

function EventCard({
  event,
  index,
}: {
  event: EventCardViewModel;
  index: number;
}) {
  return (
    <Link
      href={`/events/${event.id}`}
      prefetch={event.isPast ? false : undefined}
      className={cn(
        "group block animate-fade-in-up rounded-2xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
        getStaggerClass(index),
      )}
    >
      <article
        className={cn(
          "card-hover overflow-hidden rounded-2xl border border-border/50 bg-card transition-shadow group-hover:shadow-sm",
          event.isPast && "opacity-70",
        )}
      >
        <div className="flex items-stretch">
          <time
            dateTime={event.dateTime}
            className="flex w-16 shrink-0 flex-col items-center justify-center border-r border-border/30 bg-primary/5 py-3 text-primary sm:w-20 sm:py-4"
          >
            <span className="sr-only">{event.fullDateLabel}</span>
            <span aria-hidden className="text-xs font-semibold uppercase">
              {event.monthLabel}
            </span>
            <span
              aria-hidden
              className="text-xl font-bold leading-none sm:text-2xl"
            >
              {event.dayLabel}
            </span>
            {event.yearLabel && (
              <span aria-hidden className="mt-1 text-[11px] font-medium">
                {event.yearLabel}
              </span>
            )}
          </time>

          <div className="min-w-0 flex-1 p-4 sm:p-5">
            <StatusBadge status={event.status} />

            <h3 className="mb-2 line-clamp-2 text-base font-semibold text-foreground group-hover:text-primary sm:text-lg">
              {event.title}
            </h3>

            <div className="flex min-w-0 items-center gap-1.5 text-sm text-muted-foreground">
              <MapPin aria-hidden className="h-4 w-4 shrink-0" />
              <span className="line-clamp-1">{event.location}</span>
            </div>
          </div>

          <DesktopDistancePreview event={event} />
        </div>

        <MobileDistancePills event={event} />
      </article>
    </Link>
  );
}

export function EventList({
  events,
  title,
}: {
  events: EventCardViewModel[];
  title: string;
}) {
  if (events.length === 0) {
    return null;
  }

  return (
    <section>
      <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-foreground">
        <span aria-hidden className="h-5 w-1 rounded-full bg-primary" />
        {title}
      </h2>

      <ul className="space-y-4">
        {events.map((event, index) => (
          <li key={event.id}>
            <EventCard event={event} index={index} />
          </li>
        ))}
      </ul>
    </section>
  );
}
