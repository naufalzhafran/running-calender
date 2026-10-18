import { eventListSection } from "./event-list.js";
import { apiGet, icon, registerServiceWorker, renderError } from "./lib.js";

const content = document.getElementById("content");

async function load() {
  content.setAttribute("aria-busy", "true");
  try {
    const { items } = await apiGet("/api/events?when=past");
    if (items.length === 0) {
      content.innerHTML = `
        <div class="empty">
          <div class="empty__icon">${icon("archive", "icon-xl")}</div>
          <h1>Belum Ada Arsip</h1>
          <p>Event yang sudah selesai akan tampil di halaman ini.</p>
        </div>`;
      return;
    }
    content.innerHTML = `
      <div class="stack">
        <div>
          <h1 style="font-size:1.5rem;font-weight:700;letter-spacing:-0.025em">Arsip Event</h1>
          <p class="muted" style="margin-top:0.5rem;font-size:0.875rem">${items.length} event selesai, diurutkan dari yang terbaru.</p>
        </div>
        ${eventListSection("Event Selesai", items)}
      </div>`;
  } catch {
    renderError(content, "Gagal memuat arsip event.", load);
  } finally {
    content.setAttribute("aria-busy", "false");
  }
}

registerServiceWorker();
load();
