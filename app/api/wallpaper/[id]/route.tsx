import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";

import { getEventById } from "@/lib/data";
import { type DistanceDetail } from "@/types";
import { getWallpaperPreset } from "@/lib/wallpaper";

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
  return new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
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

    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            position: "relative",
            flexDirection: "column",
            justifyContent: "space-between",
            background:
              "linear-gradient(180deg, #f4f1ea 0%, #e5dfd0 28%, #111111 28%, #050505 100%)",
            color: "#f6f2e8",
            padding: "96px 84px 110px",
            fontFamily:
              '"Avenir Next", "Helvetica Neue", Helvetica, Arial, sans-serif',
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              background:
                "radial-gradient(circle at top right, rgba(255,255,255,0.16) 0, rgba(255,255,255,0) 36%), radial-gradient(circle at bottom left, rgba(214,168,76,0.12) 0, rgba(214,168,76,0) 28%)",
            }}
          />

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 18,
              position: "relative",
            }}
          >
            <div
              style={{
                display: "flex",
                fontSize: 36,
                letterSpacing: 8,
                color: "#6f8b7f",
                fontWeight: 700,
              }}
            >
              DAILY COUNTDOWN
            </div>
            <div
              style={{
                display: "flex",
                maxWidth: 980,
                fontSize: 112,
                lineHeight: 1,
                fontWeight: 800,
                color: "#0c0c0c",
                textTransform: "uppercase",
                letterSpacing: -4,
              }}
            >
              {event.title}
            </div>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-start",
              gap: 8,
              position: "relative",
            }}
          >
            <div
              style={{
                display: "flex",
                fontSize: 34,
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
                  fontSize: 520,
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
                  paddingBottom: 74,
                  fontSize: 48,
                  letterSpacing: 8,
                  color: "#c7b892",
                  fontWeight: 700,
                }}
              >
                {numberCaption}
              </div>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-end",
              gap: 48,
              position: "relative",
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 18,
                maxWidth: 760,
              }}
            >
              <div
                style={{
                  display: "flex",
                  fontSize: 74,
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
                  fontSize: 34,
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
                  fontSize: 28,
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
                width: 140,
                height: 140,
                borderRadius: 9999,
                border: "2px solid rgba(255,255,255,0.16)",
                alignItems: "center",
                justifyContent: "center",
                color: "#d4c198",
                fontSize: 22,
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
