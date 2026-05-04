"use client";

import { useState } from "react";
import { Check, Copy, Link as LinkIcon } from "lucide-react";

import {
  buildWallpaperPath,
  DEFAULT_WALLPAPER_PRESET,
  WALLPAPER_PRESETS,
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
    <div className="mt-5 rounded-2xl border border-border/60 bg-muted/30 p-3">
      <div className="mb-3 flex items-center gap-2 text-sm font-medium text-foreground">
        <LinkIcon className="h-4 w-4 text-primary" />
        Generator URL Wallpaper
      </div>

      <div className="space-y-3">
        <Select
          value={preset}
          onValueChange={(value) => setPreset(value as WallpaperPresetKey)}
        >
          <SelectTrigger className="w-full bg-background">
            <SelectValue placeholder="Pilih ukuran layar" />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(WALLPAPER_PRESETS).map(([key, value]) => (
              <SelectItem key={key} value={key}>
                {value.label} ({value.width}×{value.height})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="rounded-xl border border-border/60 bg-background px-3 py-2">
          <p className="line-clamp-3 break-all text-xs text-muted-foreground">
            {relativeUrl}
          </p>
        </div>

        <Button type="button" onClick={handleCopy} className="w-full">
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
