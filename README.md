# Running Calendar

A Next.js 16 application for managing running event calendars with Indonesian language UI, backed by PocketBase.

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Backend**: PocketBase
- **Authentication**: PocketBase auth collection with HTTP-only auth cookie
- **UI**: Shadcn UI components with Tailwind CSS v4
- **Schema Management**: PocketBase collections and rules

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Variables

Create a `.env.local` file in the root directory:

```env
POCKETBASE_URL=http://127.0.0.1:8090
POCKETBASE_ADMIN_COLLECTION=admins
```

### 3. Start PocketBase

Run PocketBase separately on port `8090`. The easiest local setup is:

```bash
docker compose up pocketbase
```

Then open `http://127.0.0.1:8090/_/`, create the first superuser, and configure the collections described in [pocketbase/README.md](./pocketbase/README.md).

### 4. Run Development Server

```bash
npm run dev
```

Open <http://127.0.0.1:5678> with your browser.

## Daily Countdown Wallpaper

This app now exposes a dynamic PNG endpoint for iPhone Shortcuts:

```text
/api/wallpaper/:eventId?distance=10K&preset=iphone-16-pro
```

Example:

```text
http://127.0.0.1:5678/api/wallpaper/RECORD_ID?distance=Half%20Marathon&preset=iphone-16-pro-max
```

Notes:

- `eventId` is the PocketBase record id from the `events` collection.
- `distance` is optional. If omitted, the route uses the nearest available distance date, or the event date as fallback.
- `preset` is optional. Supported values are `iphone-16-pro`, `iphone-16-pro-max`, `iphone-15-pro`, and `generic`.
- The response is a generated PNG sized for a phone lock screen and is intended for automation tools like iOS Shortcuts.
- On the public event detail page, each category card now includes a wallpaper URL generator with preset selection and copy button.

## Deployment

### Docker (Self-Hosted)

The production server runs the Next.js app as the `running-calendar` container.
PocketBase is managed separately as `pocketbase2`; both containers share the
external Docker network `running-net`. Nginx proxies
`running.madebynz.xyz` to `127.0.0.1:5678`.

After changes have been pushed to `main`, redeploy with:

```bash
/home/zhafran/scripts/redeploy-running-calendar.sh
```

The script refuses uncommitted tracked changes, fast-forwards the local checkout
from `origin/main`, builds the image, and recreates only the web container.
No project `.env` file is required for this production configuration.

## Project Structure

```
├── app/                    # Next.js App Router pages and API routes
│   ├── admin/              # Protected admin pages
│   ├── api/                # API route handlers
│   └── events/             # Public event pages
├── components/             # React components
│   ├── admin/              # Admin-specific components
│   └── ui/                 # Shadcn UI components
├── lib/                    # Utility functions and libraries
│   ├── pocketbase.ts       # PocketBase client helpers and record mappers
│   ├── auth.ts             # PocketBase auth cookie helpers
│   ├── data.ts             # Event data access
│   └── utils.ts            # General utilities
├── pocketbase/             # PocketBase schema and rule setup notes
└── types/                  # TypeScript type definitions
```

## License

MIT
