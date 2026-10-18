# Kalender Lari

A running event calendar for Indonesia (Indonesian UI). It has two parts:

- **`web/`**: a static site in plain HTML, CSS and JavaScript (ES modules, no framework, no build step), served by nginx on the VPS.
- **`server/`**: a Go REST API backed by SQLite, run in Docker. It serves event data, `.ics` calendar files and the countdown wallpaper PNGs. It also fills in per-event `<title>` and Open Graph tags on event and wallpaper pages so link previews work.

```
Browser ──► nginx (VPS)
             ├── /                  → web/ static files
             ├── /api/*             → Go API (Docker, 127.0.0.1:8080) ──► SQLite
             └── /events/*, /wallpaper/* → Go (static HTML + per-event meta tags)
```

There is no admin dashboard. Data is written through the admin API using a super-admin bearer token (see [Managing events](#managing-events)).

## Repository layout

```
server/                     Go module
  cmd/api/                  `api serve` and `api token …` commands
  internal/db/              SQLite connection + embedded migrations
  internal/events/          model, validation, storage
  internal/tokens/          admin API tokens (stored as SHA-256 hashes)
  internal/httpapi/         HTTP handlers, OG tag injection
  internal/calendar/        .ics builder
  internal/wallpaper/       PNG wallpaper renderer
  Dockerfile
web/                        static site (deployed to /var/www/running-calendar)
deploy/nginx/               nginx site config for the VPS
deploy/deploy-web.sh        uploads web/ as a new release
examples/                   sample JSON payloads for the admin API
docker-compose.yml          runs the Go API only
```

## Data model

The SQLite schema lives in [`server/internal/db/migrations/`](server/internal/db/migrations/). Migrations run automatically when the server starts, tracked with `PRAGMA user_version`.

| Table | Purpose |
|---|---|
| `events` | `slug` (unique, used in URLs), `title`, `event_date`, `end_date`, `location`, `description`, generated `last_date`, timestamps |
| `event_distances` | One row per race category: `name`, `race_date`, `start_time`, `cot`, `position` (display order) |
| `api_tokens` | Admin tokens: `name`, `token_hash` (SHA-256), `token_prefix`, `last_used_at`, `revoked_at` |

- Dates are `YYYY-MM-DD` and times are `HH:MM`, both in Asia/Jakarta time.
- An event is **upcoming** until its last day has passed (`last_date >= today`). After that it's **past**.

## Local development

You need Go 1.27+. The Go server can also serve `web/` itself, so you don't need nginx locally.

```bash
cd server
SERVE_STATIC=1 WEB_ROOT=../web DB_PATH=./data/app.db go run ./cmd/api serve
```

Open <http://localhost:8080>. The service worker is not registered on localhost.

Create a token and load the sample data:

```bash
cd server
DB_PATH=./data/app.db go run ./cmd/api token create --name local
```

```bash
curl -X POST "http://localhost:8080/api/admin/events/import" \
  -H "Authorization: Bearer $RC_TOKEN" -H "Content-Type: application/json" \
  --data @../examples/events.import.json
```

Run the checks:

```bash
cd server && go vet ./... && go build ./...
```

### Environment variables (Go server)

| Variable | Default | Purpose |
|---|---|---|
| `ADDR` | `:8080` | Listen address |
| `DB_PATH` | `./data/app.db` | SQLite file (created if missing) |
| `WEB_ROOT` | `../web` | Static site dir, used to read `event.html` / `wallpaper.html` |
| `SITE_URL` | from request | Public origin for absolute URLs in meta tags |
| `SERVE_STATIC` | off | `1` serves `WEB_ROOT` too (local dev only) |

## API

### Public (read-only)

| Route | Description |
|---|---|
| `GET /api/events?when=upcoming\|past\|all&q=&limit=&offset=` | Event list, without `description`. Defaults to `when=upcoming`. Response: `{items, total, today}` |
| `GET /api/events/{slug}` | One event including `description` |
| `GET /api/events/{slug}/calendar.ics?distance=10K` | Calendar file with reminders 7 days, 1 day and 3 hours before start |
| `GET /api/wallpaper/{slug}?distance=&preset=&preview=1` | Countdown wallpaper PNG |
| `GET /api/health` | `{"ok":true}` |

### Admin (token required)

Every admin request needs `Authorization: Bearer rc_…` and, for bodies, `Content-Type: application/json`.

| Route | Description |
|---|---|
| `GET /api/admin/events?when=all` | Uncached list including `description` |
| `GET /api/admin/events/{slug}` | One event |
| `POST /api/admin/events` | Create one event. Returns `201` |
| `PATCH /api/admin/events/{slug}` | Partial update (only fields you send change) |
| `DELETE /api/admin/events/{slug}` | Delete. Returns `204` |
| `POST /api/admin/events/import?dry_run=1&create_only=1` | Upsert many events by slug in one transaction |

Event JSON fields:

```json
{
  "title": "Contoh Jakarta Run 2027",
  "slug": "contoh-jakarta-run-2027",
  "event_date": "2027-05-16",
  "end_date": null,
  "location": "Jakarta",
  "description": "Optional text",
  "distances": [
    { "name": "10K", "date": "2027-05-16", "start_time": "05:30", "cot": "07:30" }
  ]
}
```

- **Optional fields:** `slug` is generated from the title if missing. Each distance `date` defaults to `event_date`. `end_date`, `description`, `start_time` and `cot` can be omitted, `null` or `""`.
- **Old files:** `distance` is accepted as an alias for `distances`, so JSON files from the previous PocketBase CLI still work.
- **PATCH:** sending `distances` replaces the whole list. Sending `"end_date": null` clears it.
- **Unknown fields are rejected**, so a typo like `evnt_date` returns an error instead of being silently ignored.
- **Import:** the body is a JSON array (or `{"events": [...]}`). If any entry is invalid, nothing is written: the response is `400` with `"applied": false` and an `errors` list. `dry_run=1` previews without writing. `create_only=1` skips slugs that already exist.

Errors look like this:

```json
{ "error": "validation_failed", "fields": { "distances[1].start_time": "must be HH:MM" } }
```

| Status | `error` | Meaning |
|---|---|---|
| 400 | `validation_failed` | A field failed validation (see `fields`) |
| 400 | `invalid_json` | Malformed JSON or an unknown field |
| 401 | `unauthorized` | Token missing, wrong or revoked |
| 404 | `not_found` | No event with that slug |
| 409 | `slug_taken` | Another event already uses the slug |
| 413 | `payload_too_large` | Body over 1 MB |
| 429 | `too_many_requests` | Over 10 failed auth attempts per minute from one IP |

## Managing events

### 1. Create a super-admin token

Tokens are created only from the command line on the server, never over HTTP. The database stores just a SHA-256 hash, so the token is shown **once**. Save it in your password manager.

```bash
docker compose exec api /app/api token create --name laptop
```

Other token commands:

```bash
docker compose exec api /app/api token list
```

```bash
docker compose exec api /app/api token revoke laptop
```

### 2. Call the API

Set the variables once per shell session:

```bash
export RC_API=https://running.madebynz.xyz RC_TOKEN=rc_xxx
```

Create an event:

```bash
curl -X POST "$RC_API/api/admin/events" \
  -H "Authorization: Bearer $RC_TOKEN" -H "Content-Type: application/json" \
  --data @examples/event.json
```

Preview a bulk import, then run it for real by dropping `dry_run=1`:

```bash
curl -X POST "$RC_API/api/admin/events/import?dry_run=1" \
  -H "Authorization: Bearer $RC_TOKEN" -H "Content-Type: application/json" \
  --data @examples/events.import.json
```

Update part of an event:

```bash
curl -X PATCH "$RC_API/api/admin/events/contoh-jakarta-run-2027" \
  -H "Authorization: Bearer $RC_TOKEN" -H "Content-Type: application/json" \
  --data @examples/event-patch.json
```

Delete an event:

```bash
curl -X DELETE "$RC_API/api/admin/events/contoh-jakarta-run-2027" \
  -H "Authorization: Bearer $RC_TOKEN"
```

List everything, including descriptions:

```bash
curl "$RC_API/api/admin/events?when=all" -H "Authorization: Bearer $RC_TOKEN"
```

## Deployment (VPS)

### One-time setup

1. Create the data and web directories. The API container runs as the distroless `nonroot` user (uid 65532), so it must own the data directory.

   ```bash
   sudo mkdir -p /var/lib/running-calendar /var/www/running-calendar/releases
   ```

   ```bash
   sudo chown 65532:65532 /var/lib/running-calendar
   ```

   ```bash
   sudo chown -R "$USER" /var/www/running-calendar
   ```

2. Install the nginx site. If you use another domain or port, edit `server_name`, the certificate and the upstream port first.

   ```bash
   sudo cp deploy/nginx/running-calendar.conf /etc/nginx/sites-available/running-calendar.conf
   ```

   ```bash
   sudo ln -s /etc/nginx/sites-available/running-calendar.conf /etc/nginx/sites-enabled/
   ```

   ```bash
   sudo certbot --nginx -d running.madebynz.xyz
   ```

   ```bash
   sudo nginx -t && sudo systemctl reload nginx
   ```

3. Start the API from a clone of this repo on the VPS. Override defaults in a `.env` file next to `docker-compose.yml`: `SITE_URL`, `API_PORT` (default 8080), `DATA_DIR` and `WEB_DIR`.

   ```bash
   docker compose up -d --build
   ```

4. Create your token (see [Managing events](#managing-events)).

### Deploying changes

**Static site:** run this from your machine. It uploads `web/` to `releases/<timestamp>-<sha>`, points `current` at it and keeps the last 5 releases. No nginx reload is needed.

```bash
DEPLOY_HOST=user@your-vps ./deploy/deploy-web.sh
```

To roll back, point `current` at an older release on the VPS:

```bash
cd /var/www/running-calendar && ln -sfn releases/<older-release> current
```

**API:** on the VPS, pull the repo and rebuild:

```bash
git pull && docker compose up -d --build
```

### Backups

The whole database is one SQLite file. Take a consistent snapshot while the API is running with a cron job like:

```bash
sqlite3 /var/lib/running-calendar/app.db "VACUUM INTO '/var/backups/running-calendar-$(date +%F).db'"
```

## Notes

- **Wallpaper PNGs** are rendered on the server because the iOS Shortcut described on the wallpaper page fetches the image URL directly every day. Renders are cached in memory for 15 minutes per event version, day, distance and size. The font is Go Bold/Regular from `golang.org/x/image`. To use another font, replace the TTF in [`server/internal/wallpaper/render.go`](server/internal/wallpaper/render.go).
- **Wallpaper presets** are defined twice and must stay in sync: [`server/internal/wallpaper/presets.go`](server/internal/wallpaper/presets.go) and [`web/js/wallpaper-presets.js`](web/js/wallpaper-presets.js).
- **Caching:** HTML, JS and CSS have no fingerprinted filenames, so nginx serves them with `Cache-Control: no-cache` (the browser revalidates and usually gets a 304). The service worker caches them for offline use. Bump `CACHE_NAME` in [`web/sw.js`](web/sw.js) when the app shell file list changes.
