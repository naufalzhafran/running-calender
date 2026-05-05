import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";

import { getEventById } from "@/lib/data";
import { type DistanceDetail } from "@/types";
import { getWallpaperPreset } from "@/lib/wallpaper";
import { formatDateInJakarta } from "@/lib/date";

export const dynamic = "force-dynamic";

function normalizeDistanceName(value: string) {
  return value.trim().toLowerCase();
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
  try {
    const { id } = await ctx.params;
    const event = await getEventById(id);

    if (!event) {
      return new Response("Event not found", { status: 404 });
    }

    const requestedDistance = request.nextUrl.searchParams.get("distance");
    const preset = getWallpaperPreset(
      request.nextUrl.searchParams.get("preset"),
    );
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
    const horizontalPadding = Math.round(preset.width * 0.07);
    const footerInset = Math.round(preset.height * 0.075);
    const titleTop = Math.round(preset.height * 0.16);
    const titleBottom = Math.round(preset.height * 0.625);
    const countdownTop = Math.round(preset.height * 0.445);
    const titleWidth = Math.round(preset.width * 0.74);
    const footerTextWidth = Math.round(preset.width * 0.62);
    const titleFontSize = clamp(Math.round(preset.width * 0.085), 84, 112);
    const countdownFontSize = clamp(
      Math.round(preset.width * 0.34),
      340,
      520,
    );
    const footerTitleSize = clamp(Math.round(preset.width * 0.052), 56, 74);
    const bodyTextSize = clamp(Math.round(preset.width * 0.025), 26, 34);
    const metaTextSize = clamp(Math.round(preset.width * 0.02), 20, 28);
    const badgeSize = clamp(Math.round(preset.width * 0.105), 116, 140);

    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            position: "relative",
            background:
              "linear-gradient(180deg, #f2eee4 0%, #e6dece 41%, #151311 41%, #060606 100%)",
            color: "#f6f2e8",
            fontFamily:
              '"Avenir Next", "Helvetica Neue", Helvetica, Arial, sans-serif',
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              background:
                "radial-gradient(circle at top right, rgba(255,255,255,0.2) 0, rgba(255,255,255,0) 38%), radial-gradient(circle at 18% 22%, rgba(182,161,108,0.14) 0, rgba(182,161,108,0) 24%), radial-gradient(circle at bottom left, rgba(214,168,76,0.08) 0, rgba(214,168,76,0) 28%)",
            }}
          />
          <div
            style={{
              position: "absolute",
              top: Math.round(preset.height * 0.09),
              left: "50%",
              width: Math.round(preset.width * 0.56),
              height: Math.round(preset.height * 0.16),
              transform: "translateX(-50%)",
              borderRadius: 9999,
              background:
                "radial-gradient(circle, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0.08) 36%, rgba(255,255,255,0) 78%)",
              opacity: 0.32,
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
                fontSize: clamp(Math.round(preset.width * 0.026), 28, 36),
                letterSpacing: 6,
                color: "#b9ab86",
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
                  color: "#f4efe4",
                }}
              >
                {bigNumber}
              </div>
              <div
                style={{
                  display: "flex",
                  paddingBottom: Math.round(countdownFontSize * 0.14),
                  fontSize: clamp(Math.round(preset.width * 0.037), 38, 48),
                  letterSpacing: 8,
                  color: "#c7b892",
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
                  color: "#c1c1c1",
                }}
              >
                {formatDate(targetDate)}
              </div>
              <div
                style={{
                  display: "flex",
                  fontSize: metaTextSize,
                  letterSpacing: 3,
                  color: "#9d9d9d",
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
                fontSize: clamp(Math.round(preset.width * 0.017), 18, 22),
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
        width: preset.width,
        height: preset.height,
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      },
    );
  } catch (error) {
    console.error(error);
    return new Response("Failed to generate wallpaper", { status: 500 });
  }
}
