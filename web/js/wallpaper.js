import {
  daysUntil,
  esc,
  formatDate,
  icon,
  loadPageEvent,
  normalizeName,
  pickDistance,
  registerServiceWorker,
  renderError,
} from "./lib.js";
import { reminderCard } from "./reminder.js";
import { WALLPAPER_PRESETS, getPreset } from "./wallpaper-presets.js";

const content = document.getElementById("content");

const SHORTCUT_STEPS = [
  ["Get Contents of URL", "Paste URL gambar ke field URL."],
  ["Convert Image", "Convert hasil URL ke PNG."],
  ["Set Wallpaper", "Pakai Converted Image, pilih Lock Screen/Home Screen, lalu matikan Show Preview."],
];

function imagePath(event, distance, preset, preview = false) {
  const params = new URLSearchParams();
  if (distance) params.set("distance", distance.name);
  params.set("preset", preset.key);
  if (preview) params.set("preview", "1");
  return `/api/wallpaper/${encodeURIComponent(event.slug)}?${params}`;
}

function sharePath(event, distance, preset) {
  const params = new URLSearchParams();
  if (distance) params.set("distance", distance.name);
  params.set("preset", preset.key);
  return `/wallpaper/${encodeURIComponent(event.slug)}?${params}`;
}

function shortcutGuide() {
  return `
    <details class="guide">
      <summary>
        <div>
          <strong>Shortcut Instruction</strong>
          <span>Setup manual sekali untuk update wallpaper dari URL.</span>
        </div>
        ${icon("chevron-down")}
      </summary>
      <div class="guide__body">
        <div class="guide__box">
          <p>Sebelum mulai</p>
          <div class="guide__numbered">
            <div><span class="guide__num">1</span><p>Pilih device/resolusi yang sesuai.</p></div>
            <div><span class="guide__num">2</span><p>Tap <b>Copy URL Gambar</b>.</p></div>
          </div>
        </div>
        <div>
          <p class="guide__heading">Buat shortcut</p>
          <div class="guide__steps">
            ${SHORTCUT_STEPS.map(([action, detail], i) => `
              <div class="guide__step">
                <span class="guide__num">${i + 1}</span>
                <div><strong>${action}</strong><p>${detail}</p></div>
              </div>`).join("")}
          </div>
        </div>
        <div class="guide__box">
          <p>Opsional: otomatis harian</p>
          <ol>
            <li>Jalankan shortcut manual sekali sampai wallpaper berhasil berubah.</li>
            <li>Jika muncul izin akses web atau wallpaper, pilih <b>Allow</b>.</li>
            <li>Buka tab <b>Automation</b> di Shortcuts, lalu buat automation waktu harian.</li>
            <li>Tambahkan aksi <b>Run Shortcut</b> dan pilih shortcut wallpaper ini.</li>
            <li>Pilih <b>Run Immediately</b> jika tersedia. Matikan <b>Ask Before Running</b> jika iOS menampilkan opsi itu.</li>
            <li>Setelah jadwal lewat, cek Lock Screen/Home Screen. Jika belum berubah, buka tab Automation dan pastikan automation tidak dalam kondisi disabled dan Show Preview di aksi Set Wallpaper sudah mati.</li>
          </ol>
        </div>
        <p>URL gambar bersifat dinamis. Saat shortcut mengambil URL yang sama, countdown wallpaper akan memakai data terbaru.</p>
      </div>
    </details>`;
}

function render(event) {
  const params = new URLSearchParams(location.search);
  const state = {
    distance: pickDistance(event.distances, params.get("distance")),
    preset: getPreset(params.get("preset")),
  };

  document.getElementById("back-link").href = `/events/${encodeURIComponent(event.slug)}`;

  content.innerHTML = `
    <section class="card wp">
      <div class="wp__header">
        <div>
          <p class="eyebrow">Countdown &amp; Wallpaper</p>
          <h1 data-bind="distance-title"></h1>
          <p class="wp__event">${esc(event.title)}</p>
        </div>
        <div class="countdown">
          <p class="eyebrow">Countdown</p>
          <div class="countdown__row">
            <span class="countdown__value" data-bind="days"></span>
            <span class="countdown__unit" data-bind="days-unit"></span>
          </div>
        </div>
      </div>

      <div class="wp__grid">
        <div class="wp__controls">
          ${event.distances.length ? `
            <div class="card panel panel--muted">
              <p class="eyebrow">Kategori</p>
              <div class="chips">
                ${event.distances.map((d) => `<button type="button" class="chip" data-distance="${esc(d.name)}">${esc(d.name)}</button>`).join("")}
              </div>
            </div>` : ""}

          <div data-bind="reminder"></div>

          <div class="card panel">
            <p class="eyebrow">Wallpaper</p>
            <div class="panel__stack">
              <label>
                <span class="eyebrow" style="display:block;margin-bottom:0.5rem">Device</span>
                <select class="field device-select">
                  ${Object.entries(WALLPAPER_PRESETS).map(([key, p]) =>
                    `<option value="${esc(key)}">${esc(p.label)} (${p.width}×${p.height})</option>`).join("")}
                </select>
              </label>
              <div class="panel__buttons">
                <a class="btn btn--primary btn--block" data-bind="download" download>${icon("download")}Download Wallpaper</a>
                <a class="btn btn--outline btn--block" data-bind="open" target="_blank" rel="noopener noreferrer">${icon("external-link")}Buka Resolusi Penuh</a>
                <button type="button" class="btn btn--outline btn--block" data-bind="copy-image"></button>
              </div>
              ${shortcutGuide()}
            </div>
          </div>

          <div class="card panel">
            <p class="eyebrow">Bagikan</p>
            <div class="share-grid">
              <button type="button" class="btn btn--outline" data-bind="share">${icon("share")}Share</button>
              <button type="button" class="btn btn--outline" data-bind="copy-share"></button>
            </div>
            <p class="sr-only" aria-live="polite" data-bind="copy-status"></p>
          </div>
        </div>

        <div class="wp__preview">
          <div class="phone-stage">
            <div class="phone-stage__inner">
              <div class="phone-badge" data-bind="badge"></div>
              <div class="phone">
                <div class="phone__frame">
                  <div class="phone__notch"></div>
                  <div class="phone__screen" aria-busy="true">
                    <div class="phone__spinner"></div>
                    <img alt="Preview wallpaper ${esc(event.title)}">
                  </div>
                </div>
              </div>
              <div class="preview-info">
                <div><p>Tanggal</p><p data-bind="date"></p></div>
                <div><p>Lokasi</p><p>${esc(event.location)}</p></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>`;

  const $ = (name) => content.querySelector(`[data-bind="${name}"]`);
  const select = content.querySelector(".device-select");
  const screen = content.querySelector(".phone__screen");
  const image = screen.querySelector("img");
  let copied = null;
  let copyTimer;

  image.addEventListener("load", () => screen.setAttribute("aria-busy", "false"));
  image.addEventListener("error", () => screen.setAttribute("aria-busy", "false"));

  function renderCopyButtons() {
    $("copy-image").innerHTML = copied === "image"
      ? `${icon("check")}URL Gambar Tersalin`
      : `${icon("image")}Copy URL Gambar`;
    $("copy-share").innerHTML = copied === "share"
      ? `${icon("check")}Tersalin`
      : `${icon("copy")}Salin Link`;
    $("copy-status").textContent = copied ? "Link disalin ke clipboard" : "";
  }

  function update() {
    const { distance, preset } = state;
    const date = distance?.date ?? event.event_date;
    const days = daysUntil(date);
    const fullImage = imagePath(event, distance, preset);
    const previewImage = imagePath(event, distance, preset, true);

    document.title = `Detail kategori${distance ? ` • ${distance.name}` : ""} • ${event.title}`;
    $("distance-title").textContent = distance?.name ?? "Kategori";
    $("days").textContent = Math.abs(days);
    $("days-unit").textContent = days < 0 ? "hari berlalu" : "hari lagi";
    $("download").href = fullImage;
    $("open").href = fullImage;
    $("badge").textContent = `${distance?.name ?? "-"} • ${preset.width}×${preset.height}`;
    $("date").textContent = formatDate(date, { day: "numeric", month: "long", year: "numeric" });
    select.value = preset.key;

    content.querySelectorAll(".chip").forEach((chip) => {
      chip.setAttribute("aria-pressed", String(normalizeName(chip.dataset.distance) === normalizeName(distance?.name)));
    });

    screen.style.aspectRatio = `${preset.width} / ${preset.height}`;
    if (image.getAttribute("src") !== previewImage) {
      screen.setAttribute("aria-busy", "true");
      image.src = previewImage;
    }

    if (distance) {
      reminderCard($("reminder"), event, [distance]);
    }
    renderCopyButtons();
    history.replaceState(null, "", sharePath(event, distance, preset));
  }

  async function copy(type) {
    const path = type === "share" ? sharePath(event, state.distance, state.preset) : imagePath(event, state.distance, state.preset);
    try {
      await navigator.clipboard.writeText(`${location.origin}${path}`);
      copied = type;
      clearTimeout(copyTimer);
      copyTimer = setTimeout(() => {
        copied = null;
        renderCopyButtons();
      }, 1800);
    } catch {
      copied = null;
    }
    renderCopyButtons();
  }

  async function share() {
    const url = `${location.origin}${sharePath(event, state.distance, state.preset)}`;
    const name = state.distance?.name;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${name ?? "Kategori"} - ${event.title}`,
          text: `${event.title}${name ? ` • ${name}` : ""}`,
          url,
        });
        return;
      } catch (error) {
        if (error.name === "AbortError") return;
      }
    }
    copy("share");
  }

  content.querySelectorAll(".chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      state.distance = pickDistance(event.distances, chip.dataset.distance);
      update();
    });
  });
  select.addEventListener("change", () => {
    state.preset = getPreset(select.value);
    update();
  });
  $("copy-image").addEventListener("click", () => copy("image"));
  $("copy-share").addEventListener("click", () => copy("share"));
  $("share").addEventListener("click", share);

  update();
}

async function load() {
  content.setAttribute("aria-busy", "true");
  try {
    render(await loadPageEvent());
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
    renderError(content, "Gagal memuat wallpaper.", load);
  } finally {
    content.setAttribute("aria-busy", "false");
  }
}

registerServiceWorker();
load();
