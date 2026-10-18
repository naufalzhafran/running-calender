// "Simpan ke Kalender" card: downloads an .ics with reminders for one distance.

import { calendarUrl, esc, icon } from "./lib.js";

export function reminderCard(container, event, distances) {
  let selected = distances[0];

  container.innerHTML = `
    <div class="card card-pad reminder">
      <h2>Simpan ke Kalender</h2>
      <p class="reminder__intro"></p>
      ${distances.length > 1 ? `
        <label>
          <span class="eyebrow">Kategori</span>
          <select class="field">
            ${distances.map((d, i) => `<option value="${i}">${esc(d.name)}</option>`).join("")}
          </select>
        </label>` : ""}
      <a class="btn btn--primary btn--block">${icon("calendar-plus")}Tambah ke Kalender</a>
      <p class="reminder__note">Termasuk pengingat 7 hari, 1 hari, dan 3 jam sebelum start.</p>
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
