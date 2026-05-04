import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink, Image as ImageIcon, Link2 } from "lucide-react";

import { getEventById } from "@/lib/data";
import { buildWallpaperPath, getWallpaperPreset } from "@/lib/wallpaper";
import { formatDateInJakarta } from "@/lib/date";
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
  const title = `${context.event.title}${distanceLabel}`;
  const description = `Wallpaper lock screen untuk ${context.event.title}${
    context.distance?.date
      ? ` pada ${formatDateInJakarta(context.distance.date, {
          day: "numeric",
          month: "long",
          year: "numeric",
        })}`
      : ""
  }.`;

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

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-border/60 bg-background px-4 py-3">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-right text-sm font-medium text-foreground">
        {value}
      </span>
    </div>
  );
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
    <main className="min-h-screen bg-gradient-to-b from-background to-muted/30 px-4 py-6">
      <div className="mx-auto max-w-3xl space-y-6">
        <Link
          href={`/events/${context.event.id}`}
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali ke detail event
        </Link>

        <section className="rounded-3xl border border-border/60 bg-card p-6 shadow-sm">
          <div className="mb-6 flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <ImageIcon className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                Wallpaper Share
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                URL halaman ini bisa dibagikan ke WhatsApp agar preview gambar
                muncul otomatis.
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <InfoRow label="Event" value={context.event.title} />
            <InfoRow
              label="Kategori"
              value={context.distance?.name ?? "Default"}
            />
            <InfoRow
              label="Tanggal"
              value={
                context.distance?.date
                  ? formatDateInJakarta(context.distance.date, {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })
                  : formatDateInJakarta(context.event.event_date, {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })
              }
            />
            <InfoRow
              label="Ukuran"
              value={`${context.preset.shortLabel} • ${context.preset.width}×${context.preset.height}`}
            />
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <Link
              href={context.imagePath}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              <ExternalLink className="h-4 w-4" />
              Buka Gambar Langsung
            </Link>
            <Link
              href={`/events/${context.event.id}`}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-border/60 bg-background px-4 py-3 text-sm font-medium text-foreground transition-colors hover:bg-muted"
            >
              <Link2 className="h-4 w-4" />
              Lihat Event
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
