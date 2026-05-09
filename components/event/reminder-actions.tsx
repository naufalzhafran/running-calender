"use client";

import { useMemo, useState } from "react";
import { CalendarPlus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { type DistanceDetail } from "@/types";

type ReminderActionsProps = {
  eventId: string;
  eventTitle: string;
  distances: DistanceDetail[];
};

function getCalendarUrl(eventId: string, distanceName?: string) {
  const searchParams = new URLSearchParams();

  if (distanceName) {
    searchParams.set("distance", distanceName);
  }

  const query = searchParams.toString();
  return `/api/events/${eventId}/calendar${query ? `?${query}` : ""}`;
}

export function ReminderActions({
  eventId,
  eventTitle,
  distances,
}: ReminderActionsProps) {
  const [selectedDistanceName, setSelectedDistanceName] = useState(
    distances[0]?.name ?? "",
  );
  const selectedDistance = useMemo(
    () =>
      distances.find((distance) => distance.name === selectedDistanceName) ??
      distances[0],
    [distances, selectedDistanceName],
  );
  const calendarUrl = getCalendarUrl(eventId, selectedDistance?.name);
  const reminderTarget = selectedDistance?.name
    ? `${eventTitle} - ${selectedDistance.name}`
    : eventTitle;

  return (
    <div className="rounded-3xl border border-border/50 bg-card p-5">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-foreground">
          Reminder Mobile
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Simpan {reminderTarget} ke kalender perangkat untuk mendapatkan reminder.
        </p>
      </div>

      {distances.length > 1 && (
        <label className="mb-4 block">
          <span className="mb-2 block text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Kategori
          </span>
          <select
            value={selectedDistanceName}
            onChange={(event) => setSelectedDistanceName(event.target.value)}
            className="h-11 w-full rounded-2xl border border-input bg-background px-3 text-sm"
          >
            {distances.map((distance) => (
              <option key={`${distance.name}-${distance.date}`} value={distance.name}>
                {distance.name}
              </option>
            ))}
          </select>
        </label>
      )}

      <Button asChild className="h-11 w-full rounded-2xl">
        <a href={calendarUrl}>
          <CalendarPlus className="h-4 w-4" />
          Tambah ke Kalender
        </a>
      </Button>

      <p className="mt-3 text-sm text-muted-foreground">
        File kalender menyertakan reminder 7 hari sebelumnya, 1 hari sebelumnya,
        dan 3 jam sebelum start.
      </p>
    </div>
  );
}
