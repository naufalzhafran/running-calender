import {
  distanceChip,
  esc,
  eventBadges,
  eventStatus,
  formatDate,
  formatLongDate,
  formatTime,
  icon,
  isPastEvent,
  loadPageEvent,
  registerServiceWorker,
  renderError,
  routeLine,
} from "./lib.js";
import { reminderCard } from "./reminder.js";

const content = document.getElementById("content");

function fact(iconName, label, body) {
  return `
    <div class="fact">
      <div class="fact__icon">${icon(iconName)}</div>
      <div><dt class="caption">${label}</dt><dd>${body}</dd></div>
    </div>`;
}

function dateRange(event) {
  const start = esc(formatLongDate(event.event_date));
  if (!event.end_date || event.end_date === event.event_date) {
    return start;
  }
  return `${start} – ${esc(formatDate(event.end_date, { day: "numeric", month: "long" }))}`;
}

function distanceCard(event, distance) {
  const wallpaperUrl = `/wallpaper/${encodeURIComponent(event.slug)}?${new URLSearchParams({ distance: distance.name })}`;
  const date = formatDate(distance.date, { weekday: "short", day: "numeric", month: "short", year: "numeric" });
  return `
    <div class="distance-card">
      ${distanceChip(distance.name, "lg")}
      <dl class="meta-rows">
        <div class="meta-row"><dt class="caption">${icon("calendar")}Tanggal</dt><dd>${esc(date)}</dd></div>
        <div class="meta-row"><dt class="caption">${icon("clock")}Start</dt><dd>${esc(formatTime(distance.start_time) || "-")}</dd></div>
        <div class="meta-row"><dt class="caption">${icon("clock")}Cut-off (COT)</dt><dd>${esc(formatTime(distance.cot) || "-")}</dd></div>
      </dl>
      <a href="${esc(wallpaperUrl)}" class="btn btn--secondary btn--block" aria-label="Countdown dan wallpaper ${esc(distance.name)}">
        ${icon("smartphone")}Countdown &amp; Wallpaper
      </a>
    </div>`;
}

function render(event) {
  const past = isPastEvent(event);
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.location)}`;
  const status = past ? { label: "Event telah selesai", variant: "plain" } : eventStatus(event);

  content.innerHTML = `
    <article>
      <header class="detail__hero">
        ${eventBadges(event, { status })}
        <h1 class="display-xl">${esc(event.title)}</h1>
        ${event.distances.length ? `
          <div class="chip-row" aria-label="Jarak">
            ${event.distances.map((d) => distanceChip(d.name, "lg")).join("")}
          </div>` : ""}
        ${routeLine()}
        <dl class="facts">
          ${fact("calendar", "Tanggal", dateRange(event))}
          ${fact("map-pin", "Lokasi", `
            ${esc(event.location)}<br>
            <a href="${esc(mapsUrl)}" target="_blank" rel="noopener noreferrer" class="link">
              Buka di Google Maps${icon("external-link")}<span class="sr-only">(tab baru)</span>
            </a>`)}
        </dl>
      </header>

      <div class="detail__grid">
        <div class="detail__main">
          ${event.distances.length ? `
            <section>
              <div class="section-head">
                <h2 class="display-m">Kategori</h2>
                <p class="caption tabular">${event.distances.length} jarak</p>
              </div>
              <div class="distance-grid">${event.distances.map((d) => distanceCard(event, d)).join("")}</div>
            </section>` : ""}
          ${event.description ? `
            <section class="description">
              <h2 class="display-m">Deskripsi</h2>
              <p>${esc(event.description)}</p>
            </section>` : ""}
        </div>
        ${!past && event.distances.length ? '<aside class="detail__aside" id="reminder"></aside>' : ""}
      </div>
    </article>`;

  const reminder = content.querySelector("#reminder");
  if (reminder) {
    reminderCard(reminder, event, event.distances);
  }
}

async function load() {
  content.setAttribute("aria-busy", "true");
  try {
    const event = await loadPageEvent();
    if (!document.getElementById("page-data")) {
      document.title = `${event.title} | Kalender Lari`;
    }
    render(event);
  } catch (error) {
    if (error.status === 404) {
      content.innerHTML = `
        <div class="empty">
          <h1 class="display-m">Event tidak ditemukan</h1>
          <p>Event ini mungkin sudah dihapus atau tautannya salah.</p>
          <a href="/" class="btn btn--secondary">Lihat semua event</a>
        </div>`;
      return;
    }
    renderError(content, "Gagal memuat detail event.", load);
  } finally {
    content.setAttribute("aria-busy", "false");
  }
}

registerServiceWorker();
load();
