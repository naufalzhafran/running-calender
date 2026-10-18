This file provides guidance to Claude Code (claude.ai/code) and other agents when working with code in this repository.

## Architecture

Kalender Lari is a running event calendar (Indonesian UI) with two parts:

- `web/`: static site in plain HTML, CSS and vanilla JS (ES modules). There is no framework, no bundler and no build step. In production the VPS nginx serves it.
- `server/`: Go REST API (standard library `net/http`) with SQLite (`modernc.org/sqlite`, pure Go). It runs in Docker via the root `docker-compose.yml`.

nginx proxies `/api/*`, `/events/{slug}` and `/wallpaper/{slug}` to Go. For the two page routes, Go reads `web/event.html` or `web/wallpaper.html`, swaps the `<!--meta:start-->…<!--meta:end-->` region for per-event title and Open Graph tags, and replaces `<!--page-data-->` with the event JSON.

See README.md for the API, schema, data entry and deployment.

## Commands

- `cd server && go vet ./... && go build ./...`: verify the Go code
- `cd server && SERVE_STATIC=1 WEB_ROOT=../web go run ./cmd/api serve`: local server with the static site at http://localhost:8080
- `cd server && go run ./cmd/api token create --name NAME`: create an admin API token (printed once)
- No test framework is configured.

## Workflow Rules

- Do not start the local server automatically after code changes, plan execution, or verification. Only run it when the user explicitly asks for a local server.
- Prefer `go vet` and `go build` for automated verification unless the user requests manual browser testing.

## Event data

- Change event data through the admin API (`/api/admin/events…` with `Authorization: Bearer <token>`), not by editing SQLite directly. README.md has curl examples.
- Events are addressed by `slug`. Use `GET /api/admin/events/{slug}` before changing an event when the target is ambiguous.
- Use `POST /api/admin/events/import?dry_run=1` to preview bulk changes. Only run mutating requests when the user has authorized that data change.

## Conventions

- Dates are `YYYY-MM-DD` and times are `HH:MM`, in Asia/Jakarta. Go uses `internal/jakarta`; JS uses `web/js/lib.js`.
- Schema changes go in a new `server/internal/db/migrations/NNNN_name.sql` file. Never edit an applied migration.
- In JS, escape every dynamic value inserted into HTML with `esc()` from `web/js/lib.js`.
- Wallpaper presets exist in both `server/internal/wallpaper/presets.go` and `web/js/wallpaper-presets.js`. Keep them in sync.
- If you add a JS or CSS file, add it to `APP_SHELL` in `web/sw.js` and bump `CACHE_NAME`.
