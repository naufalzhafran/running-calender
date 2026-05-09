import { formatDateInJakarta } from "@/lib/date";
import { type DistanceDetail, type Event } from "@/types";

function escapeIcsText(value: string) {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

function toIcsDateTime(date: string, time?: string) {
  const normalizedTime = (time || "06:00").replace(":", "").padEnd(6, "0");
  return `${date.replace(/-/g, "")}T${normalizedTime}`;
}

function foldIcsLine(line: string) {
  if (line.length <= 74) {
    return line;
  }

  const chunks = [];
  let remaining = line;

  while (remaining.length > 74) {
    chunks.push(remaining.slice(0, 74));
    remaining = ` ${remaining.slice(74)}`;
  }

  chunks.push(remaining);
  return chunks.join("\r\n");
}

function getDistanceEntries(event: Event, requestedDistance?: string | null) {
  const normalized = requestedDistance?.trim().toLowerCase();

  if (!normalized) {
    return event.distance.length
      ? event.distance
      : [{ name: "Event", date: event.event_date, start_time: "06:00", cot: "" }];
  }

  return event.distance.filter(
    (distance) => distance.name.trim().toLowerCase() === normalized,
  );
}

function buildEventDescription(event: Event, distance: DistanceDetail) {
  const date = formatDateInJakarta(distance.date || event.event_date, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return [
    `${event.title} - ${distance.name}`,
    `Tanggal: ${date}`,
    `Lokasi: ${event.location}`,
    distance.start_time ? `Start: ${distance.start_time}` : "",
    distance.cot ? `COT: ${distance.cot}` : "",
    event.description || "",
  ]
    .filter(Boolean)
    .join("\n");
}

export function buildEventCalendar(event: Event, requestedDistance?: string | null) {
  const distances = getDistanceEntries(event, requestedDistance);
  const now = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Kalender Lari//Event Reminders//ID",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
  ];

  for (const distance of distances) {
    const eventDate = distance.date || event.event_date;
    const startTime = distance.start_time || "06:00";
    const summary = `${event.title} - ${distance.name}`;

    lines.push(
      "BEGIN:VEVENT",
      `UID:${event.id}-${distance.name.replace(/\s+/g, "-").toLowerCase()}@kalender-lari`,
      `DTSTAMP:${now}`,
      `DTSTART;TZID=Asia/Jakarta:${toIcsDateTime(eventDate, startTime)}`,
      `SUMMARY:${escapeIcsText(summary)}`,
      `LOCATION:${escapeIcsText(event.location)}`,
      `DESCRIPTION:${escapeIcsText(buildEventDescription(event, distance))}`,
      "BEGIN:VALARM",
      "TRIGGER:-P7D",
      "ACTION:DISPLAY",
      `DESCRIPTION:${escapeIcsText(`7 hari lagi: ${summary}`)}`,
      "END:VALARM",
      "BEGIN:VALARM",
      "TRIGGER:-P1D",
      "ACTION:DISPLAY",
      `DESCRIPTION:${escapeIcsText(`Besok: ${summary}`)}`,
      "END:VALARM",
      "BEGIN:VALARM",
      "TRIGGER:-PT3H",
      "ACTION:DISPLAY",
      `DESCRIPTION:${escapeIcsText(`Hari ini: ${summary}`)}`,
      "END:VALARM",
      "END:VEVENT",
    );
  }

  lines.push("END:VCALENDAR");
  return `${lines.map(foldIcsLine).join("\r\n")}\r\n`;
}
