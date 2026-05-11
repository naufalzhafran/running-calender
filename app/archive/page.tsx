import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { cacheLife, cacheTag } from "next/cache";
import { connection } from "next/server";
import { Archive, ArrowLeft } from "lucide-react";

import { EventList } from "@/components/event/event-list";
import { EVENTS_TAG, listEventSummaries } from "@/lib/data";
import { createEventCardViewModels } from "@/lib/event-list-view";
import { splitEventsBySchedule } from "@/lib/event-utils";

export const metadata: Metadata = {
  title: "Arsip Event | Kalender Lari",
  description: "Arsip event lari yang sudah selesai.",
};

function ArchiveHeader() {
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

function EmptyArchiveState() {
  return (
    <div className="flex flex-col items-center justify-center px-4 py-16">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-muted">
        <Archive className="h-10 w-10 text-muted-foreground" />
      </div>
      <h1 className="mb-2 text-xl font-semibold text-foreground">
        Belum Ada Arsip
      </h1>
      <p className="max-w-xs text-center text-muted-foreground">
        Event yang sudah selesai akan tampil di halaman ini.
      </p>
    </div>
  );
}

async function ArchiveEventContent() {
  "use cache";

  cacheLife("hours");
  cacheTag(EVENTS_TAG);

  const events = await listEventSummaries();
  const { pastEvents } = splitEventsBySchedule(events);
  const pastEventCards = createEventCardViewModels([...pastEvents].reverse());

  if (pastEventCards.length === 0) {
    return <EmptyArchiveState />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Arsip Event
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {pastEventCards.length} event selesai, diurutkan dari yang terbaru.
        </p>
      </div>
      <EventList title="Event Selesai" events={pastEventCards} />
    </div>
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

export default function ArchivePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 pb-20">
      <DynamicMarker />
      <ArchiveHeader />

      <main className="mx-auto max-w-4xl px-4 py-6">
        <ArchiveEventContent />
      </main>
    </div>
  );
}
