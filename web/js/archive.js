import { eventMonthSections } from "./event-list.js";
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
          <h1 class="display-m">Belum ada arsip</h1>
          <p>Event yang sudah selesai akan tampil di halaman ini.</p>
        </div>`;
      return;
    }
    content.innerHTML = `
      <div class="stack">
        <header class="page-head">
          <p class="caption">Arsip</p>
          <h1 class="display-xl">Event selesai</h1>
          <p class="muted tabular">${items.length} event, dari yang terbaru.</p>
        </header>
        ${eventMonthSections(items)}
      </div>`;
  } catch {
    renderError(content, "Gagal memuat arsip event.", load);
  } finally {
    content.setAttribute("aria-busy", "false");
  }
}

registerServiceWorker();
load();
