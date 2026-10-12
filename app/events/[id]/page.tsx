import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Calendar, Clock, ExternalLink, MapPin, Ruler, Smartphone } from "lucide-react";

import { ReminderActions } from "@/components/event/reminder-actions";
import { SiteHeader } from "@/components/layout/site-header";

import { buttonVariants } from "@/components/ui/button";
import { getEventById } from "@/lib/data";
import { formatDateInJakarta, getDaysUntilDate } from "@/lib/date";
import { cn } from "@/lib/utils";
import { buildWallpaperSharePath } from "@/lib/wallpaper";
import { type DistanceDetail, type Event } from "@/types";

export const unstable_instant = {
  prefetch: "static",
  samples: [{ params: { id: "sample-event-id" } }],
};

type PageProps = {
  params: Promise<{ id: string }>;
};

function DistancePills({ distances }: { distances: DistanceDetail[] }) {
  if (distances.length === 0) {
    return null;
  }

  return (
    <div className="mb-6 flex flex-wrap gap-2">
      {distances.map((distance, index) => (
        <span
          key={`${distance.name}-${index}`}
          className="inline-flex items-center rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary"
        >
          {distance.name.trim()}
        </span>
      ))}
    </div>
  );
}

function DateRange({ event }: { event: Event }) {
  return (
    <p className="font-semibold text-foreground">
      {formatDateInJakarta(event.event_date, {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      })}
      {event.end_date && (
        <>
          <span className="mx-2 text-muted-foreground">-</span>
          {formatDateInJakarta(event.end_date, {
            day: "numeric",
            month: "long",
          })}
        </>
      )}
    </p>
  );
}

function InfoTile({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-4 rounded-2xl bg-muted/50 p-4">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
        {icon}
      </div>
      <div>
        <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        {children}
      </div>
    </div>
  );
}

function EventInfoGrid({ event }: { event: Event }) {
  return (
    <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6">
      <InfoTile
        label="Tanggal"
        icon={<Calendar aria-hidden className="h-6 w-6 text-primary" />}
      >
        <DateRange event={event} />
      </InfoTile>

      <InfoTile
        label="Lokasi"
        icon={<MapPin aria-hidden className="h-6 w-6 text-primary" />}
      >
        <p className="font-semibold text-foreground">{event.location}</p>
        <a
          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.location)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-1 inline-flex items-center gap-1 text-sm font-medium text-primary underline-offset-4 hover:underline"
        >
          Buka di Google Maps
          <ExternalLink aria-hidden className="h-3.5 w-3.5" />
          <span className="sr-only">(tab baru)</span>
        </a>
      </InfoTile>
    </div>
  );
}

function DistanceMetaRow({
  icon,
  label,
  value,
  withDivider,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  withDivider?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-3 py-3 text-sm",
        withDivider && "border-b border-border/50",
      )}
    >
      <span className="flex items-center gap-2 text-muted-foreground">
        {icon}
        {label}
      </span>
      <span className="font-medium text-foreground">{value}</span>
    </div>
  );
}

function DistanceCard({
  event,
  distance,
}: {
  event: Event;
  distance: DistanceDetail;
}) {
  const distanceDate = formatDateInJakarta(distance.date || event.event_date, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <div
      className="flex flex-col rounded-3xl border border-border/50 bg-card p-5 transition-colors hover:border-primary/20"
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-xl font-bold text-foreground">
            {distance.name}
          </h3>
          <p className="mt-1 text-xs uppercase tracking-[0.18em] text-muted-foreground">
            Kategori Race
          </p>
        </div>
      </div>

      <div className="mb-5 rounded-2xl border border-border/50 bg-background/70 px-4 py-2">
        <DistanceMetaRow
          withDivider
          label="Tanggal"
          value={distanceDate}
          icon={<Calendar aria-hidden className="h-4 w-4" />}
        />
        <DistanceMetaRow
          withDivider
          label="Start"
          value={distance.start_time || "-"}
          icon={<Clock aria-hidden className="h-4 w-4" />}
        />
        <DistanceMetaRow
          label="COT"
          value={distance.cot || "-"}
          icon={<Clock aria-hidden className="h-4 w-4" />}
        />
      </div>

      <Link
        href={buildWallpaperSharePath({
          eventId: event.id,
          distance: distance.name,
        })}
        className={buttonVariants({
          variant: "outline",
          className: "mt-auto h-11 w-full rounded-2xl",
        })}
        aria-label={`Countdown dan wallpaper ${distance.name}`}
      >
        <Smartphone aria-hidden className="h-4 w-4" />
        Countdown &amp; Wallpaper
      </Link>
    </div>
  );
}

function DistanceSection({ event }: { event: Event }) {
  if (event.distance.length === 0) {
    return null;
  }

  return (
    <div className="mb-8">
      <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-foreground">
        <Ruler aria-hidden className="h-5 w-5 text-primary" />
        Kategori
      </h2>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {event.distance.map((distance, index) => (
          <DistanceCard
            key={`${distance.name}-${index}`}
            event={event}
            distance={distance}
          />
        ))}
      </div>
    </div>
  );
}

function EventDescription({ description }: { description: string | null }) {
  if (!description) {
    return null;
  }

  return (
    <div className="border-t border-border/50 pt-6">
      <h2 className="mb-3 text-lg font-semibold text-foreground">Deskripsi</h2>
      <p className="whitespace-pre-wrap leading-relaxed text-muted-foreground">
        {description}
      </p>
    </div>
  );
}

function EventDetailsFallback() {
  return (
    <div className="mb-6 overflow-hidden rounded-3xl border border-border/50 bg-card">
      <div className="space-y-6 p-6 sm:p-8">
        <div className="h-7 w-40 animate-pulse rounded-full bg-muted" />
        <div className="h-10 w-3/4 animate-pulse rounded-lg bg-muted" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6">
          <div className="h-24 animate-pulse rounded-2xl bg-muted/70" />
          <div className="h-24 animate-pulse rounded-2xl bg-muted/70" />
        </div>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="h-64 animate-pulse rounded-3xl bg-muted/70" />
          <div className="h-64 animate-pulse rounded-3xl bg-muted/70" />
        </div>
      </div>
    </div>
  );
}

async function EventDetails({ id }: { id: string }) {
  const event = await getEventById(id);

  if (!event) {
    notFound();
  }

  const isPast = getDaysUntilDate(event.event_date) < 0;

  return (
    <div className="mb-6 overflow-hidden rounded-3xl border border-border/50 bg-card">
      {isPast && (
        <div className="bg-muted px-6 py-2 text-center text-sm text-muted-foreground">
          Event telah selesai
        </div>
      )}

      <div className="p-6 sm:p-8">
        <DistancePills distances={event.distance} />

        <h1 className="mb-6 text-2xl font-bold tracking-tight text-foreground sm:text-3xl lg:text-4xl">
          {event.title}
        </h1>

        <EventInfoGrid event={event} />
        {!isPast && event.distance.length > 0 && (
          <div className="mb-8">
            <ReminderActions
              eventId={event.id}
              eventTitle={event.title}
              distances={event.distance}
            />
          </div>
        )}
        <DistanceSection event={event} />
        <EventDescription description={event.description} />
      </div>
    </div>
  );
}

export default function EventPage({ params }: PageProps) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 pb-20">
      <SiteHeader backHref="/" backLabel="Semua event" />

      <main className="mx-auto max-w-4xl px-4 py-6">
        <Suspense fallback={<EventDetailsFallback />}>
          {params.then(({ id }) => (
            <EventDetails id={id} />
          ))}
        </Suspense>
      </main>
    </div>
  );
}
