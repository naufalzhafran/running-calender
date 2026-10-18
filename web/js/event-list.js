// Renders event cards for the home and archive pages.

import { esc, eventStatus, formatDate, formatLongDate, icon, isPastEvent, todayInJakarta } from "./lib.js";

const DESKTOP_DISTANCE_LIMIT = 3;
const MOBILE_DISTANCE_LIMIT = 4;
const MAX_STAGGER = 6;

function distancePills(names, limit, modifier) {
  if (names.length === 0) {
    return "";
  }
  const hidden = names.length - limit;
  return `
    <div class="event-card__distances event-card__distances--${modifier}">
      ${names.slice(0, limit).map((name) => `<span class="pill">${esc(name)}</span>`).join("")}
      ${hidden > 0 ? `<span class="event-card__more">+${hidden}</span>` : ""}
    </div>`;
}

function eventCard(event, index, animate) {
  const status = eventStatus(event);
  const past = isPastEvent(event);
  const names = event.distances.map((d) => d.name.trim());
  const year = event.event_date.slice(0, 4);
  const showYear = year !== todayInJakarta().slice(0, 4);
  const delay = (Math.min(index, MAX_STAGGER - 1) + 1) * 0.05;
  const classes = `event-card${past ? " event-card--past" : ""}${animate ? " event-card--animate" : ""}`;
  const style = animate ? ` style="animation-delay:${delay}s"` : "";

  return `
    <li>
      <a href="/events/${encodeURIComponent(event.slug)}" class="${classes}"${style}>
        <article>
          <div class="event-card__row">
            <time datetime="${esc(event.event_date)}" class="event-card__date">
              <span class="sr-only">${esc(formatLongDate(event.event_date))}</span>
              <span aria-hidden="true" class="event-card__month">${esc(formatDate(event.event_date, { month: "short" }))}</span>
              <span aria-hidden="true" class="event-card__day">${esc(formatDate(event.event_date, { day: "numeric" }))}</span>
              ${showYear ? `<span aria-hidden="true" class="event-card__year">${esc(year)}</span>` : ""}
            </time>
            <div class="event-card__body">
              ${status.label ? `<span class="status status--${status.variant}">${esc(status.label)}</span>` : ""}
              <h3 class="event-card__title">${esc(event.title)}</h3>
              <div class="event-card__location">${icon("map-pin")}<span>${esc(event.location)}</span></div>
            </div>
            ${distancePills(names, DESKTOP_DISTANCE_LIMIT, "desktop")}
          </div>
          ${distancePills(names, MOBILE_DISTANCE_LIMIT, "mobile")}
        </article>
      </a>
    </li>`;
}

/**
 * Returns a titled list section, or "" when there are no events. Pass
 * animate only on first render so filtering does not replay the fade-in.
 */
export function eventListSection(title, events, { animate = true } = {}) {
  if (events.length === 0) {
    return "";
  }
  return `
    <section>
      <h2 class="section-title"><span aria-hidden="true" class="section-title__bar"></span>${esc(title)}</h2>
      <ul class="event-list">${events.map((event, i) => eventCard(event, i, animate)).join("")}</ul>
    </section>`;
}
