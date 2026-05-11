"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  ChevronDown,
  Copy,
  Download,
  ExternalLink,
  ImageIcon,
  Share2,
  Smartphone,
} from "lucide-react";

import { ReminderActions } from "@/components/event/reminder-actions";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { formatDateInJakarta, getDaysUntilDate } from "@/lib/date";
import { normalizeDistanceName, pickDistance } from "@/lib/event-utils";
import { cn } from "@/lib/utils";
import {
  buildWallpaperPath,
  buildWallpaperSharePath,
  getWallpaperPreset,
  type WallpaperPresetKey,
  WALLPAPER_PRESETS,
} from "@/lib/wallpaper";
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

type CopyTarget = "share" | "image";
type SelectedPreset = ReturnType<typeof getWallpaperPreset>;

const SHORTCUT_STEPS = [
  {
    action: "Get Contents of URL",
    detail: "Paste URL gambar ke field URL.",
  },
  {
    action: "Convert Image",
    detail: "Convert hasil URL ke PNG.",
  },
  {
    action: "Set Wallpaper",
    detail:
      "Pakai Converted Image, pilih Lock Screen/Home Screen, lalu matikan Show Preview.",
  },
];

function CountdownSummary({ daysLeft }: { daysLeft: number }) {
  return (
    <div className="w-full rounded-2xl border border-border/50 bg-muted/50 px-4 py-3 sm:w-auto sm:px-5 sm:py-4">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Countdown
      </p>
      <div className="mt-2 flex items-end gap-2">
        <span className="text-3xl font-bold leading-none text-primary sm:text-4xl">
          {Math.abs(daysLeft)}
        </span>
        <span className="pb-1 text-sm text-muted-foreground">
          {daysLeft < 0 ? "hari berlalu" : "hari lagi"}
        </span>
      </div>
    </div>
  );
}

function CategorySelector({
  distances,
  selectedDistance,
  onChange,
}: {
  distances: DistanceDetail[];
  selectedDistance: DistanceDetail | null;
  onChange: (distanceName: string) => void;
}) {
  return (
    <div className="min-w-0 rounded-3xl border border-border/50 bg-muted/50 p-4 sm:p-5">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Kategori
      </p>
      <div className="-mx-1 mt-4 flex flex-nowrap gap-2 overflow-x-auto px-1 pb-1 sm:flex-wrap sm:overflow-visible sm:pb-0">
        {distances.map((distance) => {
          const isActive =
            normalizeDistanceName(distance.name) ===
            normalizeDistanceName(selectedDistance?.name ?? "");

          return (
            <button
              key={`${distance.name}-${distance.date}`}
              type="button"
              onClick={() => onChange(distance.name)}
              className={cn(
                "shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition",
                isActive
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-background text-muted-foreground hover:border-primary/30 hover:text-foreground",
              )}
            >
              {distance.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function WallpaperDeviceSelect({
  selectedPreset,
  selectedPresetKey,
  onChange,
}: {
  selectedPreset: SelectedPreset;
  selectedPresetKey: WallpaperPresetKey;
  onChange: (presetKey: string) => void;
}) {
  return (
    <div>
      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Device
      </p>
      <Select value={selectedPresetKey} onValueChange={onChange}>
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
  );
}

function WallpaperActions({
  imagePath,
  copiedState,
  onCopyImage,
}: {
  imagePath: string;
  copiedState: CopyTarget | null;
  onCopyImage: () => void;
}) {
  return (
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
        onClick={onCopyImage}
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
  );
}

function ShortcutGuide({
  open,
  onToggle,
}: {
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border/50 bg-muted/50">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-3 p-4 text-left"
        aria-expanded={open}
      >
        <div>
          <p className="text-sm font-semibold text-foreground">
            Shortcut Instruction
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Setup manual sekali untuk update wallpaper dari URL.
          </p>
        </div>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
            open && "rotate-180",
          )}
        />
      </button>

      {open && (
        <div className="border-t border-border/50 p-4 pt-3">
          <div className="space-y-4 text-sm leading-6 text-muted-foreground">
            <div className="rounded-xl bg-background p-3">
              <p className="font-medium text-foreground">Sebelum mulai</p>
              <div className="mt-2 grid gap-2">
                <ShortcutNumberedText number={1}>
                  Pilih device/resolusi yang sesuai.
                </ShortcutNumberedText>
                <ShortcutNumberedText number={2}>
                  Tap{" "}
                  <span className="font-medium text-foreground">
                    Copy URL Gambar
                  </span>
                  .
                </ShortcutNumberedText>
              </div>
            </div>

            <div>
              <p className="font-medium text-foreground">Buat shortcut</p>
              <div className="mt-2 space-y-2">
                {SHORTCUT_STEPS.map((step, index) => (
                  <div
                    key={step.action}
                    className="rounded-xl border border-border/50 bg-background p-3"
                  >
                    <div className="flex items-start gap-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                        {index + 1}
                      </span>
                      <div>
                        <p className="font-semibold text-foreground">
                          {step.action}
                        </p>
                        <p className="mt-0.5">{step.detail}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl bg-background p-3">
              <p className="font-medium text-foreground">
                Opsional: otomatis harian
              </p>
              <ol className="mt-2 list-decimal space-y-2 pl-4">
                <li>
                  Jalankan shortcut manual sekali sampai wallpaper berhasil
                  berubah.
                </li>
                <li>
                  Jika muncul izin akses web atau wallpaper, pilih{" "}
                  <span className="font-medium text-foreground">Allow</span>.
                </li>
                <li>
                  Buka tab{" "}
                  <span className="font-medium text-foreground">
                    Automation
                  </span>{" "}
                  di Shortcuts, lalu buat automation waktu harian.
                </li>
                <li>
                  Tambahkan aksi{" "}
                  <span className="font-medium text-foreground">
                    Run Shortcut
                  </span>{" "}
                  dan pilih shortcut wallpaper ini.
                </li>
                <li>
                  Pilih{" "}
                  <span className="font-medium text-foreground">
                    Run Immediately
                  </span>{" "}
                  jika tersedia. Matikan{" "}
                  <span className="font-medium text-foreground">
                    Ask Before Running
                  </span>{" "}
                  jika iOS menampilkan opsi itu.
                </li>
                <li>
                  Setelah jadwal lewat, cek Lock Screen/Home Screen. Jika belum
                  berubah, buka tab Automation dan pastikan automation tidak
                  dalam kondisi disabled dan Show Preview di aksi Set Wallpaper
                  sudah mati.
                </li>
              </ol>
            </div>

            <p>
              URL gambar bersifat dinamis. Saat shortcut mengambil URL yang
              sama, countdown wallpaper akan memakai data terbaru.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function ShortcutNumberedText({
  number,
  children,
}: {
  number: number;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-2">
      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
        {number}
      </span>
      <p>{children}</p>
    </div>
  );
}

function WallpaperControls({
  imagePath,
  copiedState,
  selectedPreset,
  selectedPresetKey,
  showShortcutGuide,
  onCopyImage,
  onPresetChange,
  onToggleShortcutGuide,
}: {
  imagePath: string;
  copiedState: CopyTarget | null;
  selectedPreset: SelectedPreset;
  selectedPresetKey: WallpaperPresetKey;
  showShortcutGuide: boolean;
  onCopyImage: () => void;
  onPresetChange: (presetKey: string) => void;
  onToggleShortcutGuide: () => void;
}) {
  return (
    <div className="min-w-0 rounded-3xl border border-border/50 bg-card p-4 sm:p-5">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Wallpaper
      </p>
      <div className="mt-4 space-y-4">
        <WallpaperDeviceSelect
          selectedPreset={selectedPreset}
          selectedPresetKey={selectedPresetKey}
          onChange={onPresetChange}
        />
        <WallpaperActions
          imagePath={imagePath}
          copiedState={copiedState}
          onCopyImage={onCopyImage}
        />
        <ShortcutGuide open={showShortcutGuide} onToggle={onToggleShortcutGuide} />
      </div>
    </div>
  );
}

function SharePanel({
  copiedState,
  isPending,
  onShare,
  onCopyShare,
}: {
  copiedState: CopyTarget | null;
  isPending: boolean;
  onShare: () => void;
  onCopyShare: () => void;
}) {
  return (
    <div className="min-w-0 rounded-3xl border border-border/50 bg-card p-4 sm:p-5">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Bagikan
      </p>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={onShare}
          className="h-11 w-full rounded-2xl"
          disabled={isPending}
        >
          <Share2 className="h-4 w-4" />
          Share
        </Button>

        <Button
          type="button"
          variant="outline"
          onClick={onCopyShare}
          className="h-11 w-full rounded-2xl"
        >
          {copiedState === "share" ? (
            <Check className="h-4 w-4" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
          Link
        </Button>
      </div>
    </div>
  );
}

function PhonePreview({
  event,
  daysLeft,
  distanceTitle,
  previewImagePath,
  selectedDate,
  selectedDistance,
  selectedPreset,
  isPreviewLoading,
  onImageReady,
}: {
  event: WallpaperShareExperienceProps["event"];
  daysLeft: number;
  distanceTitle: string;
  previewImagePath: string;
  selectedDate: string;
  selectedDistance: DistanceDetail | null;
  selectedPreset: SelectedPreset;
  isPreviewLoading: boolean;
  onImageReady: () => void;
}) {
  return (
    <div className="order-1 min-w-0">
      <div className="relative overflow-hidden rounded-3xl border border-border/50 bg-card">
        <div className="absolute inset-x-0 top-0 h-[41%] bg-[#e6dece]" />
        <div className="absolute inset-x-0 bottom-0 h-[59%] bg-[#090909]" />
        <div className="relative p-4 sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-xl">
              <h2 className="text-xl font-bold leading-tight tracking-tight text-foreground sm:text-3xl">
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

          <div className="mt-6 flex justify-center sm:mt-8">
            <div className="w-full max-w-[16.5rem] sm:max-w-[19rem]">
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
                      className={cn(
                        "absolute inset-0 z-10 flex items-center justify-center bg-stone-950/75 transition-opacity",
                        isPreviewLoading
                          ? "opacity-100"
                          : "pointer-events-none opacity-0",
                      )}
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
                      className={cn(
                        "object-cover transition-opacity duration-300",
                        isPreviewLoading ? "opacity-60" : "opacity-100",
                      )}
                      onLoad={onImageReady}
                      onError={onImageReady}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:mt-8">
            <PreviewInfoCard label="Countdown">
              <p className="mt-3 text-4xl font-bold leading-none text-primary">
                {Math.abs(daysLeft)}
              </p>
              <p className="mt-2 text-sm text-stone-300">
                {daysLeft < 0 ? "hari berlalu" : "hari lagi"}
              </p>
            </PreviewInfoCard>
            <PreviewInfoCard label="Tanggal">
              <p className="mt-3 text-base font-semibold text-stone-100">
                {formatDateInJakarta(selectedDate, {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </PreviewInfoCard>
            <PreviewInfoCard label="Lokasi">
              <p className="mt-3 text-base font-semibold text-stone-100">
                {event.location}
              </p>
            </PreviewInfoCard>
          </div>
        </div>
      </div>
    </div>
  );
}

function PreviewInfoCard({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border/50 bg-black/20 p-4 text-stone-100">
      <p className="text-xs font-medium uppercase tracking-wide text-stone-400">
        {label}
      </p>
      {children}
    </div>
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
  const [copiedState, setCopiedState] = useState<CopyTarget | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(true);
  const [showShortcutGuide, setShowShortcutGuide] = useState(false);

  useEffect(() => {
    setSelectedDistanceName(initialDistanceName ?? distances[0]?.name ?? "");
  }, [distances, initialDistanceName]);

  useEffect(() => {
    setSelectedPresetKey(initialPresetKey);
  }, [initialPresetKey]);

  const selectedDistance = useMemo(
    () => pickDistance(distances, selectedDistanceName),
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

  async function copyAbsoluteUrl(type: CopyTarget) {
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
          text: `${event.title}${
            selectedDistance ? ` • ${selectedDistance.name}` : ""
          }`,
          url: absoluteShareUrl,
        });
        return;
      }
    } catch {
      // Clipboard fallback below.
    }

    await copyAbsoluteUrl("share");
  }

  return (
    <section className="overflow-hidden rounded-3xl border border-border/50 bg-card">
      <div className="border-b border-border/50 px-4 py-5 sm:px-8 sm:py-6">
        <div className="flex flex-col gap-4 sm:gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground sm:mb-3">
              Detail Kategori
            </p>
            <h1 className="text-2xl font-bold leading-tight tracking-tight text-foreground sm:text-4xl">
              {distanceTitle}
            </h1>
            <p className="mt-2 text-base font-medium text-muted-foreground">
              {event.title}
            </p>
          </div>

          <CountdownSummary daysLeft={daysLeft} />
        </div>
      </div>

      <div className="grid gap-5 p-4 sm:gap-6 sm:p-8 xl:grid-cols-[minmax(0,1fr)_28rem] xl:items-start">
        <div className="order-2 min-w-0 space-y-4 xl:sticky xl:top-24">
          <CategorySelector
            distances={distances}
            selectedDistance={selectedDistance}
            onChange={handleDistanceChange}
          />

          {selectedDistance && (
            <ReminderActions
              eventId={event.id}
              eventTitle={event.title}
              distances={[selectedDistance]}
            />
          )}

          <WallpaperControls
            imagePath={imagePath}
            copiedState={copiedState}
            selectedPreset={selectedPreset}
            selectedPresetKey={selectedPresetKey}
            showShortcutGuide={showShortcutGuide}
            onCopyImage={() => copyAbsoluteUrl("image")}
            onPresetChange={handlePresetChange}
            onToggleShortcutGuide={() =>
              setShowShortcutGuide((current) => !current)
            }
          />

          <SharePanel
            copiedState={copiedState}
            isPending={isPending}
            onShare={handleShare}
            onCopyShare={() => copyAbsoluteUrl("share")}
          />
        </div>

        <PhonePreview
          event={event}
          daysLeft={daysLeft}
          distanceTitle={distanceTitle}
          previewImagePath={previewImagePath}
          selectedDate={selectedDate}
          selectedDistance={selectedDistance}
          selectedPreset={selectedPreset}
          isPreviewLoading={isPreviewLoading}
          onImageReady={() => setIsPreviewLoading(false)}
        />
      </div>
    </section>
  );
}
