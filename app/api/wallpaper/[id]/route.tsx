import { ImageResponse } from "next/og";
import { unstable_cache } from "next/cache";
import type { NextRequest } from "next/server";

import { getEventById } from "@/lib/data";
import { type DistanceDetail } from "@/types";
import { getWallpaperPreset } from "@/lib/wallpaper";
import { formatDateInJakarta, getJakartaTodayDateString } from "@/lib/date";
import {
  getCachedWallpaperResponse,
  renderAndCacheWallpaperResponse,
} from "@/lib/wallpaper-response-cache";

export const dynamic = "force-dynamic";

const WALLPAPER_IMAGE_REVALIDATE_SECONDS = 15 * 60;
const WALLPAPER_IMAGE_STALE_SECONDS = 24 * 60 * 60;
const WALLPAPER_IMAGE_REVALIDATE_MS =
  WALLPAPER_IMAGE_REVALIDATE_SECONDS * 1000;
const WALLPAPER_IMAGE_CACHE_CONTROL = `public, max-age=0, s-maxage=${WALLPAPER_IMAGE_REVALIDATE_SECONDS}, stale-while-revalidate=${WALLPAPER_IMAGE_STALE_SECONDS}`;
const WALLPAPER_PREVIEW_MAX_WIDTH = 828;

const getCachedWallpaperEventById = unstable_cache(
  async (id: string) => getEventById(id),
  ["wallpaper-event-by-id"],
  {
    revalidate: WALLPAPER_IMAGE_REVALIDATE_SECONDS,
  },
);

function normalizeDistanceName(value: string) {
  return value.trim().toLowerCase();
}

function buildWallpaperCacheKey(options: {
  id: string;
  presetKey: string;
  requestedDistance: string | null;
  width: number;
  height: number;
}) {
  return [
    "wallpaper-v2",
    options.id,
    options.presetKey,
    `${options.width}x${options.height}`,
    normalizeDistanceName(options.requestedDistance ?? ""),
    getJakartaTodayDateString(),
  ].join(":");
}

function createWallpaperResponse(
  body: ArrayBuffer | null,
  options: {
    cacheStatus: "hit" | "miss" | "deduped" | "not-modified";
    etag?: string;
    serverTiming: string;
    status?: number;
  },
) {
  const headers = new Headers({
    "Cache-Control": WALLPAPER_IMAGE_CACHE_CONTROL,
    "Content-Type": "image/png",
    "Server-Timing": options.serverTiming,
    "X-Wallpaper-Cache": options.cacheStatus,
  });

  if (options.etag) {
    headers.set("ETag", options.etag);
  }

  return new Response(body?.slice(0) ?? null, {
    status: options.status ?? 200,
    headers,
  });
}

function createServerTiming(timings: Record<string, number>) {
  return Object.entries(timings)
    .map(([name, duration]) => `${name};dur=${Math.max(0, duration).toFixed(1)}`)
    .join(", ");
}

function pickDistance(
  distances: DistanceDetail[],
  requestedDistance: string | null,
) {
  if (requestedDistance) {
    const matched = distances.find(
      (distance) =>
        normalizeDistanceName(distance.name) ===
        normalizeDistanceName(requestedDistance),
    );

    if (matched) {
      return matched;
    }
  }

  const upcoming = [...distances]
    .filter((distance) => Boolean(distance.date))
    .sort((left, right) => left.date.localeCompare(right.date));

  return upcoming[0] ?? distances[0] ?? null;
}

function toEventDate(date: string, time?: string) {
  const normalizedTime = time && time.trim() ? `${time.trim()}:00` : "00:00:00";
  return new Date(`${date}T${normalizedTime}+07:00`);
}

function getCountdown(targetDate: Date) {
  const now = new Date();
  const millisecondsPerDay = 1000 * 60 * 60 * 24;
  const diff = targetDate.getTime() - now.getTime();

  return Math.ceil(diff / millisecondsPerDay);
}

function formatDate(date: Date) {
  return formatDateInJakarta(date, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatRelativeLabel(daysLeft: number) {
  if (daysLeft < 0) {
    return "EVENT SELESAI";
  }

  if (daysLeft === 0) {
    return "HARI INI";
  }

  if (daysLeft === 1) {
    return "BESOK";
  }

  return "MENUJU START";
}

function formatBigNumber(daysLeft: number) {
  if (daysLeft < 0) {
    return Math.abs(daysLeft).toString();
  }

  return daysLeft.toString();
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export async function GET(
  request: NextRequest,
  ctx: RouteContext<"/api/wallpaper/[id]">,
) {
  const startedAt = performance.now();

  try {
    const { id } = await ctx.params;
    const requestedDistance = request.nextUrl.searchParams.get("distance");
    const preset = getWallpaperPreset(
      request.nextUrl.searchParams.get("preset"),
    );
    const isPreview = request.nextUrl.searchParams.get("preview") === "1";
    const renderWidth = isPreview
      ? Math.min(preset.width, WALLPAPER_PREVIEW_MAX_WIDTH)
      : preset.width;
    const renderHeight = isPreview
      ? Math.round((renderWidth / preset.width) * preset.height)
      : preset.height;
    const responseCacheKey = buildWallpaperCacheKey({
      id,
      presetKey: preset.key,
      requestedDistance,
      width: renderWidth,
      height: renderHeight,
    });
    const cachedResponse = getCachedWallpaperResponse(
      responseCacheKey,
      WALLPAPER_IMAGE_REVALIDATE_MS,
    );

    if (cachedResponse) {
      const serverTiming = createServerTiming({
        total: performance.now() - startedAt,
      });

      if (request.headers.get("if-none-match") === cachedResponse.etag) {
        return createWallpaperResponse(null, {
          cacheStatus: "not-modified",
          etag: cachedResponse.etag,
          serverTiming,
          status: 304,
        });
      }

      return createWallpaperResponse(cachedResponse.body, {
        cacheStatus: "hit",
        etag: cachedResponse.etag,
        serverTiming,
      });
    }

    const dataStartedAt = performance.now();
    const event = await getCachedWallpaperEventById(id);
    const dataDuration = performance.now() - dataStartedAt;

    if (!event) {
      return new Response("Event not found", { status: 404 });
    }

    const selectedDistance = pickDistance(event.distance, requestedDistance);
    const selectedDateString = selectedDistance?.date || event.event_date;
    const selectedTime = selectedDistance?.start_time || "00:00";
    const targetDate = toEventDate(selectedDateString, selectedTime);
    const daysLeft = getCountdown(targetDate);
    const primaryLabel = formatRelativeLabel(daysLeft);
    const bigNumber = formatBigNumber(daysLeft);
    const numberCaption = daysLeft < 0 ? "HARI BERLALU" : "HARI LAGI";
    const locationLine = event.location.toUpperCase();
    const categoryLine = selectedDistance?.name ?? "EVENT";
    const timeLine = selectedDistance?.start_time
      ? `START ${selectedDistance.start_time}`
      : "START TBA";
    const horizontalPadding = Math.round(renderWidth * 0.07);
    const footerInset = Math.round(renderHeight * 0.055);
    const titleTop = Math.round(renderHeight * 0.16);
    const titleBottom = Math.round(renderHeight * 0.625);
    const countdownTop = Math.round(renderHeight * 0.445);
    const titleWidth = Math.round(renderWidth * 0.74);
    const footerTextWidth = Math.round(renderWidth * 0.62);
    const titleFontSize = clamp(Math.round(renderWidth * 0.085), 84, 112);
    const countdownFontSize = clamp(
      Math.round(renderWidth * 0.34),
      340,
      520,
    );
    const footerTitleSize = clamp(Math.round(renderWidth * 0.052), 56, 74);
    const bodyTextSize = clamp(Math.round(renderWidth * 0.025), 26, 34);
    const metaTextSize = clamp(Math.round(renderWidth * 0.02), 20, 28);
    const badgeSize = clamp(Math.round(renderWidth * 0.105), 116, 140);

    const renderStartedAt = performance.now();
    const { entry, cacheStatus } = await renderAndCacheWallpaperResponse(
      responseCacheKey,
      async () => {
        const image = new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            position: "relative",
            background: "#060606",
            color: "#f5f1e8",
            fontFamily:
              '"Avenir Next", "Helvetica Neue", Helvetica, Arial, sans-serif',
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: "41%",
              display: "flex",
              background: "#e6dece",
            }}
          />

          <div
            style={{
              position: "absolute",
              top: titleTop,
              bottom: titleBottom,
              left: horizontalPadding,
              maxWidth: titleWidth,
              display: "flex",
              flexDirection: "column",
              justifyContent: "flex-end",
            }}
          >
            <div
              style={{
                display: "flex",
                fontSize: titleFontSize,
                lineHeight: 0.95,
                fontWeight: 800,
                color: "#161311",
                textTransform: "uppercase",
                letterSpacing: -4,
              }}
            >
              {event.title}
            </div>
          </div>

          <div
            style={{
              position: "absolute",
              top: countdownTop,
              left: horizontalPadding,
              right: horizontalPadding,
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-start",
              gap: 10,
            }}
          >
            <div
              style={{
                display: "flex",
                fontSize: clamp(Math.round(renderWidth * 0.026), 28, 36),
                letterSpacing: 6,
                color: "#d5c49c",
                fontWeight: 700,
              }}
            >
              {primaryLabel}
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "flex-end",
                gap: 28,
              }}
            >
              <div
                style={{
                  display: "flex",
                  fontSize: countdownFontSize,
                  lineHeight: 0.82,
                  fontWeight: 800,
                  letterSpacing: -22,
                  color: "#ffffff",
                }}
              >
                {bigNumber}
              </div>
              <div
                style={{
                  display: "flex",
                  paddingBottom: Math.round(countdownFontSize * 0.14),
                  fontSize: clamp(Math.round(renderWidth * 0.037), 38, 48),
                  letterSpacing: 8,
                  color: "#d5c49c",
                  fontWeight: 700,
                  textTransform: "uppercase",
                }}
              >
                {numberCaption}
              </div>
            </div>
          </div>

          <div
            style={{
              position: "absolute",
              left: horizontalPadding,
              right: horizontalPadding,
              bottom: footerInset,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-end",
              gap: 48,
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 18,
                maxWidth: footerTextWidth,
              }}
            >
              <div
                style={{
                  display: "flex",
                  fontSize: footerTitleSize,
                  lineHeight: 1.02,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  color: "#ffffff",
                }}
              >
                {categoryLine}
              </div>
              <div
                style={{
                  display: "flex",
                  fontSize: bodyTextSize,
                  lineHeight: 1.25,
                  letterSpacing: 2,
                  color: "#cfcfcf",
                }}
              >
                {formatDate(targetDate)}
              </div>
              <div
                style={{
                  display: "flex",
                  fontSize: metaTextSize,
                  letterSpacing: 3,
                  color: "#a5a5a5",
                  textTransform: "uppercase",
                }}
              >
                {locationLine} · {timeLine}
              </div>
            </div>
            <div
              style={{
                display: "flex",
                width: badgeSize,
                height: badgeSize,
                borderRadius: 9999,
                border: "2px solid rgba(255,255,255,0.16)",
                alignItems: "center",
                justifyContent: "center",
                color: "#d4c198",
                fontSize: clamp(Math.round(renderWidth * 0.017), 18, 22),
                letterSpacing: 4,
                textTransform: "uppercase",
              }}
            >
              Run
            </div>
          </div>
        </div>
      ),
      {
        width: renderWidth,
        height: renderHeight,
      },
    );

        return image.arrayBuffer();
      },
    );
    const renderDuration = performance.now() - renderStartedAt;

    return createWallpaperResponse(entry.body, {
      cacheStatus,
      etag: entry.etag,
      serverTiming: createServerTiming({
        data: dataDuration,
        render: renderDuration,
        total: performance.now() - startedAt,
      }),
    });
  } catch (error) {
    console.error(error);
    return new Response("Failed to generate wallpaper", { status: 500 });
  }
}
