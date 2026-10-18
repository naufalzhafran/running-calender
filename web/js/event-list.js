// Renders event cards for the home and archive pages.

import { countdownLabel, distanceChip, eventBadges, esc, formatDate, formatTime, icon, isPastEvent } from "./lib.js";

const DISTANCE_LIMIT = 4;
const MAX_STAGGER = 6;

function distanceChips(names) {
  if (names.length === 0) {
    return "";
  }
  const hidden = names.length - DISTANCE_LIMIT;
  return `
    <div class="chip-row">
      ${names.slice(0, DISTANCE_LIMIT).map((name) => distanceChip(name)).join("")}
      ${hidden > 0 ? `<span class="distance-chip distance-chip--more">+${hidden}</span>` : ""}
    </div>`;
}

/** "Minggu, 15 Nov 2026", or "Sabtu, 14 Nov 2026 – 15 Nov" for multi-day events. */
function dateLabel(event) {
  const start = formatDate(event.event_date, { weekday: "long", day: "numeric", month: "short", year: "numeric" });
  if (!event.end_date || event.end_date === event.event_date) {
    return start;
  }
  return `${start} – ${formatDate(event.end_date, { day: "numeric", month: "short" })}`;
}

/** The earliest start time on the first race day, if any distance has one. */
function firstStart(event) {
  const times = event.distances
    .filter((d) => d.date === event.event_date && d.start_time)
    .map((d) => d.start_time)
    .sort();
  return times[0] ?? "";
}

function eventCard(event, index, animate) {
  const past = isPastEvent(event);
  const names = event.distances.map((d) => d.name.trim());
  const start = firstStart(event);
  const countdown = past ? "" : countdownLabel(event.event_date);
  const delay = (Math.min(index, MAX_STAGGER - 1) + 1) * 0.05;
  const classes = `event-card${past ? " event-card--past" : ""}${animate ? " event-card--animate" : ""}`;
  const style = animate ? ` style="animation-delay:${delay}s"` : "";

  return `
    <li>
      <a href="/events/${encodeURIComponent(event.slug)}" class="${classes}"${style}>
        ${eventBadges(event)}
        ${distanceChips(names)}
        <h3 class="event-card__title">${esc(event.title)}</h3>
        <div class="event-card__meta caption tabular">
          <span><time datetime="${esc(event.event_date)}">${esc(dateLabel(event))}</time>${start ? ` · ${esc(formatTime(start))}` : ""}</span>
          <span>${esc(event.location)}</span>
        </div>
        <div class="event-card__foot">
          ${countdown ? `
            <span class="event-card__countdown">
              <span aria-hidden="true">${esc(countdown)}</span>
              <span class="sr-only">${countdown === "Hari H" ? "Hari ini" : `${esc(countdown.slice(2))} hari lagi`}</span>
            </span>` : ""}
          <span class="event-card__cta">${past ? "Lihat arsip" : "Lihat detail"}${icon("arrow-right")}</span>
        </div>
      </a>
    </li>`;
}

function section(title, events, animate, offset = 0) {
  return `
    <section>
      <div class="section-head">
        <h2 class="display-m">${esc(title)}</h2>
        <p class="caption tabular">${events.length} event</p>
      </div>
      <ul class="event-grid">${events.map((event, i) => eventCard(event, offset + i, animate)).join("")}</ul>
    </section>`;
}

/**
 * Returns a titled list section, or "" when there are no events. Pass
 * animate only on first render so filtering does not replay the fade-in.
 */
export function eventListSection(title, events, { animate = true } = {}) {
  return events.length === 0 ? "" : section(title, events, animate);
}

/** One section per calendar month ("November 2026"), in the given order. */
export function eventMonthSections(events, { animate = true } = {}) {
  const months = [];
  for (const event of events) {
    const key = event.event_date.slice(0, 7);
    if (months.at(-1)?.key !== key) {
      months.push({ key, title: formatDate(event.event_date, { month: "long", year: "numeric" }), events: [] });
    }
    months.at(-1).events.push(event);
  }
  let offset = 0;
  return months
    .map((month) => {
      const html = section(month.title, month.events, animate, offset);
      offset += month.events.length;
      return html;
    })
    .join("");
}
