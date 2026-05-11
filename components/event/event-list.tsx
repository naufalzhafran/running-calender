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
  "this-week": "bg-amber-100 text-amber-700",
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

function DesktopDistancePreview({ event }: { event: EventCardViewModel }) {
  if (event.distanceCount === 0) {
    return null;
  }

  return (
    <div className="hidden min-w-[80px] flex-col items-center justify-center border-l border-border/30 px-4 sm:flex">
      <span className="mb-1 text-xs text-muted-foreground">
        {event.distanceCount} kategori
      </span>
      <div className="flex gap-1">
        {event.desktopDistanceNames.map((distanceName, index) => (
          <span
            key={`${distanceName}-${index}`}
            className="h-2 w-2 rounded-full bg-primary/60"
            title={distanceName}
          />
        ))}
      </div>
    </div>
  );
}

function MobileDistancePills({ event }: { event: EventCardViewModel }) {
  if (event.distanceCount === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-2 border-t border-border/30 px-4 pb-4 pt-1 sm:hidden">
      {event.mobileDistanceNames.map((distanceName, index) => (
        <span
          key={`${distanceName}-${index}`}
          className="rounded-full bg-muted px-2 py-1 text-xs text-muted-foreground"
        >
          {distanceName}
        </span>
      ))}
      {event.hiddenMobileDistanceCount > 0 && (
        <span className="px-2 py-1 text-xs text-muted-foreground">
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
        "block animate-fade-in-up",
        getStaggerClass(index),
        event.isPast && "opacity-60",
      )}
      style={{ opacity: 0 }}
    >
      <article className="card-hover cursor-pointer overflow-hidden rounded-2xl border border-border/50 bg-card">
        <div className="flex items-stretch">
          <div className="flex w-16 flex-col items-center justify-center border-r border-border/30 bg-primary/5 py-3 sm:w-20 sm:py-4">
            <span className="text-xs font-medium uppercase text-primary">
              {event.monthLabel}
            </span>
            <span className="text-xl font-bold leading-none text-primary sm:text-2xl">
              {event.dayLabel}
            </span>
          </div>

          <div className="flex-1 p-4 sm:p-5">
            <StatusBadge status={event.status} />

            <h3 className="mb-2 line-clamp-2 text-base font-semibold text-foreground sm:text-lg">
              {event.title}
            </h3>

            <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4 shrink-0" />
                <span className="line-clamp-1">{event.location}</span>
              </div>
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
        <span className="h-5 w-1 rounded-full bg-primary" />
        {title}
      </h2>

      <div className="space-y-4">
        {events.map((event, index) => (
          <EventCard key={event.id} event={event} index={index} />
        ))}
      </div>
    </section>
  );
}
