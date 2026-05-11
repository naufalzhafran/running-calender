import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { cacheLife, cacheTag } from "next/cache";
import { connection } from "next/server";
import { Calendar, MapPin } from "lucide-react";

import { formatDateInJakarta } from "@/lib/date";
import {
  getEventStatus,
  splitEventsBySchedule,
  type EventStatus,
} from "@/lib/event-utils";
import { cn } from "@/lib/utils";
import { EVENTS_TAG, listEvents } from "@/lib/data";
import { type Event } from "@/types";

export const unstable_instant = {
  prefetch: "static",
};

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

function HomeHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-border/50 bg-background">
      <div className="mx-auto max-w-4xl px-4 py-4">
        <div className="flex items-center gap-3">
          <Image
            src="/logo-mark.svg"
            alt=""
            width={40}
            height={40}
            unoptimized
            className="h-10 w-10 shrink-0"
            priority
          />
          <div>
            <h1 className="text-xl font-bold leading-tight text-foreground">
              Kalender Lari
            </h1>
            <p className="text-xs text-muted-foreground">
              Indonesia Running Events
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}

function StatsGrid({
  upcomingCount,
  pastCount,
}: {
  upcomingCount: number;
  pastCount: number;
}) {
  return (
    <div className="mb-8 grid grid-cols-2 gap-3">
      <div className="rounded-2xl border border-border/50 bg-card p-4">
        <p className="text-2xl font-bold text-primary">{upcomingCount}</p>
        <p className="text-sm text-muted-foreground">Event Mendatang</p>
      </div>
      <div className="rounded-2xl border border-border/50 bg-card p-4">
        <p className="text-2xl font-bold text-muted-foreground">
          {pastCount}
        </p>
        <p className="text-sm text-muted-foreground">Event Selesai</p>
      </div>
    </div>
  );
}

function EmptyEventsState() {
  return (
    <div className="flex flex-col items-center justify-center px-4 py-16">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-muted">
        <Calendar className="h-10 w-10 text-muted-foreground" />
      </div>
      <h2 className="mb-2 text-xl font-semibold text-foreground">
        Belum Ada Event
      </h2>
      <p className="max-w-xs text-center text-muted-foreground">
        Saat ini belum ada jadwal lomba lari. Stay tuned untuk upcoming events!
      </p>
    </div>
  );
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

function DesktopDistancePreview({ event }: { event: Event }) {
  if (event.distance.length === 0) {
    return null;
  }

  return (
    <div className="hidden min-w-[80px] flex-col items-center justify-center border-l border-border/30 px-4 sm:flex">
      <span className="mb-1 text-xs text-muted-foreground">
        {event.distance.length} kategori
      </span>
      <div className="flex gap-1">
        {event.distance.slice(0, 3).map((distance, index) => (
          <span
            key={`${distance.name}-${index}`}
            className="h-2 w-2 rounded-full bg-primary/60"
            title={distance.name}
          />
        ))}
      </div>
    </div>
  );
}

function MobileDistancePills({ event }: { event: Event }) {
  if (event.distance.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-2 border-t border-border/30 px-4 pb-4 pt-1 sm:hidden">
      {event.distance.slice(0, 4).map((distance, index) => (
        <span
          key={`${distance.name}-${index}`}
          className="rounded-full bg-muted px-2 py-1 text-xs text-muted-foreground"
        >
          {distance.name.trim()}
        </span>
      ))}
      {event.distance.length > 4 && (
        <span className="px-2 py-1 text-xs text-muted-foreground">
          +{event.distance.length - 4}
        </span>
      )}
    </div>
  );
}

function EventCard({ event, index }: { event: Event; index: number }) {
  const status = getEventStatus(event.event_date);
  const isPast = status.variant === "completed";

  return (
    <Link
      href={`/events/${event.id}`}
      className={cn(
        "block animate-fade-in-up",
        getStaggerClass(index),
        isPast && "opacity-60",
      )}
      style={{ opacity: 0 }}
    >
      <article className="card-hover cursor-pointer overflow-hidden rounded-2xl border border-border/50 bg-card">
        <div className="flex items-stretch">
          <div className="flex w-16 flex-col items-center justify-center border-r border-border/30 bg-primary/5 py-3 sm:w-20 sm:py-4">
            <span className="text-xs font-medium uppercase text-primary">
              {formatDateInJakarta(event.event_date, { month: "short" })}
            </span>
            <span className="text-xl font-bold leading-none text-primary sm:text-2xl">
              {formatDateInJakarta(event.event_date, { day: "numeric" })}
            </span>
          </div>

          <div className="flex-1 p-4 sm:p-5">
            <StatusBadge status={status} />

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

function EventList({ events }: { events: Event[] }) {
  const hasUpcomingEvents = events.some(
    (event) => getEventStatus(event.event_date).variant !== "completed",
  );

  return (
    <section>
      <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-foreground">
        <span className="h-5 w-1 rounded-full bg-primary" />
        {hasUpcomingEvents ? "Event Mendatang" : "Semua Event"}
      </h2>

      <div className="space-y-4">
        {events.map((event, index) => (
          <EventCard key={event.id} event={event} index={index} />
        ))}
      </div>
    </section>
  );
}

async function HomeEventContent() {
  "use cache";

  cacheLife("hours");
  cacheTag(EVENTS_TAG);

  const events = await listEvents();
  const { upcomingEvents, pastEvents } = splitEventsBySchedule(events);

  return (
    <>
      <StatsGrid
        upcomingCount={upcomingEvents.length}
        pastCount={pastEvents.length}
      />

      {events.length === 0 ? <EmptyEventsState /> : <EventList events={events} />}
    </>
  );
}

async function ConnectionMarker() {
  await connection();
  return null;
}

function DynamicMarker() {
  return (
    <Suspense>
      <ConnectionMarker />
    </Suspense>
  );
}

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <DynamicMarker />
      <HomeHeader />

      <main className="mx-auto max-w-4xl px-4 py-6">
        <HomeEventContent />
      </main>
    </div>
  );
}
