// "Simpan ke Kalender" card: downloads an .ics with reminders for one distance.

import { calendarUrl, esc, icon } from "./lib.js";

/**
 * Pass primary: false on pages where another action already uses the brand
 * color, so each screen keeps one primary button.
 */
export function reminderCard(container, event, distances, { primary = true } = {}) {
  let selected = distances[0];

  container.innerHTML = `
    <div class="reminder${primary ? "" : " reminder--flat"}">
      <div>
        <h2 class="title">Simpan ke kalender</h2>
        <p class="reminder__intro"></p>
      </div>
      ${distances.length > 1 ? `
        <label>
          <span class="caption label">Jarak</span>
          <select class="field">
            ${distances.map((d, i) => `<option value="${i}">${esc(d.name)}</option>`).join("")}
          </select>
        </label>` : ""}
      <a class="btn ${primary ? "btn--primary" : "btn--secondary"} btn--block">${icon("calendar-plus")}Tambah ke kalender</a>
      <p class="caption">Termasuk pengingat 7 hari, 1 hari, dan 3 jam sebelum start.</p>
    </div>`;

  const intro = container.querySelector(".reminder__intro");
  const link = container.querySelector("a");

  function update() {
    const target = selected ? `${event.title} - ${selected.name}` : event.title;
    intro.textContent = `Tambahkan ${target} ke kalender HP agar dapat pengingat.`;
    link.href = calendarUrl(event.slug, selected?.name);
  }

  container.querySelector("select")?.addEventListener("change", (e) => {
    selected = distances[Number(e.target.value)];
    update();
  });
  update();
}
