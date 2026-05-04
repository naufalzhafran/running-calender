
<!-- BEGIN:nextjs-agent-rules -->
 
# Next.js: ALWAYS read docs before coding
 
Before any Next.js work, find and read the relevant doc in `node_modules/next/dist/docs/`. Your training data is outdated — the docs are the source of truth.
 
<!-- END:nextjs-agent-rules -->

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` — Start Next.js dev server
- `npm run build` — Production build
- `npm run lint` — Run ESLint
- No test framework is configured

## Architecture

This is a **Next.js 16 App Router** application for managing a running event calendar (Indonesian language UI). It uses **PocketBase** for data and auth, and **Shadcn UI** components.

### Data Flow

- **Server Components** (default): Fetch PocketBase data through helpers in `lib/data.ts`. Pages use `export const dynamic = "force-dynamic"` for real-time data.
- **Client Components** (`"use client"`): Fetch data through `/api` route handlers. Used for interactive pages like admin dashboard, event forms, and login.

### API Routes (`app/api/`)

- `/api/events` — Public read-only endpoint
- `/api/admin/events` — Protected CRUD endpoints (verify PocketBase auth cookie)
- `/api/auth/login` and `/api/auth/logout` — Auth endpoints

### Authentication (`lib/auth.ts`)

Admin users live in the PocketBase auth collection configured by `POCKETBASE_ADMIN_COLLECTION` (default `admins`). The Next.js app stores the PocketBase auth state in the `pb_auth` HTTP-only cookie and refreshes it server-side.

### Key Directories

- `app/` — Pages and API routes (App Router)
- `app/admin/` — Protected admin pages (dashboard, event create/edit)
- `components/ui/` — Shadcn UI components (Tailwind v4 + CVA variants)
- `lib/` — `pocketbase.ts` (client helpers), `auth.ts` (auth cookie helpers), `data.ts` (record access), `utils.ts` (cn helper)
- `types/` — TypeScript interfaces (Event, DistanceDetail)
- `pocketbase/` — collection and API rule setup notes

### Styling

Tailwind CSS v4 with `@theme` directive in `globals.css` for CSS variables. Uses a Material Design-inspired custom color theme (`--md-primary`, `--md-surface-container`, etc.). Component variants via `class-variance-authority`.

## Environment Variables

```
POCKETBASE_URL=http://127.0.0.1:8090
POCKETBASE_ADMIN_COLLECTION=admins
```
