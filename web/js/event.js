import {
  distanceChip,
  esc,
  eventBadges,
  eventStatus,
  formatDate,
  formatKm,
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
import { routeMap } from "./route-map.js";

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

function courseStop(variant, label, km, time) {
  return `
    <li class="course__stop course__stop--${variant}">
      <span class="course__marker" aria-hidden="true">${variant === "finish" ? icon("flag") : ""}</span>
      <span class="course__label">${label}${km ? `<span class="caption tabular">${km}</span>` : ""}</span>
      <span class="course__time">${time}</span>
    </li>`;
}

/** One card per category: race date, then start → COPs → finish (COT). */
function distanceCard(distance) {
  const date = formatDate(distance.date, { weekday: "short", day: "numeric", month: "short", year: "numeric" });
  const points = distance.cut_off_points ?? [];
  return `
    <div class="distance-card">
      <div class="distance-card__head">
        ${distanceChip(distance.name, "lg")}
        <p class="distance-card__date caption">${icon("calendar")}${esc(date)}</p>
      </div>
      <ol class="course" aria-label="Jadwal ${esc(distance.name)}">
        ${courseStop("start", "Start", points.length ? "KM 0" : "", esc(formatTime(distance.start_time) || "-"))}
        ${points.map((p) => courseStop("cop", esc(p.name), `KM ${esc(formatKm(p.km))}`, esc(formatTime(p.cot)))).join("")}
        ${courseStop("finish", "Finish (COT)", "", esc(formatTime(distance.cot) || "-"))}
      </ol>
    </div>`;
}

function render(event) {
  const past = isPastEvent(event);
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.location)}`;
  const status = past ? { label: "Event telah selesai", variant: "plain" } : eventStatus(event);
  const hasCops = event.distances.some((d) => d.cut_off_points?.length);

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
        ${event.distances.length ? `
          <div class="detail__actions">
            <a href="/wallpaper/${encodeURIComponent(event.slug)}" class="btn btn--secondary">
              ${icon("smartphone")}Countdown &amp; Wallpaper
            </a>
          </div>` : ""}
      </header>

      <div class="detail__grid">
        <div class="detail__main">
          ${event.distances.length ? `
            <section>
              <div class="section-head">
                <h2 class="display-m">Kategori</h2>
                <p class="caption tabular">${event.distances.length} jarak${hasCops ? " · waktu COP = jam tutup" : ""}</p>
              </div>
              <div class="distance-grid">${event.distances.map(distanceCard).join("")}</div>
            </section>` : ""}
          ${event.distances.some((d) => d.route_polyline) ? `
            <section>
              <div class="section-head">
                <h2 class="display-m">Peta rute</h2>
              </div>
              <div id="route-map"></div>
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

  const map = content.querySelector("#route-map");
  if (map) {
    routeMap(map, event.distances);
  }

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
