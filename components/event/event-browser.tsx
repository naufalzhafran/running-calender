"use client";

import { useId, useMemo, useState } from "react";
import { Search, X } from "lucide-react";

import { EventList } from "@/components/event/event-list";
import { type EventCardViewModel } from "@/lib/event-list-view";
import { normalizeDistanceName } from "@/lib/event-utils";
import { cn } from "@/lib/utils";

const MAX_DISTANCE_FILTERS = 6;

type EventBrowserProps = {
  upcomingEvents: EventCardViewModel[];
  recentPastEvents: EventCardViewModel[];
  pastTitle: string;
};

function getDistanceFilters(events: EventCardViewModel[]) {
  const counts = new Map<string, { label: string; count: number }>();

  for (const event of events) {
    for (const name of new Set(event.distanceNames.map(normalizeDistanceName))) {
      const label =
        event.distanceNames.find(
          (distanceName) => normalizeDistanceName(distanceName) === name,
        ) ?? name;
      const current = counts.get(name);
      counts.set(name, {
        label: current?.label ?? label,
        count: (current?.count ?? 0) + 1,
      });
    }
  }

  return [...counts.entries()]
    .filter(([name]) => name.length > 0)
    .sort(
      ([leftName, left], [rightName, right]) =>
        right.count - left.count ||
        (Number.parseFloat(rightName) || 0) - (Number.parseFloat(leftName) || 0),
    )
    .slice(0, MAX_DISTANCE_FILTERS)
    .map(([value, { label }]) => ({ value, label }));
}

function matchesFilters(
  event: EventCardViewModel,
  query: string,
  distance: string | null,
) {
  if (
    distance &&
    !event.distanceNames.some(
      (distanceName) => normalizeDistanceName(distanceName) === distance,
    )
  ) {
    return false;
  }

  if (!query) {
    return true;
  }

  const haystack = `${event.title} ${event.location}`.toLowerCase();
  return query
    .split(/\s+/)
    .every((term) => haystack.includes(term));
}

export function EventBrowser({
  upcomingEvents,
  recentPastEvents,
  pastTitle,
}: EventBrowserProps) {
  const searchId = useId();
  const [query, setQuery] = useState("");
  const [distance, setDistance] = useState<string | null>(null);
  const normalizedQuery = query.trim().toLowerCase();
  const isFiltering = normalizedQuery.length > 0 || distance !== null;

  const distanceFilters = useMemo(
    () => getDistanceFilters([...upcomingEvents, ...recentPastEvents]),
    [upcomingEvents, recentPastEvents],
  );
  const filteredUpcoming = upcomingEvents.filter((event) =>
    matchesFilters(event, normalizedQuery, distance),
  );
  const filteredPast = recentPastEvents.filter((event) =>
    matchesFilters(event, normalizedQuery, distance),
  );
  const resultCount = filteredUpcoming.length + filteredPast.length;

  function resetFilters() {
    setQuery("");
    setDistance(null);
  }

  return (
    <div className="space-y-8">
      <div className="space-y-3" role="search">
        <label htmlFor={searchId} className="sr-only">
          Cari event berdasarkan nama atau lokasi
        </label>
        <div className="relative">
          <Search
            aria-hidden
            className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          />
          <input
            id={searchId}
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Cari nama event atau kota"
            autoComplete="off"
            className="h-12 w-full rounded-2xl border border-border bg-card pl-11 pr-11 text-base text-foreground placeholder:text-muted-foreground focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30 sm:text-sm [&::-webkit-search-cancel-button]:hidden"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label="Hapus pencarian"
            >
              <X aria-hidden className="h-4 w-4" />
            </button>
          )}
        </div>

        {distanceFilters.length > 1 && (
          <div
            className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0"
            role="group"
            aria-label="Filter kategori jarak"
          >
            {[{ value: null, label: "Semua" }, ...distanceFilters].map(
              (filter) => {
                const isActive = distance === filter.value;

                return (
                  <button
                    key={filter.value ?? "all"}
                    type="button"
                    aria-pressed={isActive}
                    onClick={() => setDistance(filter.value)}
                    className={cn(
                      "min-h-9 shrink-0 rounded-full border px-4 text-sm font-medium transition-colors",
                      isActive
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground",
                    )}
                  >
                    {filter.label}
                  </button>
                );
              },
            )}
          </div>
        )}

        <p className="sr-only" aria-live="polite">
          {isFiltering ? `${resultCount} event ditemukan` : ""}
        </p>
      </div>

      {isFiltering && resultCount === 0 ? (
        <div className="rounded-2xl border border-dashed border-border px-4 py-10 text-center">
          <p className="font-medium text-foreground">
            Tidak ada event yang cocok
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Coba kata kunci atau kategori jarak lain.
          </p>
          <button
            type="button"
            onClick={resetFilters}
            className="mt-4 inline-flex h-10 items-center rounded-xl border border-border bg-card px-4 text-sm font-medium text-foreground hover:border-primary/40 hover:text-primary"
          >
            Reset filter
          </button>
        </div>
      ) : (
        <>
          <EventList title="Event Mendatang" events={filteredUpcoming} />
          <EventList title={pastTitle} events={filteredPast} />
        </>
      )}
    </div>
  );
}
