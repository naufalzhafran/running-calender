"use client";

import { useState } from "react";
import { Check, Copy, Link as LinkIcon } from "lucide-react";

import {
  buildWallpaperPath,
  DEFAULT_WALLPAPER_PRESET,
  WALLPAPER_PRESETS,
  getWallpaperPreset,
  type WallpaperPresetKey,
} from "@/lib/wallpaper";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type WallpaperUrlGeneratorProps = {
  eventId: string;
  distanceName: string;
};

export function WallpaperUrlGenerator({
  eventId,
  distanceName,
}: WallpaperUrlGeneratorProps) {
  const [preset, setPreset] =
    useState<WallpaperPresetKey>(DEFAULT_WALLPAPER_PRESET);
  const [copied, setCopied] = useState(false);
  const selectedPreset = getWallpaperPreset(preset);

  const relativeUrl = buildWallpaperPath({
    eventId,
    distance: distanceName,
    preset,
  });

  const handleCopy = async () => {
    const absoluteUrl =
      typeof window === "undefined"
        ? relativeUrl
        : `${window.location.origin}${relativeUrl}`;

    await navigator.clipboard.writeText(absoluteUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div className="mt-5 rounded-3xl border border-border/60 bg-muted/20 p-4">
      <div className="mb-1 flex items-center gap-2 text-sm font-semibold text-foreground">
        <LinkIcon className="h-4 w-4 text-primary" />
        Generator URL Wallpaper
      </div>
      <p className="mb-4 text-xs leading-relaxed text-muted-foreground">
        Pilih ukuran iPhone lalu copy URL untuk dipakai di Shortcut atau browser.
      </p>

      <div className="space-y-3">
        <Select
          value={preset}
          onValueChange={(value) => setPreset(value as WallpaperPresetKey)}
        >
          <SelectTrigger className="h-auto min-h-11 w-full bg-background py-3">
            <SelectValue placeholder="Pilih ukuran layar">
              <div className="flex min-w-0 flex-col items-start text-left">
                <span className="truncate text-sm font-medium">
                  {selectedPreset.shortLabel}
                </span>
                <span className="text-xs text-muted-foreground">
                  {selectedPreset.width}×{selectedPreset.height}
                </span>
              </div>
            </SelectValue>
          </SelectTrigger>
          <SelectContent className="max-w-[min(24rem,var(--radix-popper-anchor-width))]">
            {Object.entries(WALLPAPER_PRESETS).map(([key, value]) => (
              <SelectItem key={key} value={key} className="items-start py-2.5">
                <div className="flex min-w-0 flex-col">
                  <span className="truncate font-medium">{value.shortLabel}</span>
                  <span className="text-xs text-muted-foreground">
                    {value.width}×{value.height}
                  </span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="rounded-2xl border border-border/60 bg-background px-3 py-3">
          <p className="line-clamp-3 break-all text-xs leading-relaxed text-muted-foreground">
            {relativeUrl}
          </p>
        </div>

        <Button
          type="button"
          onClick={handleCopy}
          className="h-11 w-full rounded-2xl"
        >
          {copied ? (
            <>
              <Check className="mr-2 h-4 w-4" />
              URL Tersalin
            </>
          ) : (
            <>
              <Copy className="mr-2 h-4 w-4" />
              Copy URL Shortcut
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
