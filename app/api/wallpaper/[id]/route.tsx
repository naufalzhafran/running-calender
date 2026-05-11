import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";

import { getEventSummaryById } from "@/lib/data";
import { normalizeDistanceName, pickDistance } from "@/lib/event-utils";
import { getWallpaperPreset } from "@/lib/wallpaper";
import { formatDateInJakarta, getJakartaTodayDateString } from "@/lib/date";
import {
  getCachedWallpaperResponse,
  renderAndCacheWallpaperResponse,
} from "@/lib/wallpaper-response-cache";
import { type DistanceDetail, type EventSummary } from "@/types";

const WALLPAPER_IMAGE_REVALIDATE_SECONDS = 15 * 60;
const WALLPAPER_IMAGE_STALE_SECONDS = 24 * 60 * 60;
const WALLPAPER_IMAGE_REVALIDATE_MS =
  WALLPAPER_IMAGE_REVALIDATE_SECONDS * 1000;
const WALLPAPER_IMAGE_CACHE_CONTROL = `public, max-age=0, s-maxage=${WALLPAPER_IMAGE_REVALIDATE_SECONDS}, stale-while-revalidate=${WALLPAPER_IMAGE_STALE_SECONDS}`;
const WALLPAPER_PREVIEW_MAX_WIDTH = 828;
const MILLISECONDS_PER_DAY = 1000 * 60 * 60 * 24;
const WALLPAPER_FONT_FAMILY =
  '"Avenir Next", "Helvetica Neue", Helvetica, Arial, sans-serif';

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

function getRenderSize(
  preset: { width: number; height: number },
  isPreview: boolean,
) {
  if (!isPreview) {
    return {
      width: preset.width,
      height: preset.height,
    };
  }

  const width = Math.min(preset.width, WALLPAPER_PREVIEW_MAX_WIDTH);

  return {
    width,
    height: Math.round((width / preset.width) * preset.height),
  };
}

function toEventDate(date: string, time?: string) {
  const normalizedTime = time && time.trim() ? `${time.trim()}:00` : "00:00:00";
  return new Date(`${date}T${normalizedTime}+07:00`);
}

function getCountdown(targetDate: Date) {
  const now = new Date();
  const diff = targetDate.getTime() - now.getTime();

  return Math.ceil(diff / MILLISECONDS_PER_DAY);
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

function createWallpaperViewModel(options: {
  event: EventSummary;
  selectedDistance: DistanceDetail | null;
  width: number;
  height: number;
}) {
  const { event, selectedDistance, width, height } = options;
  const selectedDateString = selectedDistance?.date || event.event_date;
  const selectedTime = selectedDistance?.start_time || "00:00";
  const targetDate = toEventDate(selectedDateString, selectedTime);
  const daysLeft = getCountdown(targetDate);
  const countdownFontSize = clamp(Math.round(width * 0.34), 340, 520);

  return {
    title: event.title,
    primaryLabel: formatRelativeLabel(daysLeft),
    bigNumber: formatBigNumber(daysLeft),
    numberCaption: daysLeft < 0 ? "HARI BERLALU" : "HARI LAGI",
    categoryLine: selectedDistance?.name ?? "EVENT",
    dateLine: formatDate(targetDate),
    locationLine: event.location.toUpperCase(),
    timeLine: selectedDistance?.start_time
      ? `START ${selectedDistance.start_time}`
      : "START TBA",
    layout: {
      horizontalPadding: Math.round(width * 0.07),
      footerInset: Math.round(height * 0.055),
      titleTop: Math.round(height * 0.16),
      titleBottom: Math.round(height * 0.625),
      countdownTop: Math.round(height * 0.445),
      titleWidth: Math.round(width * 0.74),
      footerTextWidth: Math.round(width * 0.62),
      titleFontSize: clamp(Math.round(width * 0.085), 84, 112),
      countdownFontSize,
      labelFontSize: clamp(Math.round(width * 0.026), 28, 36),
      captionFontSize: clamp(Math.round(width * 0.037), 38, 48),
      footerTitleSize: clamp(Math.round(width * 0.052), 56, 74),
      bodyTextSize: clamp(Math.round(width * 0.025), 26, 34),
      metaTextSize: clamp(Math.round(width * 0.02), 20, 28),
      badgeSize: clamp(Math.round(width * 0.105), 116, 140),
      badgeTextSize: clamp(Math.round(width * 0.017), 18, 22),
    },
  };
}

function WallpaperImage({
  model,
}: {
  model: ReturnType<typeof createWallpaperViewModel>;
}) {
  const { layout } = model;

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        position: "relative",
        background: "#060606",
        color: "#f5f1e8",
        fontFamily: WALLPAPER_FONT_FAMILY,
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
          top: layout.titleTop,
          bottom: layout.titleBottom,
          left: layout.horizontalPadding,
          maxWidth: layout.titleWidth,
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: layout.titleFontSize,
            lineHeight: 0.95,
            fontWeight: 800,
            color: "#161311",
            textTransform: "uppercase",
            letterSpacing: -4,
          }}
        >
          {model.title}
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          top: layout.countdownTop,
          left: layout.horizontalPadding,
          right: layout.horizontalPadding,
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          gap: 10,
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: layout.labelFontSize,
            letterSpacing: 6,
            color: "#d5c49c",
            fontWeight: 700,
          }}
        >
          {model.primaryLabel}
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
              fontSize: layout.countdownFontSize,
              lineHeight: 0.82,
              fontWeight: 800,
              letterSpacing: -22,
              color: "#ffffff",
            }}
          >
            {model.bigNumber}
          </div>
          <div
            style={{
              display: "flex",
              paddingBottom: Math.round(layout.countdownFontSize * 0.14),
              fontSize: layout.captionFontSize,
              letterSpacing: 8,
              color: "#d5c49c",
              fontWeight: 700,
              textTransform: "uppercase",
            }}
          >
            {model.numberCaption}
          </div>
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          left: layout.horizontalPadding,
          right: layout.horizontalPadding,
          bottom: layout.footerInset,
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
            maxWidth: layout.footerTextWidth,
          }}
        >
          <div
            style={{
              display: "flex",
              fontSize: layout.footerTitleSize,
              lineHeight: 1.02,
              fontWeight: 700,
              textTransform: "uppercase",
              color: "#ffffff",
            }}
          >
            {model.categoryLine}
          </div>
          <div
            style={{
              display: "flex",
              fontSize: layout.bodyTextSize,
              lineHeight: 1.25,
              letterSpacing: 2,
              color: "#cfcfcf",
            }}
          >
            {model.dateLine}
          </div>
          <div
            style={{
              display: "flex",
              fontSize: layout.metaTextSize,
              letterSpacing: 3,
              color: "#a5a5a5",
              textTransform: "uppercase",
            }}
          >
            {model.locationLine} · {model.timeLine}
          </div>
        </div>
        <div
          style={{
            display: "flex",
            width: layout.badgeSize,
            height: layout.badgeSize,
            borderRadius: 9999,
            border: "2px solid rgba(255,255,255,0.16)",
            alignItems: "center",
            justifyContent: "center",
            color: "#d4c198",
            fontSize: layout.badgeTextSize,
            letterSpacing: 4,
            textTransform: "uppercase",
          }}
        >
          Run
        </div>
      </div>
    </div>
  );
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
    const renderSize = getRenderSize(preset, isPreview);
    const responseCacheKey = buildWallpaperCacheKey({
      id,
      presetKey: preset.key,
      requestedDistance,
      width: renderSize.width,
      height: renderSize.height,
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
    const event = await getEventSummaryById(id);
    const dataDuration = performance.now() - dataStartedAt;

    if (!event) {
      return new Response("Event not found", { status: 404 });
    }

    const selectedDistance = pickDistance(event.distance, requestedDistance);
    const wallpaper = createWallpaperViewModel({
      event,
      selectedDistance,
      ...renderSize,
    });

    const renderStartedAt = performance.now();
    const { entry, cacheStatus } = await renderAndCacheWallpaperResponse(
      responseCacheKey,
      async () => {
        const image = new ImageResponse(
          <WallpaperImage model={wallpaper} />,
          renderSize,
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
