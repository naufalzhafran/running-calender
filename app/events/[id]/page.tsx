import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Calendar, Clock, MapPin, Ruler } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { getEventById } from "@/lib/data";
import { formatDateInJakarta, getDaysUntilDate } from "@/lib/date";
import { cn } from "@/lib/utils";
import { buildWallpaperSharePath } from "@/lib/wallpaper";
import { type DistanceDetail, type Event } from "@/types";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }>;
};

function BackHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-border/50 bg-background">
      <div className="mx-auto max-w-4xl px-4 py-4">
        <Link
          href="/"
          className="inline-flex items-center text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Kembali
        </Link>
      </div>
    </header>
  );
}

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
        icon={<Calendar className="h-6 w-6 text-primary" />}
      >
        <DateRange event={event} />
      </InfoTile>

      <InfoTile
        label="Lokasi"
        icon={<MapPin className="h-6 w-6 text-muted-foreground" />}
      >
        <p className="font-semibold text-foreground">{event.location}</p>
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
  index,
}: {
  event: Event;
  distance: DistanceDetail;
  index: number;
}) {
  const distanceDate = distance.date
    ? formatDateInJakarta(distance.date, {
        day: "numeric",
        month: "short",
      })
    : "-";

  return (
    <div
      key={`${distance.name}-${index}`}
      className="rounded-3xl border border-border/50 bg-card p-5 transition-colors hover:border-primary/20"
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <div className="text-xl font-bold text-foreground">
            {distance.name}
          </div>
          <p className="mt-1 text-xs uppercase tracking-[0.18em] text-muted-foreground">
            Kategori Race
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-border/50 bg-background/70 px-4 py-2">
        <DistanceMetaRow
          withDivider
          label="Tanggal"
          value={distanceDate}
          icon={<Calendar className="h-4 w-4" />}
        />
        <DistanceMetaRow
          withDivider
          label="Start"
          value={distance.start_time || "-"}
          icon={<Clock className="h-4 w-4" />}
        />
        <DistanceMetaRow
          label="COT"
          value={distance.cot || "-"}
          icon={<Clock className="h-4 w-4" />}
        />
      </div>

      <Link
        href={buildWallpaperSharePath({
          eventId: event.id,
          distance: distance.name,
        })}
        className={buttonVariants({
          className: "mt-5 h-11 w-full rounded-2xl",
        })}
      >
        <Ruler className="h-4 w-4" />
        Lihat Detail Kategori
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
        <Ruler className="h-5 w-5 text-primary" />
        Kategori
      </h2>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {event.distance.map((distance, index) => (
          <DistanceCard
            key={`${distance.name}-${index}`}
            event={event}
            distance={distance}
            index={index}
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

export default async function EventPage({ params }: PageProps) {
  const { id } = await params;
  const event = await getEventById(id);

  if (!event) {
    notFound();
  }

  const isPast = getDaysUntilDate(event.event_date) < 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 pb-20">
      <BackHeader />

      <main className="mx-auto max-w-4xl px-4 py-6">
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
            <DistanceSection event={event} />
            <EventDescription description={event.description} />
          </div>
        </div>
      </main>
    </div>
  );
}
