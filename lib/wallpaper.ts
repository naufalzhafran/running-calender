export type WallpaperPreset = {
  label: string;
  shortLabel: string;
  width: number;
  height: number;
};

export const WALLPAPER_PRESETS = {
  "iphone-11-xr": {
    label: "iPhone 11, XR",
    shortLabel: "11 / XR",
    width: 828,
    height: 1792,
  },
  "iphone-11-pro-x-xs": {
    label: "iPhone 11 Pro, XS, X",
    shortLabel: "11 Pro / XS / X",
    width: 1125,
    height: 2436,
  },
  "iphone-11-pro-max-xs-max": {
    label: "iPhone 11 Pro Max, XS Max",
    shortLabel: "11 Pro Max / XS Max",
    width: 1242,
    height: 2688,
  },
  "iphone-12-12-pro-13-13-pro-14": {
    label: "iPhone 12, 12 Pro, 13, 13 Pro, 14",
    shortLabel: "12 / 12 Pro / 13 / 13 Pro / 14",
    width: 1170,
    height: 2532,
  },
  "iphone-12-mini-13-mini": {
    label: "iPhone 12 mini, 13 mini",
    shortLabel: "12 mini / 13 mini",
    width: 1080,
    height: 2340,
  },
  "iphone-12-pro-max-13-pro-max-14-plus": {
    label: "iPhone 12 Pro Max, 13 Pro Max, 14 Plus",
    shortLabel: "12 Pro Max / 13 Pro Max / 14 Plus",
    width: 1284,
    height: 2778,
  },
  "iphone-14-pro-15-15-pro": {
    label: "iPhone 14 Pro, 15, 15 Pro",
    shortLabel: "14 Pro / 15 / 15 Pro",
    width: 1179,
    height: 2556,
  },
  "iphone-14-pro-max-15-plus-15-pro-max-16-plus": {
    label: "iPhone 14 Pro Max, 15 Plus, 15 Pro Max, 16 Plus",
    shortLabel: "14 Pro Max / 15 Plus / 15 Pro Max / 16 Plus",
    width: 1290,
    height: 2796,
  },
  "iphone-16-pro": {
    label: "iPhone 16 Pro, 17, 17 Pro",
    shortLabel: "16 Pro / 17 / 17 Pro",
    width: 1206,
    height: 2622,
  },
  "iphone-16-pro-max": {
    label: "iPhone 16 Pro Max, 17 Pro Max",
    shortLabel: "16 Pro Max / 17 Pro Max",
    width: 1320,
    height: 2868,
  },
} satisfies Record<string, WallpaperPreset>;

export type WallpaperPresetKey = keyof typeof WALLPAPER_PRESETS;

export const DEFAULT_WALLPAPER_PRESET: WallpaperPresetKey =
  "iphone-14-pro-max-15-plus-15-pro-max-16-plus";

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
