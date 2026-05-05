import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { WallpaperShareExperience } from "@/components/event/wallpaper-share-experience";
import { getEventById } from "@/lib/data";
import { buildWallpaperPath, getWallpaperPreset } from "@/lib/wallpaper";
import { formatDateInJakarta, getDaysUntilDate } from "@/lib/date";
import { type DistanceDetail } from "@/types";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ distance?: string; preset?: string }>;
};

function normalizeDistanceName(value: string) {
  return value.trim().toLowerCase();
}

function pickDistance(
  distances: DistanceDetail[],
  requestedDistance: string | undefined,
) {
  if (requestedDistance) {
    const matched = distances.find(
      (distance) =>
        normalizeDistanceName(distance.name) ===
        normalizeDistanceName(requestedDistance),
    );

    if (matched) {
      return matched;
    }
  }

  const upcoming = [...distances]
    .filter((distance) => Boolean(distance.date))
    .sort((left, right) => left.date.localeCompare(right.date));

  return upcoming[0] ?? distances[0] ?? null;
}

function getAbsoluteUrl(path: string, headerList: Headers) {
  const proto = headerList.get("x-forwarded-proto") ?? "https";
  const host = headerList.get("x-forwarded-host") ?? headerList.get("host");

  if (!host) {
    return path;
  }

  return `${proto}://${host}${path}`;
}

function getCountdownCopy(daysLeft: number) {
  if (daysLeft < 0) {
    return `${Math.abs(daysLeft)} hari sejak event`;
  }

  if (daysLeft === 0) {
    return "Hari ini event dimulai";
  }

  if (daysLeft === 1) {
    return "1 hari lagi menuju event";
  }

  return `${daysLeft} hari lagi menuju event`;
}

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

  const headerList = await headers();
  const imageUrl = getAbsoluteUrl(context.imagePath, headerList);
  const pageUrl = getAbsoluteUrl(
    `/wallpaper/${context.event.id}?${new URLSearchParams({
      ...(context.distance?.name ? { distance: context.distance.name } : {}),
      preset: context.preset.key,
    }).toString()}`,
    headerList,
  );
  const distanceLabel = context.distance?.name
    ? ` • ${context.distance.name}`
    : "";
  const targetDate = context.distance?.date ?? context.event.event_date;
  const daysLeft = getDaysUntilDate(targetDate);
  const countdownLabel = getCountdownCopy(daysLeft);
  const title = `${countdownLabel} • ${context.event.title}${distanceLabel}`;
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

export default async function WallpaperSharePage({
  params,
  searchParams,
}: PageProps) {
  const { id } = await params;
  const { distance, preset } = await searchParams;
  const context = await getWallpaperContext(id, distance, preset);

  if (!context) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-white px-4 py-6 sm:px-6 lg:py-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <Link
          href={`/events/${context.event.id}`}
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali ke detail event
        </Link>

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
      </div>
    </main>
  );
}
