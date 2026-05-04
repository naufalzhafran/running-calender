export type WallpaperPreset = {
  label: string;
  width: number;
  height: number;
};

export const WALLPAPER_PRESETS = {
  "iphone-16-pro": {
    label: "iPhone 16 Pro",
    width: 1206,
    height: 2622,
  },
  "iphone-16-pro-max": {
    label: "iPhone 16 Pro Max",
    width: 1320,
    height: 2868,
  },
  "iphone-15-pro": {
    label: "iPhone 15 Pro",
    width: 1179,
    height: 2556,
  },
  generic: {
    label: "Generic Tall",
    width: 1290,
    height: 2796,
  },
} satisfies Record<string, WallpaperPreset>;

export type WallpaperPresetKey = keyof typeof WALLPAPER_PRESETS;

export const DEFAULT_WALLPAPER_PRESET: WallpaperPresetKey = "generic";

export function getWallpaperPreset(value: string | null | undefined) {
  if (value && value in WALLPAPER_PRESETS) {
    return {
      key: value as WallpaperPresetKey,
      ...WALLPAPER_PRESETS[value as WallpaperPresetKey],
    };
  }

  return {
    key: DEFAULT_WALLPAPER_PRESET,
    ...WALLPAPER_PRESETS[DEFAULT_WALLPAPER_PRESET],
  };
}

export function buildWallpaperPath(options: {
  eventId: string;
  distance?: string;
  preset?: string;
}) {
  const searchParams = new URLSearchParams();

  if (options.distance) {
    searchParams.set("distance", options.distance);
  }

  if (options.preset) {
    searchParams.set("preset", options.preset);
  }

  const queryString = searchParams.toString();
  return `/api/wallpaper/${options.eventId}${queryString ? `?${queryString}` : ""}`;
}
