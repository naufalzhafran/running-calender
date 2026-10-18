import {
  esc,
  formatDate,
  formatLongDate,
  icon,
  isPastEvent,
  loadPageEvent,
  registerServiceWorker,
  renderError,
} from "./lib.js";
import { reminderCard } from "./reminder.js";

const content = document.getElementById("content");

function infoTile(iconName, label, body) {
  return `
    <div class="info-tile">
      <div class="info-tile__icon">${icon(iconName, "icon-lg")}</div>
      <div><p class="eyebrow">${label}</p>${body}</div>
    </div>`;
}

function dateRange(event) {
  const start = esc(formatLongDate(event.event_date));
  if (!event.end_date) {
    return `<strong>${start}</strong>`;
  }
  const end = esc(formatDate(event.end_date, { day: "numeric", month: "long" }));
  return `<strong>${start}<span class="muted" style="margin:0 0.5rem">-</span>${end}</strong>`;
}

function distanceCard(event, distance) {
  const wallpaperUrl = `/wallpaper/${encodeURIComponent(event.slug)}?${new URLSearchParams({ distance: distance.name })}`;
  const date = formatDate(distance.date, { day: "numeric", month: "short", year: "numeric" });
  return `
    <div class="card distance-card">
      <h3>${esc(distance.name)}</h3>
      <p class="eyebrow">Kategori Race</p>
      <div class="meta-rows">
        <div class="meta-row"><span>${icon("calendar")}Tanggal</span><span>${esc(date)}</span></div>
        <div class="meta-row"><span>${icon("clock")}Start</span><span>${esc(distance.start_time || "-")}</span></div>
        <div class="meta-row"><span>${icon("clock")}COT</span><span>${esc(distance.cot || "-")}</span></div>
      </div>
      <a href="${esc(wallpaperUrl)}" class="btn btn--outline btn--block" aria-label="Countdown dan wallpaper ${esc(distance.name)}">
        ${icon("smartphone")}Countdown &amp; Wallpaper
      </a>
    </div>`;
}

function render(event) {
  const past = isPastEvent(event);
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.location)}`;

  content.innerHTML = `
    <div class="card detail">
      ${past ? '<div class="detail__banner">Event telah selesai</div>' : ""}
      <div class="detail__body">
        ${event.distances.length ? `
          <div class="detail__pills">
            ${event.distances.map((d) => `<span class="pill pill--primary">${esc(d.name)}</span>`).join("")}
          </div>` : ""}
        <h1 class="detail__title">${esc(event.title)}</h1>
        <div class="info-grid">
          ${infoTile("calendar", "Tanggal", dateRange(event))}
          ${infoTile("map-pin", "Lokasi", `
            <strong>${esc(event.location)}</strong><br>
            <a href="${esc(mapsUrl)}" target="_blank" rel="noopener noreferrer" class="link">
              Buka di Google Maps${icon("external-link")}<span class="sr-only">(tab baru)</span>
            </a>`)}
        </div>
        ${!past && event.distances.length ? '<div class="block" id="reminder"></div>' : ""}
        ${event.distances.length ? `
          <div class="block">
            <h2 class="section-title">${icon("ruler")}Kategori</h2>
            <div class="distance-grid">${event.distances.map((d) => distanceCard(event, d)).join("")}</div>
          </div>` : ""}
        ${event.description ? `
          <div class="description">
            <h2>Deskripsi</h2>
            <p>${esc(event.description)}</p>
          </div>` : ""}
      </div>
    </div>`;

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
          <h1>Event tidak ditemukan</h1>
          <p>Event ini mungkin sudah dihapus atau tautannya salah.</p>
          <a href="/" class="btn btn--outline" style="margin-top:1rem">Lihat semua event</a>
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
