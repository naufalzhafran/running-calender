// Shared helpers: escaping, API access, Jakarta dates, icons, service worker.

export const TIME_ZONE = "Asia/Jakarta";

const ESCAPES = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };

/** Escapes a value for safe use in HTML text and attributes. */
export function esc(value) {
  return String(value ?? "").replace(/[&<>"']/g, (ch) => ESCAPES[ch]);
}

export async function apiGet(path) {
  const response = await fetch(path, { headers: { Accept: "application/json" } });
  if (!response.ok) {
    const error = new Error(`Request failed: ${response.status}`);
    error.status = response.status;
    throw error;
  }
  return response.json();
}

/**
 * Returns the event embedded by the Go server in #page-data, or fetches it
 * from the API using the slug in the URL path.
 */
export async function loadPageEvent() {
  const embedded = document.getElementById("page-data");
  if (embedded) {
    return JSON.parse(embedded.textContent);
  }
  const slug = decodeURIComponent(location.pathname.split("/").filter(Boolean)[1] ?? "");
  return apiGet(`/api/events/${encodeURIComponent(slug)}`);
}

// Dates are YYYY-MM-DD strings in Jakarta time.

function jakartaDate(value) {
  return new Date(`${value}T00:00:00+07:00`);
}

const formatters = new Map();

export function formatDate(value, options) {
  const key = JSON.stringify(options);
  if (!formatters.has(key)) {
    formatters.set(key, new Intl.DateTimeFormat("id-ID", { ...options, timeZone: TIME_ZONE }));
  }
  return formatters.get(key).format(jakartaDate(value));
}

export const formatLongDate = (value) =>
  formatDate(value, { weekday: "long", day: "numeric", month: "long", year: "numeric" });

export function todayInJakarta() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export function daysUntil(value) {
  const diff = jakartaDate(value) - jakartaDate(todayInJakarta());
  return Math.round(diff / 86_400_000);
}

export const lastDate = (event) => event.end_date || event.event_date;
export const isPastEvent = (event) => lastDate(event) < todayInJakarta();

/**
 * The badge shown on a card: sun for this week, trail for an ongoing event,
 * plain for finished ones. Upcoming events further out get no badge.
 */
export function eventStatus(event) {
  const days = daysUntil(event.event_date);
  if (days < 0) {
    return isPastEvent(event)
      ? { label: "Selesai", variant: "plain" }
      : { label: "Sedang berlangsung", variant: "trail" };
  }
  if (days === 0) return { label: "Hari ini", variant: "sun" };
  if (days === 1) return { label: "Besok", variant: "sun" };
  if (days <= 7) return { label: "Minggu ini", variant: "sun" };
  return { label: "", variant: "" };
}

/** Runner shorthand for the days left: H-12, H-1, Hari H. */
export function countdownLabel(value) {
  const days = daysUntil(value);
  if (days < 0) return "";
  return days === 0 ? "Hari H" : `H-${days}`;
}

/** "05:30" → "05.30 WIB", the Indonesian way of writing a clock time. */
export const formatTime = (value) => (value ? `${value.replace(":", ".")} WIB` : "");

/** 31.8 → "31,8", kilometres written the Indonesian way. */
export const formatKm = (value) =>
  new Intl.NumberFormat("id-ID", { maximumFractionDigits: 3 }).format(value);

export const isTrail = (name) => /trail/i.test(name);

export function distanceChip(name, size = "") {
  const classes = ["distance-chip"];
  if (size) classes.push(`distance-chip--${size}`);
  if (isTrail(name)) classes.push("distance-chip--trail");
  return `<span class="${classes.join(" ")}">${esc(name.trim())}</span>`;
}

export function badge(label, variant) {
  return `<span class="badge${variant && variant !== "plain" ? ` badge--${variant}` : ""}">${esc(label)}</span>`;
}

/** Status badge plus a Trail badge when any distance is a trail race. */
export function eventBadges(event, { status = eventStatus(event) } = {}) {
  const badges = [];
  if (status.label) badges.push(badge(status.label, status.variant));
  if (event.distances.some((d) => isTrail(d.name))) badges.push(badge("Trail", "trail"));
  return badges.length ? `<div class="badge-row">${badges.join("")}</div>` : "";
}

/** The route line motif: a dashed trail with a start dot and a finish flag. */
export function routeLine(className = "") {
  return `
    <svg class="route ${className}" viewBox="0 0 640 110" aria-hidden="true" focusable="false">
      <path d="M24 78 C 120 20, 200 100, 300 56 S 480 14, 608 40" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-dasharray="2 12"/>
      <circle cx="24" cy="78" r="8" fill="currentColor"/>
      <line class="route__pole" x1="612" y1="44" x2="612" y2="8" stroke-width="3" stroke-linecap="round"/>
      <path class="route__flag" d="M612 8 L636 15 L612 22 Z"/>
    </svg>`;
}

export const normalizeName = (value) => String(value ?? "").trim().toLowerCase();

/** Matches the server: the named distance, else the earliest-dated one. */
export function pickDistance(distances, name) {
  const wanted = normalizeName(name);
  if (wanted) {
    const match = distances.find((d) => normalizeName(d.name) === wanted);
    if (match) return match;
  }
  return [...distances].sort((a, b) => a.date.localeCompare(b.date))[0] ?? null;
}

export function calendarUrl(slug, distanceName) {
  const query = distanceName ? `?${new URLSearchParams({ distance: distanceName })}` : "";
  return `/api/events/${encodeURIComponent(slug)}/calendar.ics${query}`;
}

// Icon paths from Lucide (ISC license), 24×24 stroke icons.
const ICONS = {
  "arrow-right": '<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>',
  archive: '<rect width="20" height="5" x="2" y="3" rx="1"/><path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8"/><path d="M10 12h4"/>',
  calendar: '<path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/>',
  "calendar-plus": '<path d="M8 2v4"/><path d="M16 2v4"/><path d="M21 13V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h8"/><path d="M3 10h18"/><path d="M16 19h6"/><path d="M19 16v6"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  "chevron-down": '<path d="m6 9 6 6 6-6"/>',
  clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
  copy: '<rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>',
  download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5"/><path d="M12 15V3"/>',
  flag: '<path d="M4 22V4a1 1 0 0 1 .4-.8A6 6 0 0 1 8 2c3 0 5 2 7.333 2q2 0 3.067-.8A1 1 0 0 1 20 4v10a1 1 0 0 1-.4.8A6 6 0 0 1 16 16c-3 0-5-2-8-2a6 6 0 0 0-4 1.528"/>',
  "external-link": '<path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>',
  image: '<rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>',
  "map-pin": '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>',
  route: '<circle cx="6" cy="19" r="3"/><path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15"/><circle cx="18" cy="5" r="3"/>',
  ruler: '<path d="M21.3 15.3a2.4 2.4 0 0 1 0 3.4l-2.6 2.6a2.4 2.4 0 0 1-3.4 0L2.7 8.7a2.41 2.41 0 0 1 0-3.4l2.6-2.6a2.41 2.41 0 0 1 3.4 0Z"/><path d="m14.5 12.5 2-2"/><path d="m11.5 9.5 2-2"/><path d="m8.5 6.5 2-2"/><path d="m17.5 15.5 2-2"/>',
  search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
  share: '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.59 13.51 6.83 3.98"/><path d="m15.41 6.51-6.82 3.98"/>',
  smartphone: '<rect width="14" height="20" x="5" y="2" rx="2" ry="2"/><path d="M12 18h.01"/>',
  x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
};

export function icon(name, className = "") {
  return `<svg class="icon ${className}" viewBox="0 0 24 24" aria-hidden="true">${ICONS[name] ?? ""}</svg>`;
}

export function renderError(container, message, retry) {
  container.innerHTML = `
    <div class="no-results error-box" role="alert">
      <p>${esc(message)}</p>
      <p class="muted">Periksa koneksi lalu coba lagi.</p>
      <button type="button" class="btn btn--secondary">Coba lagi</button>
    </div>`;
  container.querySelector("button").addEventListener("click", retry);
}

export function registerServiceWorker() {
  const isLocal = ["localhost", "127.0.0.1", "[::1]"].includes(location.hostname);
  if (!("serviceWorker" in navigator) || isLocal) {
    return;
  }
  window.addEventListener(
    "load",
    () => navigator.serviceWorker.register("/sw.js").catch(() => {}),
    { once: true },
  );
}
