// Mirrors server/internal/wallpaper/presets.go — keep the keys in sync.

export const WALLPAPER_PRESETS = {
  "iphone-11-xr": { label: "iPhone 11, XR", width: 828, height: 1792 },
  "iphone-11-pro-x-xs": { label: "iPhone 11 Pro, XS, X", width: 1125, height: 2436 },
  "iphone-11-pro-max-xs-max": { label: "iPhone 11 Pro Max, XS Max", width: 1242, height: 2688 },
  "iphone-12-12-pro-13-13-pro-14": { label: "iPhone 12, 12 Pro, 13, 13 Pro, 14", width: 1170, height: 2532 },
  "iphone-12-mini-13-mini": { label: "iPhone 12 mini, 13 mini", width: 1080, height: 2340 },
  "iphone-12-pro-max-13-pro-max-14-plus": { label: "iPhone 12 Pro Max, 13 Pro Max, 14 Plus", width: 1284, height: 2778 },
  "iphone-14-pro-15-15-pro": { label: "iPhone 14 Pro, 15, 15 Pro", width: 1179, height: 2556 },
  "iphone-14-pro-max-15-plus-15-pro-max-16-plus": { label: "iPhone 14 Pro Max, 15 Plus, 15 Pro Max, 16 Plus", width: 1290, height: 2796 },
  "iphone-16-pro": { label: "iPhone 16 Pro, 17, 17 Pro", width: 1206, height: 2622 },
  "iphone-16-pro-max": { label: "iPhone 16 Pro Max, 17 Pro Max", width: 1320, height: 2868 },
};

export const DEFAULT_PRESET = "iphone-14-pro-max-15-plus-15-pro-max-16-plus";

export function getPreset(key) {
  const resolved = key in WALLPAPER_PRESETS ? key : DEFAULT_PRESET;
  return { key: resolved, ...WALLPAPER_PRESETS[resolved] };
}
