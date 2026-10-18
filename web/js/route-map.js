// Course map: OpenStreetMap tiles drawn with Leaflet (vendored, loaded on
// demand). Every color comes from CSS classes so the map follows the design
// tokens, including dark mode.

import { esc, formatKm, formatTime, icon } from "./lib.js";

const TILE_URL = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
const ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a>';
// A start and finish closer than this are drawn as one marker.
const SAME_SPOT_METERS = 60;
const ARROW_COUNT = 8;
const ARROW_CLEARANCE_METERS = 600;

let leafletPromise;

function loadLeaflet() {
  leafletPromise ??= new Promise((resolve, reject) => {
    const css = document.createElement("link");
    css.rel = "stylesheet";
    css.href = "/vendor/leaflet/leaflet.css";
    document.head.append(css);
    const script = document.createElement("script");
    script.src = "/vendor/leaflet/leaflet.js";
    script.onload = () => resolve(window.L);
    script.onerror = () => {
      leafletPromise = undefined;
      reject(new Error("Leaflet failed to load"));
    };
    document.head.append(script);
  });
  return leafletPromise;
}

/** Decodes a Google encoded polyline (precision 5) into [lat, lng] pairs. */
export function decodePolyline(value) {
  const points = [];
  let index = 0;
  let lat = 0;
  let lng = 0;
  while (index < value.length) {
    const delta = [0, 0];
    for (let k = 0; k < 2; k += 1) {
      let shift = 0;
      let result = 0;
      let byte;
      do {
        byte = value.charCodeAt(index++) - 63;
        result |= (byte & 0x1f) << shift;
        shift += 5;
      } while (byte >= 0x20);
      delta[k] = result & 1 ? ~(result >> 1) : result >> 1;
    }
    lat += delta[0];
    lng += delta[1];
    points.push([lat / 1e5, lng / 1e5]);
  }
  return points;
}

function meters([lat1, lng1], [lat2, lng2]) {
  const rad = Math.PI / 180;
  const dLat = (lat2 - lat1) * rad;
  const dLng = (lng2 - lng1) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371008.8 * Math.asin(Math.sqrt(h));
}

/** Course with cumulative distance (m) at each point, for placing markers by km. */
function measure(points) {
  const along = [0];
  for (let i = 1; i < points.length; i += 1) {
    along.push(along[i - 1] + meters(points[i - 1], points[i]));
  }
  return { points, along, total: along[along.length - 1] };
}

/** The point at a distance along the course, and the heading there in degrees. */
function pointAt(course, distance) {
  const { points, along } = course;
  let i = along.findIndex((d) => d >= distance);
  if (i <= 0) i = i === 0 ? 1 : points.length - 1;
  const [a, b] = [points[i - 1], points[i]];
  const span = along[i] - along[i - 1];
  const t = span ? Math.min(Math.max((distance - along[i - 1]) / span, 0), 1) : 0;
  const point = [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
  const rad = Math.PI / 180;
  const y = Math.sin((b[1] - a[1]) * rad) * Math.cos(b[0] * rad);
  const x = Math.cos(a[0] * rad) * Math.sin(b[0] * rad) - Math.sin(a[0] * rad) * Math.cos(b[0] * rad) * Math.cos((b[1] - a[1]) * rad);
  return { point, heading: (Math.atan2(y, x) / rad + 360) % 360 };
}

function markerIcon(L, variant, html = "") {
  return L.divIcon({
    className: `map-marker map-marker--${variant}`,
    html,
    iconSize: variant === "arrow" ? [14, 14] : [24, 24],
  });
}

// Stacking order where markers overlap: numbered COPs stay readable on top.
const MARKER_Z = { arrow: 0, start: 500, finish: 500, cop: 1000 };

function addMarker(L, layer, latLng, variant, label, html) {
  const marker = L.marker(latLng, { icon: markerIcon(L, variant, html), keyboard: false, zIndexOffset: MARKER_Z[variant] });
  if (label) {
    marker.bindTooltip(label, { direction: "top", offset: [0, -14], className: "map-tooltip" });
  }
  return marker.addTo(layer);
}

function drawCourse(L, map, layer, distance) {
  layer.clearLayers();
  const course = measure(decodePolyline(distance.route_polyline));
  const { points } = course;

  L.polyline(points, { className: "map-route__casing", weight: 9, interactive: false }).addTo(layer);
  L.polyline(points, { className: "map-route__line", weight: 4, interactive: false }).addTo(layer);

  // Direction arrows, skipped where they would sit on a COP marker.
  const copMeters = (distance.cut_off_points ?? []).map((cop) => cop.km * 1000);
  for (let n = 1; n < ARROW_COUNT; n += 1) {
    const at = (course.total * n) / ARROW_COUNT;
    if (copMeters.some((m) => Math.abs(m - at) < ARROW_CLEARANCE_METERS)) continue;
    const { point, heading } = pointAt(course, at);
    addMarker(L, layer, point, "arrow", "", `<span style="transform: rotate(${heading.toFixed(0)}deg)">${icon("chevron-up")}</span>`);
  }

  const start = points[0];
  const finish = points[points.length - 1];
  const startTime = formatTime(distance.start_time);
  const finishTime = formatTime(distance.cot);
  if (meters(start, finish) < SAME_SPOT_METERS) {
    const times = [startTime && `start ${startTime}`, finishTime && `COT ${finishTime}`].filter(Boolean).join(" · ");
    addMarker(L, layer, finish, "finish", esc(`Start & Finish${times ? ` · ${times}` : ""}`), icon("flag"));
  } else {
    addMarker(L, layer, start, "start", esc(`Start${startTime ? ` · ${startTime}` : ""}`));
    addMarker(L, layer, finish, "finish", esc(`Finish${finishTime ? ` · COT ${finishTime}` : ""}`), icon("flag"));
  }

  (distance.cut_off_points ?? []).forEach((cop, i) => {
    const { point } = pointAt(course, cop.km * 1000);
    const label = `${cop.name} · KM ${formatKm(cop.km)} · ${formatTime(cop.cot)}`;
    addMarker(L, layer, point, "cop", esc(label), `<span>${i + 1}</span>`);
  });

  map.fitBounds(L.latLngBounds(points), { padding: [24, 24] });
  return course;
}

/**
 * Renders the course map for distances that have a route_polyline into
 * container. Leaflet is fetched only once the map is about to scroll into view.
 */
export function routeMap(container, distances) {
  const routes = distances.filter((d) => d.route_polyline);
  if (!routes.length) return;
  let selected = routes[0];

  container.innerHTML = `
    ${routes.length > 1 ? `
      <div class="chips route-map__chips" role="group" aria-label="Pilih rute">
        ${routes.map((d, i) => `<button type="button" class="chip" data-index="${i}" aria-pressed="${i === 0}">${esc(d.name)}</button>`).join("")}
      </div>` : ""}
    <div class="route-map">
      <div class="route-map__canvas" role="img" aria-label="Peta rute ${esc(selected.name)}"></div>
      <p class="route-map__stat caption tabular" aria-live="polite"></p>
    </div>`;

  const canvas = container.querySelector(".route-map__canvas");
  const stat = container.querySelector(".route-map__stat");
  // Set once the map exists; until then a chip only changes the selection.
  let show = null;

  const chips = container.querySelectorAll(".route-map__chips .chip");
  chips.forEach((chip) => {
    chip.addEventListener("click", () => {
      chips.forEach((c) => c.setAttribute("aria-pressed", String(c === chip)));
      selected = routes[Number(chip.dataset.index)];
      canvas.setAttribute("aria-label", `Peta rute ${selected.name}`);
      show?.(selected);
    });
  });

  const start = async () => {
    let L;
    try {
      L = await loadLeaflet();
    } catch {
      canvas.innerHTML = '<p class="route-map__error caption">Peta gagal dimuat. Periksa koneksi lalu muat ulang halaman.</p>';
      return;
    }
    const map = L.map(canvas, {
      scrollWheelZoom: false,
      dragging: !L.Browser.mobile,
      zoomSnap: 0.25,
      attributionControl: false,
    });
    L.control.attribution({ prefix: false }).addAttribution(ATTRIBUTION).addTo(map);
    L.tileLayer(TILE_URL, { maxZoom: 19, className: "route-map__tiles" }).addTo(map);
    const layer = L.layerGroup().addTo(map);

    show = (distance) => {
      const course = drawCourse(L, map, layer, distance);
      stat.textContent = `${distance.name} · ${formatKm(Math.round(course.total / 100) / 10)} km menurut peta`;
    };
    show(selected);
  };

  if (!("IntersectionObserver" in window)) {
    start();
    return;
  }
  const observer = new IntersectionObserver((entries) => {
    if (entries.some((e) => e.isIntersecting)) {
      observer.disconnect();
      start();
    }
  }, { rootMargin: "300px" });
  observer.observe(canvas);
}
