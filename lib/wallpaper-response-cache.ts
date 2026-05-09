type CachedWallpaperResponse = {
  body: ArrayBuffer;
  createdAt: number;
  etag: string;
};

const WALLPAPER_RESPONSE_CACHE_MAX_ENTRIES = 50;

const wallpaperResponseCache = new Map<string, CachedWallpaperResponse>();

function evictOldestEntry() {
  const oldestKey = wallpaperResponseCache.keys().next().value as
    | string
    | undefined;

  if (oldestKey) {
    wallpaperResponseCache.delete(oldestKey);
  }
}

export function getCachedWallpaperResponse(key: string, maxAgeMs: number) {
  const cached = wallpaperResponseCache.get(key);

  if (!cached) {
    return null;
  }

  if (Date.now() - cached.createdAt > maxAgeMs) {
    wallpaperResponseCache.delete(key);
    return null;
  }

  wallpaperResponseCache.delete(key);
  wallpaperResponseCache.set(key, cached);

  return cached;
}

export function setCachedWallpaperResponse(key: string, body: ArrayBuffer) {
  const cached = {
    body,
    createdAt: Date.now(),
    etag: `"wallpaper-${Buffer.from(key).toString("base64url")}"`,
  };

  wallpaperResponseCache.set(key, cached);

  while (wallpaperResponseCache.size > WALLPAPER_RESPONSE_CACHE_MAX_ENTRIES) {
    evictOldestEntry();
  }

  return cached;
}

export function clearWallpaperResponseCache() {
  wallpaperResponseCache.clear();
}
