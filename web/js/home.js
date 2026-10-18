import { eventListSection, eventMonthSections } from "./event-list.js";
import { apiGet, esc, icon, normalizeName, registerServiceWorker, renderError } from "./lib.js";

const RECENT_PAST_LIMIT = 3;
const MAX_DISTANCE_FILTERS = 6;

const content = document.getElementById("content");
const state = { upcoming: [], recentPast: [], pastTotal: 0, query: "", distance: null };

/** The most common distance categories across the shown events. */
function distanceFilters(events) {
  const counts = new Map();
  for (const event of events) {
    const seen = new Set();
    for (const distance of event.distances) {
      const key = normalizeName(distance.name);
      if (!key || seen.has(key)) continue;
      seen.add(key);
      const current = counts.get(key);
      counts.set(key, { label: current?.label ?? distance.name.trim(), count: (current?.count ?? 0) + 1 });
    }
  }
  return [...counts.entries()]
    .sort(([leftKey, left], [rightKey, right]) =>
      right.count - left.count || (parseFloat(rightKey) || 0) - (parseFloat(leftKey) || 0))
    .slice(0, MAX_DISTANCE_FILTERS)
    .map(([value, { label }]) => ({ value, label }));
}

function matches(event) {
  if (state.distance && !event.distances.some((d) => normalizeName(d.name) === state.distance)) {
    return false;
  }
  const haystack = `${event.title} ${event.location}`.toLowerCase();
  return state.query.split(/\s+/).filter(Boolean).every((term) => haystack.includes(term));
}

function renderShell() {
  const filters = distanceFilters([...state.upcoming, ...state.recentPast]);
  const hiddenPast = state.pastTotal - state.recentPast.length;

  content.innerHTML = `
    <div class="stack">
      <div role="search" class="band filter-bar">
        <label for="search" class="sr-only">Cari event berdasarkan nama atau lokasi</label>
        <div class="search">
          ${icon("search")}
          <input id="search" type="search" placeholder="Cari nama event atau kota" autocomplete="off">
          <button type="button" class="search__clear hidden" aria-label="Hapus pencarian">
            ${icon("x")}
          </button>
        </div>
        ${filters.length > 1 ? `
          <div class="chips" role="group" aria-label="Filter jarak">
            <button type="button" class="chip" data-distance="" aria-pressed="true">Semua</button>
            ${filters.map((f) => `<button type="button" class="chip" data-distance="${esc(f.value)}" aria-pressed="false">${esc(f.label)}</button>`).join("")}
          </div>` : ""}
        <p class="sr-only" aria-live="polite" id="result-status"></p>
      </div>
      <div id="results" class="stack"></div>
      ${hiddenPast > 0 ? `
        <div class="center">
          <a href="/archive" class="btn btn--secondary">Lihat ${hiddenPast} event selesai lainnya</a>
        </div>` : ""}
    </div>`;

  const input = content.querySelector("#search");
  const clear = content.querySelector(".search__clear");
  input.addEventListener("input", () => {
    state.query = input.value.trim().toLowerCase();
    clear.classList.toggle("hidden", input.value === "");
    renderResults();
  });
  clear.addEventListener("click", () => {
    input.value = "";
    state.query = "";
    clear.classList.add("hidden");
    input.focus();
    renderResults();
  });
  content.querySelectorAll(".chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      state.distance = chip.dataset.distance || null;
      renderResults();
    });
  });

  renderResults();
}

function resetFilters() {
  state.query = "";
  state.distance = null;
  const input = content.querySelector("#search");
  input.value = "";
  content.querySelector(".search__clear").classList.add("hidden");
  renderResults();
}

let firstRender = true;

function renderResults() {
  content.querySelectorAll(".chip").forEach((chip) => {
    chip.setAttribute("aria-pressed", String((chip.dataset.distance || null) === state.distance));
  });

  const upcoming = state.upcoming.filter(matches);
  const past = state.recentPast.filter(matches);
  const filtering = state.query !== "" || state.distance !== null;
  const count = upcoming.length + past.length;
  content.querySelector("#result-status").textContent = filtering ? `${count} event ditemukan` : "";

  const results = content.querySelector("#results");
  if (filtering && count === 0) {
    results.innerHTML = `
      <div class="no-results">
        <p>Tidak ada event yang cocok</p>
        <p class="muted">Coba kata kunci atau jarak lain.</p>
        <button type="button" class="btn btn--secondary">Reset filter</button>
      </div>`;
    results.querySelector("button").addEventListener("click", resetFilters);
    return;
  }

  const pastTitle = state.upcoming.length > 0 ? "Baru selesai" : "Event terbaru";
  const options = { animate: firstRender };
  firstRender = false;
  results.innerHTML = eventMonthSections(upcoming, options) + eventListSection(pastTitle, past, options);
}

function renderEmpty() {
  content.innerHTML = `
    <div class="empty">
      <div class="empty__icon">${icon("calendar", "icon-xl")}</div>
      <h2 class="display-m">Belum ada event</h2>
      <p>Saat ini belum ada jadwal lomba lari. Cek lagi nanti untuk event terbaru.</p>
    </div>`;
}

async function load() {
  content.setAttribute("aria-busy", "true");
  try {
    const [upcoming, past] = await Promise.all([
      apiGet("/api/events?when=upcoming"),
      apiGet(`/api/events?when=past&limit=${RECENT_PAST_LIMIT}`),
    ]);
    state.upcoming = upcoming.items;
    state.recentPast = past.items;
    state.pastTotal = past.total;

    document.getElementById("upcoming-count").textContent = upcoming.total;

    if (upcoming.total + past.total === 0) {
      renderEmpty();
    } else {
      renderShell();
    }
  } catch {
    renderError(content, "Gagal memuat daftar event.", load);
  } finally {
    content.setAttribute("aria-busy", "false");
  }
}

registerServiceWorker();
load();
