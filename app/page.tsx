import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { cacheLife, cacheTag } from "next/cache";
import { connection } from "next/server";
import { Calendar } from "lucide-react";

import { EventList } from "@/components/event/event-list";
import { EVENTS_TAG, listEventSummaries } from "@/lib/data";
import { createEventCardViewModels } from "@/lib/event-list-view";
import { splitEventsBySchedule } from "@/lib/event-utils";

export const unstable_instant = {
  prefetch: "static",
};

const HOME_RECENT_PAST_EVENT_LIMIT = 3;

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

async function HomeEventContent() {
  "use cache";

  cacheLife("hours");
  cacheTag(EVENTS_TAG);

  const events = await listEventSummaries();
  const { upcomingEvents, pastEvents } = splitEventsBySchedule(events);
  const recentPastEvents = [...pastEvents]
    .reverse()
    .slice(0, HOME_RECENT_PAST_EVENT_LIMIT);
  const hiddenPastCount = Math.max(
    0,
    pastEvents.length - recentPastEvents.length,
  );
  const upcomingEventCards = createEventCardViewModels(upcomingEvents);
  const recentPastEventCards = createEventCardViewModels(recentPastEvents);

  return (
    <>
      <StatsGrid
        upcomingCount={upcomingEvents.length}
        pastCount={pastEvents.length}
      />

      {events.length === 0 ? (
        <EmptyEventsState />
      ) : (
        <div className="space-y-8">
          <EventList title="Event Mendatang" events={upcomingEventCards} />
          <EventList
            title={
              upcomingEventCards.length > 0
                ? "Event Selesai Terbaru"
                : "Event Terbaru"
            }
            events={recentPastEventCards}
          />

          {hiddenPastCount > 0 && (
            <div className="flex justify-center">
              <Link
                href="/archive"
                prefetch={false}
                className="inline-flex h-11 items-center justify-center rounded-2xl border border-border/70 bg-card px-4 text-sm font-medium text-foreground transition-colors hover:border-primary/40 hover:text-primary"
              >
                Lihat {hiddenPastCount} event selesai lainnya
              </Link>
            </div>
          )}
        </div>
      )}
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
