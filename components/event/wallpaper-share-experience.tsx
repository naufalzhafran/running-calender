"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  Copy,
  Download,
  ExternalLink,
  ImageIcon,
  Share2,
  Smartphone,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { ReminderActions } from "@/components/event/reminder-actions";
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
  const [isPreviewLoading, setIsPreviewLoading] = useState(true);

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
  const distanceTitle = selectedDistance?.name ?? "Kategori";
  const selectedDate = selectedDistance?.date ?? event.event_date;
  const daysLeft = getDaysUntilDate(selectedDate);
  const imagePath = buildWallpaperPath({
    eventId: event.id,
    distance: selectedDistance?.name,
    preset: selectedPreset.key,
  });
  const previewImagePath = buildWallpaperPath({
    eventId: event.id,
    distance: selectedDistance?.name,
    preset: selectedPreset.key,
    preview: true,
  });
  const sharePath = buildWallpaperSharePath({
    eventId: event.id,
    distance: selectedDistance?.name,
    preset: selectedPreset.key,
  });

  useEffect(() => {
    setIsPreviewLoading(true);
  }, [previewImagePath]);

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
          title: `${distanceTitle} - ${event.title}`,
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
    <section className="overflow-hidden rounded-3xl border border-border/50 bg-card">
      <div className="border-b border-border/50 px-6 py-6 sm:px-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Detail Kategori
            </p>
            <h1 className="text-3xl font-bold leading-tight tracking-tight text-foreground sm:text-4xl">
              {distanceTitle}
            </h1>
            <p className="mt-2 text-base font-medium text-muted-foreground">
              {event.title}
            </p>
          </div>

          <div className="rounded-2xl border border-border/50 bg-muted/50 px-5 py-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Countdown
            </p>
            <div className="mt-2 flex items-end gap-2">
              <span className="text-4xl font-bold leading-none text-primary">
                {Math.abs(daysLeft)}
              </span>
              <span className="pb-1 text-sm text-muted-foreground">
                {daysLeft < 0 ? "hari berlalu" : "hari lagi"}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 p-4 sm:p-8 xl:grid-cols-[minmax(0,1fr)_28rem] xl:items-start">
        <div className="min-w-0 space-y-4 xl:order-2 xl:sticky xl:top-24">
          <div className="min-w-0 rounded-3xl border border-border/50 bg-muted/50 p-4 sm:p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
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
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-background text-muted-foreground hover:border-primary/30 hover:text-foreground"
                    }`}
                  >
                    {distance.name}
                  </button>
                );
              })}
            </div>
          </div>

          {selectedDistance && (
            <ReminderActions
              eventId={event.id}
              eventTitle={event.title}
              distances={[selectedDistance]}
            />
          )}

          <div className="min-w-0 rounded-3xl border border-border/50 bg-card p-4 sm:p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Wallpaper
            </p>
            <div className="mt-4 space-y-4">
              <div>
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Device
                </p>
                <Select value={selectedPresetKey} onValueChange={handlePresetChange}>
                  <SelectTrigger className="h-auto min-h-14 w-full min-w-0 rounded-2xl bg-background py-3 text-left">
                    <div className="flex min-w-0 flex-1 items-center gap-3 overflow-hidden">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <Smartphone className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1 overflow-hidden">
                        <p className="truncate text-sm font-semibold text-foreground">
                          {selectedPreset.label}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {selectedPreset.width}×{selectedPreset.height}
                        </p>
                      </div>
                    </div>
                  </SelectTrigger>
                  <SelectContent className="w-[min(calc(100vw-2rem),22rem)]">
                    {Object.entries(WALLPAPER_PRESETS).map(([key, preset]) => (
                      <SelectItem
                        key={key}
                        value={key}
                        className="items-start py-3.5 data-[selected]:bg-primary/10 data-[selected]:text-foreground"
                      >
                        <div className="flex min-w-0 flex-col">
                          <span className="whitespace-normal font-semibold leading-snug">
                            {preset.label}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {preset.width}×{preset.height}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Button asChild className="h-11 w-full rounded-2xl">
                  <a href={imagePath} download>
                    <Download className="h-4 w-4" />
                    Download Wallpaper
                  </a>
                </Button>

                <Button asChild variant="outline" className="h-11 w-full rounded-2xl">
                  <Link href={imagePath} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4" />
                    Buka Resolusi Penuh
                  </Link>
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
              </div>

              <div className="rounded-2xl border border-border/50 bg-muted/50 p-4">
                <p className="text-sm font-semibold text-foreground">
                  Pakai dengan iOS Shortcut
                </p>
                <div className="mt-3 space-y-4 text-sm leading-6 text-muted-foreground">
                  <div>
                    <p className="font-medium text-foreground">
                      Buat shortcut sekali
                    </p>
                    <ol className="mt-2 list-decimal space-y-2 pl-4">
                      <li>Pilih device di atas sesuai iPhone kamu.</li>
                      <li>
                        Tap{" "}
                        <span className="font-medium text-foreground">
                          Copy URL Gambar
                        </span>
                        .
                      </li>
                      <li>
                        Buka app{" "}
                        <span className="font-medium text-foreground">
                          Shortcuts
                        </span>
                        , lalu tap <span className="font-medium text-foreground">+</span>.
                      </li>
                      <li>
                        Tambah aksi{" "}
                        <span className="font-medium text-foreground">
                          URL
                        </span>
                        , lalu paste URL gambar yang sudah dicopy.
                      </li>
                      <li>
                        Tambah aksi{" "}
                        <span className="font-medium text-foreground">
                          Get Contents of URL
                        </span>
                        . Input-nya pakai hasil dari aksi URL.
                      </li>
                      <li>
                        Tambah aksi{" "}
                        <span className="font-medium text-foreground">
                          Convert Image
                        </span>
                        . Ubah hasil URL menjadi PNG.
                      </li>
                      <li>
                        Tambah aksi{" "}
                        <span className="font-medium text-foreground">
                          Set Wallpaper
                        </span>
                        . Input-nya pakai Converted Image, lalu pilih Lock Screen,
                        Home Screen, atau keduanya.
                      </li>
                      <li>
                        Matikan opsi preview/konfirmasi jika kamu ingin shortcut
                        langsung memasang wallpaper.
                      </li>
                      <li>
                        Jalankan shortcut. Saat diminta izin akses web, tap Allow.
                      </li>
                    </ol>
                  </div>

                  <div>
                    <p className="font-medium text-foreground">
                      Biar update otomatis
                    </p>
                    <ol className="mt-2 list-decimal space-y-2 pl-4">
                      <li>
                        Buka tab{" "}
                        <span className="font-medium text-foreground">
                          Automation
                        </span>{" "}
                        di Shortcuts.
                      </li>
                      <li>
                        Pilih waktu harian, misalnya setiap pagi jam 06:00.
                      </li>
                      <li>
                        Pilih{" "}
                        <span className="font-medium text-foreground">
                          Run Immediately
                        </span>{" "}
                        jika tersedia.
                      </li>
                      <li>
                        Tambahkan aksi{" "}
                        <span className="font-medium text-foreground">
                          Run Shortcut
                        </span>{" "}
                        dan pilih shortcut wallpaper tadi.
                      </li>
                    </ol>
                  </div>

                  <p>
                    Catatan: URL gambar ini dinamis, jadi countdown akan ikut
                    berubah saat shortcut mengambil gambar terbaru dari server.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="min-w-0 rounded-3xl border border-border/50 bg-card p-4 sm:p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Bagikan
            </p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={handleShare}
                className="h-11 w-full rounded-2xl"
                disabled={isPending}
              >
                <Share2 className="h-4 w-4" />
                Share
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
                    Link
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    Link
                  </>
                )}
              </Button>

            </div>
          </div>
        </div>

        <div className="min-w-0">
          <div className="relative overflow-hidden rounded-3xl border border-border/50 bg-card">
            <div className="absolute inset-x-0 top-0 h-[41%] bg-[#e6dece]" />
            <div className="absolute inset-x-0 bottom-0 h-[59%] bg-[#090909]" />
            <div className="relative p-4 sm:p-8">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="max-w-xl">
                  <h2 className="text-2xl font-bold leading-tight tracking-tight text-foreground sm:text-3xl">
                    {distanceTitle}
                  </h2>
                  <p className="mt-2 text-sm font-medium text-muted-foreground">
                    {event.title}
                  </p>
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
                        aria-busy={isPreviewLoading}
                      >
                        <div
                          className={`absolute inset-0 z-10 flex items-center justify-center bg-stone-950/75 transition-opacity ${
                            isPreviewLoading
                              ? "opacity-100"
                              : "pointer-events-none opacity-0"
                          }`}
                        >
                          <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                        </div>
                        <Image
                          key={previewImagePath}
                          src={previewImagePath}
                          alt={`Preview wallpaper ${event.title}`}
                          fill
                          priority
                          unoptimized
                          sizes="(max-width: 768px) 84vw, 19rem"
                          className={`object-cover transition-opacity duration-300 ${
                            isPreviewLoading ? "opacity-60" : "opacity-100"
                          }`}
                          onLoad={() => setIsPreviewLoading(false)}
                          onError={() => setIsPreviewLoading(false)}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 grid gap-3">
                <div className="rounded-2xl border border-border/50 bg-black/20 p-4 text-stone-100">
                  <p className="text-xs font-medium uppercase tracking-wide text-stone-400">
                    Countdown
                  </p>
                  <p className="mt-3 text-4xl font-bold leading-none text-primary">
                    {Math.abs(daysLeft)}
                  </p>
                  <p className="mt-2 text-sm text-stone-300">
                    {daysLeft < 0 ? "hari berlalu" : "hari lagi"}
                  </p>
                </div>
                <div className="rounded-2xl border border-border/50 bg-black/20 p-4 text-stone-100">
                  <p className="text-xs font-medium uppercase tracking-wide text-stone-400">
                    Tanggal
                  </p>
                  <p className="mt-3 text-base font-semibold text-stone-100">
                    {formatDateInJakarta(selectedDate, {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <div className="rounded-2xl border border-border/50 bg-black/20 p-4 text-stone-100">
                  <p className="text-xs font-medium uppercase tracking-wide text-stone-400">
                    Lokasi
                  </p>
                  <p className="mt-3 text-base font-semibold text-stone-100">{event.location}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
