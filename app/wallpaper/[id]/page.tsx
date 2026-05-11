import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { ArrowLeft } from "lucide-react";

import { WallpaperShareExperience } from "@/components/event/wallpaper-share-experience";
import { getEventById } from "@/lib/data";
import { getCountdownCopy, pickDistance } from "@/lib/event-utils";
import { buildWallpaperPath, getWallpaperPreset } from "@/lib/wallpaper";
import { formatDateInJakarta, getDaysUntilDate } from "@/lib/date";
import { buildAbsoluteSiteUrl } from "@/lib/site-url";

export const unstable_instant = {
  prefetch: "static",
  samples: [
    {
      params: { id: "sample-event-id" },
      searchParams: { distance: null, preset: null },
    },
  ],
};

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ distance?: string; preset?: string }>;
};

async function getWallpaperContext(
  id: string,
  distanceName?: string,
  presetValue?: string,
) {
  const event = await getEventById(id);

  if (!event) {
    return null;
  }

  const preset = getWallpaperPreset(presetValue);
  const distance = pickDistance(event.distance, distanceName);
  const imagePath = buildWallpaperPath({
    eventId: event.id,
    distance: distance?.name,
    preset: preset.key,
  });

  return { event, preset, distance, imagePath };
}

export async function generateMetadata({
  params,
  searchParams,
}: PageProps): Promise<Metadata> {
  const { id } = await params;
  const { distance, preset } = await searchParams;
  const context = await getWallpaperContext(id, distance, preset);

  if (!context) {
    return {
      title: "Wallpaper tidak ditemukan",
    };
  }

  const imageUrl = buildAbsoluteSiteUrl(context.imagePath);
  const pageUrl = buildAbsoluteSiteUrl(
    `/wallpaper/${context.event.id}?${new URLSearchParams({
      ...(context.distance?.name ? { distance: context.distance.name } : {}),
      preset: context.preset.key,
    }).toString()}`,
  );
  const distanceLabel = context.distance?.name
    ? ` • ${context.distance.name}`
    : "";
  const targetDate = context.distance?.date ?? context.event.event_date;
  const daysLeft = getDaysUntilDate(targetDate);
  const countdownLabel = getCountdownCopy(daysLeft);
  const title = `Detail kategori${distanceLabel} • ${context.event.title}`;
  const description = `${countdownLabel} untuk ${context.event.title}${
    context.distance?.name ? ` kategori ${context.distance.name}` : ""
  }. Tanggal event ${formatDateInJakarta(targetDate, {
    day: "numeric",
    month: "long",
    year: "numeric",
  })}.`;

  return {
    title,
    description,
    alternates: {
      canonical: pageUrl,
    },
    openGraph: {
      title,
      description,
      type: "website",
      url: pageUrl,
      images: [
        {
          url: imageUrl,
          width: context.preset.width,
          height: context.preset.height,
          alt: `Wallpaper ${title}`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [imageUrl],
    },
  };
}

function WallpaperShareFallback() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 pb-20">
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background">
        <div className="mx-auto max-w-4xl px-4 py-4">
          <div className="h-5 w-24 animate-pulse rounded bg-muted" />
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-6">
        <div className="h-[620px] animate-pulse rounded-3xl bg-muted/70" />
      </main>
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

async function WallpaperShareContent({
  id,
  distance,
  preset,
}: {
  id: string;
  distance?: string;
  preset?: string;
}) {
  const context = await getWallpaperContext(id, distance, preset);

  if (!context) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 pb-20">
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background">
        <div className="mx-auto max-w-4xl px-4 py-4">
          <Link
            href={`/events/${context.event.id}`}
            className="inline-flex items-center text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Kembali
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-6">
        <WallpaperShareExperience
          event={{
            id: context.event.id,
            title: context.event.title,
            location: context.event.location,
            event_date: context.event.event_date,
          }}
          distances={context.event.distance}
          initialDistanceName={context.distance?.name}
          initialPresetKey={context.preset.key}
        />
      </main>
    </div>
  );
}

export default function WallpaperSharePage(props: PageProps) {
  return (
    <>
      <DynamicMarker />
      <Suspense fallback={<WallpaperShareFallback />}>
        {Promise.all([props.params, props.searchParams]).then(
          ([{ id }, { distance, preset }]) => (
            <WallpaperShareContent id={id} distance={distance} preset={preset} />
          ),
        )}
      </Suspense>
    </>
  );
}
