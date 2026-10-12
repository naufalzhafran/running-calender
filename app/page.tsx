import Link from "next/link";
import { cacheLife, cacheTag } from "next/cache";
import { Calendar } from "lucide-react";

import { EventBrowser } from "@/components/event/event-browser";
import { SiteHeader } from "@/components/layout/site-header";
import { EVENTS_TAG, listEventSummaries } from "@/lib/data";
import { createEventCardViewModels } from "@/lib/event-list-view";
import { splitEventsBySchedule } from "@/lib/event-utils";

const HOME_RECENT_PAST_EVENT_LIMIT = 3;

function StatsGrid({
  upcomingCount,
  pastCount,
}: {
  upcomingCount: number;
  pastCount: number;
}) {
  return (
    <div className="mb-6 grid grid-cols-2 gap-3">
      <div className="rounded-2xl border border-border/50 bg-card p-4">
        <p className="text-2xl font-bold text-primary">{upcomingCount}</p>
        <p className="text-sm text-muted-foreground">Event Mendatang</p>
      </div>
      <Link
        href="/archive"
        prefetch={false}
        className="rounded-2xl border border-border/50 bg-card p-4 transition-colors hover:border-primary/40"
      >
        <p className="text-2xl font-bold text-foreground">{pastCount}</p>
        <p className="text-sm text-muted-foreground">Event Selesai</p>
      </Link>
    </div>
  );
}

function EmptyEventsState() {
  return (
    <div className="flex flex-col items-center justify-center px-4 py-16">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-muted">
        <Calendar aria-hidden className="h-10 w-10 text-muted-foreground" />
      </div>
      <h2 className="mb-2 text-xl font-semibold text-foreground">
        Belum Ada Event
      </h2>
      <p className="max-w-xs text-center text-muted-foreground">
        Saat ini belum ada jadwal lomba lari. Cek lagi nanti untuk event terbaru.
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
          <EventBrowser
            upcomingEvents={upcomingEventCards}
            recentPastEvents={recentPastEventCards}
            pastTitle={
              upcomingEventCards.length > 0
                ? "Event Selesai Terbaru"
                : "Event Terbaru"
            }
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

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <SiteHeader />

      <main className="mx-auto max-w-4xl px-4 py-6">
        <h1 className="sr-only">Kalender Lari: jadwal event lari di Indonesia</h1>
        <HomeEventContent />
      </main>
    </div>
  );
}
