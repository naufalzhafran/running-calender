"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  Copy,
  ExternalLink,
  ImageIcon,
  Share2,
  Smartphone,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import {
  buildWallpaperPath,
  buildWallpaperSharePath,
  type WallpaperPresetKey,
  WALLPAPER_PRESETS,
  getWallpaperPreset,
} from "@/lib/wallpaper";
import { formatDateInJakarta, getDaysUntilDate } from "@/lib/date";
import { type DistanceDetail } from "@/types";

type WallpaperShareExperienceProps = {
  event: {
    id: string;
    title: string;
    location: string;
    event_date: string;
  };
  distances: DistanceDetail[];
  initialDistanceName?: string;
  initialPresetKey: WallpaperPresetKey;
};

function normalizeDistanceName(value: string) {
  return value.trim().toLowerCase();
}

function getSelectedDistance(
  distances: DistanceDetail[],
  selectedDistanceName: string,
) {
  return (
    distances.find(
      (distance) =>
        normalizeDistanceName(distance.name) ===
        normalizeDistanceName(selectedDistanceName),
    ) ?? distances[0] ?? null
  );
}

export function WallpaperShareExperience({
  event,
  distances,
  initialDistanceName,
  initialPresetKey,
}: WallpaperShareExperienceProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selectedDistanceName, setSelectedDistanceName] = useState(
    initialDistanceName ?? distances[0]?.name ?? "",
  );
  const [selectedPresetKey, setSelectedPresetKey] =
    useState<WallpaperPresetKey>(initialPresetKey);
  const [copiedState, setCopiedState] = useState<"share" | "image" | null>(null);

  useEffect(() => {
    setSelectedDistanceName(initialDistanceName ?? distances[0]?.name ?? "");
  }, [distances, initialDistanceName]);

  useEffect(() => {
    setSelectedPresetKey(initialPresetKey);
  }, [initialPresetKey]);

  const selectedDistance = useMemo(
    () => getSelectedDistance(distances, selectedDistanceName),
    [distances, selectedDistanceName],
  );
  const selectedPreset = getWallpaperPreset(selectedPresetKey);
  const selectedDate = selectedDistance?.date ?? event.event_date;
  const daysLeft = getDaysUntilDate(selectedDate);
  const imagePath = buildWallpaperPath({
    eventId: event.id,
    distance: selectedDistance?.name,
    preset: selectedPreset.key,
  });
  const sharePath = buildWallpaperSharePath({
    eventId: event.id,
    distance: selectedDistance?.name,
    preset: selectedPreset.key,
  });

  function syncUrl(nextDistanceName: string, nextPresetKey: WallpaperPresetKey) {
    const nextPath = buildWallpaperSharePath({
      eventId: event.id,
      distance: nextDistanceName || undefined,
      preset: nextPresetKey,
    });

    startTransition(() => {
      router.replace(nextPath, { scroll: false });
    });
  }

  function handleDistanceChange(nextDistanceName: string) {
    setSelectedDistanceName(nextDistanceName);
    syncUrl(nextDistanceName, selectedPresetKey);
  }

  function handlePresetChange(value: string) {
    const nextPresetKey = value as WallpaperPresetKey;
    setSelectedPresetKey(nextPresetKey);
    syncUrl(selectedDistanceName, nextPresetKey);
  }

  async function copyAbsoluteUrl(type: "share" | "image") {
    if (typeof window === "undefined") {
      return;
    }

    try {
      const path = type === "share" ? sharePath : imagePath;
      await navigator.clipboard.writeText(`${window.location.origin}${path}`);
      setCopiedState(type);
      window.setTimeout(() => setCopiedState(null), 1800);
    } catch {
      setCopiedState(null);
    }
  }

  async function handleShare() {
    if (typeof window === "undefined") {
      return;
    }

    const absoluteShareUrl = `${window.location.origin}${sharePath}`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: `Wallpaper ${event.title}`,
          text: `${event.title}${selectedDistance ? ` • ${selectedDistance.name}` : ""}`,
          url: absoluteShareUrl,
        });
        return;
      }
    } catch {
      // Fallback below.
    }

    await copyAbsoluteUrl("share");
  }

  return (
    <section className="overflow-hidden rounded-[2rem] border border-stone-200/80 bg-white">
      <div className="border-b border-stone-200/80 px-4 py-5 sm:px-8 sm:py-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <h1 className="text-3xl font-black uppercase leading-[0.92] tracking-[-0.06em] text-stone-950 sm:text-5xl">
              {event.title}
            </h1>
          </div>

          <div className="rounded-[1.5rem] border border-stone-200 bg-stone-50 px-5 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-stone-500">
              Countdown
            </p>
            <div className="mt-2 flex items-end gap-2">
              <span className="text-4xl font-black leading-none tracking-[-0.06em] text-stone-950">
                {Math.abs(daysLeft)}
              </span>
              <span className="pb-1 text-sm text-stone-600">
                {daysLeft < 0 ? "hari berlalu" : "hari lagi"}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 p-4 sm:p-8 xl:grid-cols-[minmax(0,1fr)_28rem] xl:items-start">
        <div className="min-w-0 space-y-4 xl:order-2 xl:sticky xl:top-24">
          <div className="min-w-0 rounded-[1.6rem] border border-stone-200 bg-stone-50 p-4 sm:p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-stone-500">
              Kategori
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {distances.map((distance) => {
                const isActive =
                  normalizeDistanceName(distance.name) ===
                  normalizeDistanceName(selectedDistance?.name ?? "");

                return (
                  <button
                    key={`${distance.name}-${distance.date}`}
                    type="button"
                    onClick={() => handleDistanceChange(distance.name)}
                    className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                      isActive
                        ? "border-stone-950 bg-stone-950 text-white"
                        : "border-stone-300 bg-white text-stone-700 hover:border-stone-500 hover:text-stone-950"
                    }`}
                  >
                    {distance.name}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="min-w-0 rounded-[1.6rem] border border-stone-200 bg-stone-50 p-4 sm:p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-stone-500">
              Device
            </p>
            <Select value={selectedPresetKey} onValueChange={handlePresetChange}>
              <SelectTrigger className="mt-4 h-auto min-h-14 w-full min-w-0 rounded-2xl border-stone-300 bg-white py-3 text-left">
                <div className="flex min-w-0 flex-1 items-center gap-3 overflow-hidden">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-stone-100 text-stone-700">
                    <Smartphone className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1 overflow-hidden">
                    <p className="truncate text-sm font-semibold text-stone-950">
                      {selectedPreset.label}
                    </p>
                    <p className="text-xs text-stone-500">
                      {selectedPreset.width}×{selectedPreset.height}
                    </p>
                  </div>
                </div>
              </SelectTrigger>
              <SelectContent className="max-w-[min(calc(100vw-2rem),var(--radix-popper-anchor-width))] rounded-2xl border-stone-200 bg-white">
                {Object.entries(WALLPAPER_PRESETS).map(([key, preset]) => (
                  <SelectItem
                    key={key}
                    value={key}
                    className="items-start rounded-xl py-3"
                  >
                    <div className="flex min-w-0 flex-col">
                      <span className="truncate font-medium">{preset.label}</span>
                      <span className="text-xs text-muted-foreground">
                        {preset.width}×{preset.height}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="min-w-0 rounded-[1.6rem] border border-stone-200 bg-white p-4 sm:p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-stone-500">
              Actions
            </p>
            <div className="mt-4 space-y-3">
              <Button
                type="button"
                onClick={handleShare}
                className="h-11 w-full rounded-2xl"
                disabled={isPending}
              >
                <Share2 className="h-4 w-4" />
                Bagikan Link Preview
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={() => copyAbsoluteUrl("share")}
                className="h-11 w-full rounded-2xl"
              >
                {copiedState === "share" ? (
                  <>
                    <Check className="h-4 w-4" />
                    Link Preview Tersalin
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    Copy Link Preview
                  </>
                )}
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={() => copyAbsoluteUrl("image")}
                className="h-11 w-full rounded-2xl"
              >
                {copiedState === "image" ? (
                  <>
                    <Check className="h-4 w-4" />
                    URL Gambar Tersalin
                  </>
                ) : (
                  <>
                    <ImageIcon className="h-4 w-4" />
                    Copy URL Gambar
                  </>
                )}
              </Button>

              <Button asChild variant="outline" className="h-11 w-full rounded-2xl">
                <Link href={imagePath} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4" />
                  Buka Resolusi Penuh
                </Link>
              </Button>
            </div>
          </div>

          <Button asChild variant="ghost" className="h-11 w-full rounded-2xl">
            <Link href={`/events/${event.id}`}>Kembali ke Event</Link>
          </Button>
        </div>

        <div className="min-w-0">
          <div className="relative overflow-hidden rounded-[1.8rem] border border-stone-200 bg-[#090909]">
            <div className="absolute inset-x-0 top-0 h-[41%] bg-[#e6dece]" />
            <div className="relative p-4 sm:p-8">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="max-w-xl">
                  <h2 className="text-2xl font-black uppercase leading-[0.95] tracking-[-0.05em] text-stone-950 sm:text-4xl">
                    {event.title}
                  </h2>
                </div>
                <div className="rounded-full border border-white/20 bg-black/20 px-4 py-2 text-sm font-medium text-stone-100">
                  {selectedDistance?.name ?? "-"} • {selectedPreset.width}×
                  {selectedPreset.height}
                </div>
              </div>

              <div className="mt-8 flex justify-center">
                <div className="w-full max-w-[19rem]">
                  <div className="rounded-[2.35rem] border border-black/10 bg-stone-300/85 p-3">
                    <div className="rounded-[2rem] border border-black/25 bg-[#1b1815] p-2">
                      <div className="mb-2 flex justify-center">
                        <div className="h-6 w-28 rounded-full border border-white/10 bg-black/30" />
                      </div>
                      <div
                        className="relative overflow-hidden rounded-[1.65rem] bg-black"
                        style={{
                          aspectRatio: `${selectedPreset.width} / ${selectedPreset.height}`,
                        }}
                      >
                        <Image
                          key={imagePath}
                          src={imagePath}
                          alt={`Preview wallpaper ${event.title}`}
                          fill
                          priority
                          unoptimized
                          sizes="(max-width: 768px) 84vw, 19rem"
                          className="object-cover"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 grid gap-3 sm:grid-cols-3">
                <div className="rounded-[1.4rem] border border-white/12 bg-black/20 p-4 text-stone-100">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-stone-400">
                    Countdown
                  </p>
                  <p className="mt-3 text-4xl font-black leading-none">
                    {Math.abs(daysLeft)}
                  </p>
                  <p className="mt-2 text-sm text-stone-300">
                    {daysLeft < 0 ? "hari berlalu" : "hari lagi"}
                  </p>
                </div>
                <div className="rounded-[1.4rem] border border-white/12 bg-black/20 p-4 text-stone-100">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-stone-400">
                    Tanggal
                  </p>
                  <p className="mt-3 text-base font-semibold">
                    {formatDateInJakarta(selectedDate, {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <div className="rounded-[1.4rem] border border-white/12 bg-black/20 p-4 text-stone-100">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-stone-400">
                    Lokasi
                  </p>
                  <p className="mt-3 text-base font-semibold">{event.location}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
