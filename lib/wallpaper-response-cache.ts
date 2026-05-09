type CachedWallpaperResponse = {
  body: ArrayBuffer;
  createdAt: number;
  etag: string;
  eventId: string;
  size: number;
};

type WallpaperRenderResult = {
  entry: CachedWallpaperResponse;
  cacheStatus: "miss" | "deduped";
};

const WALLPAPER_RESPONSE_CACHE_MAX_BYTES = 64 * 1024 * 1024;

const wallpaperResponseCache = new Map<string, CachedWallpaperResponse>();
const pendingWallpaperRenders = new Map<
  string,
  Promise<CachedWallpaperResponse>
>();
let wallpaperResponseCacheBytes = 0;

function evictOldestEntry() {
  const oldestKey = wallpaperResponseCache.keys().next().value as
    | string
    | undefined;

  if (oldestKey) {
    deleteCachedWallpaperResponse(oldestKey);
  }
}

function deleteCachedWallpaperResponse(key: string) {
  const cached = wallpaperResponseCache.get(key);

  if (!cached) {
    return;
  }

  wallpaperResponseCache.delete(key);
  wallpaperResponseCacheBytes -= cached.size;
}

export function getCachedWallpaperResponse(key: string, maxAgeMs: number) {
  const cached = wallpaperResponseCache.get(key);

  if (!cached) {
    return null;
  }

  if (Date.now() - cached.createdAt > maxAgeMs) {
    deleteCachedWallpaperResponse(key);
    return null;
  }

  wallpaperResponseCache.delete(key);
  wallpaperResponseCache.set(key, cached);

  return cached;
}

export function setCachedWallpaperResponse(key: string, body: ArrayBuffer) {
  deleteCachedWallpaperResponse(key);

  const cached = {
    body,
    createdAt: Date.now(),
    eventId: key.split(":")[1] ?? "",
    etag: `"wallpaper-${Buffer.from(key).toString("base64url")}"`,
    size: body.byteLength,
  };

  wallpaperResponseCache.set(key, cached);
  wallpaperResponseCacheBytes += cached.size;

  while (
    wallpaperResponseCache.size > 1 &&
    wallpaperResponseCacheBytes > WALLPAPER_RESPONSE_CACHE_MAX_BYTES
  ) {
    evictOldestEntry();
  }

  return cached;
}

export async function renderAndCacheWallpaperResponse(
  key: string,
  render: () => Promise<ArrayBuffer>,
): Promise<WallpaperRenderResult> {
  const pendingRender = pendingWallpaperRenders.get(key);

  if (pendingRender) {
    return {
      entry: await pendingRender,
      cacheStatus: "deduped",
    };
  }

  const renderPromise = render().then((body) =>
    setCachedWallpaperResponse(key, body),
  );
  pendingWallpaperRenders.set(key, renderPromise);

  try {
    return {
      entry: await renderPromise,
      cacheStatus: "miss",
    };
  } finally {
    pendingWallpaperRenders.delete(key);
  }
}

export function clearWallpaperResponseCacheForEvent(eventId: string) {
  for (const [key, cached] of wallpaperResponseCache) {
    if (cached.eventId === eventId) {
      deleteCachedWallpaperResponse(key);
    }
  }
}

export function clearWallpaperResponseCache() {
  wallpaperResponseCache.clear();
  wallpaperResponseCacheBytes = 0;
}
