# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` — Start Next.js dev server
- `npm run build` — Production build
- `npm run lint` — Run ESLint
- No test framework is configured

## Architecture

This is a **Next.js 16 App Router** application for managing a running event calendar (Indonesian language UI). It uses **PostgreSQL** with raw SQL queries (no ORM), **JWT cookie-based auth**, and **Shadcn UI** components.

### Data Flow

- **Server Components** (default): Query PostgreSQL directly via the `pg` connection pool from `lib/db.ts`. Pages use `export const dynamic = "force-dynamic"` for real-time data.
- **Client Components** (`"use client"`): Fetch data through `/api` route handlers. Used for interactive pages like admin dashboard, event forms, and login.

### API Routes (`app/api/`)

- `/api/events` and `/api/events/[id]/participants` — Public read-only endpoints
- `/api/admin/events` and `/api/admin/participants` — Protected CRUD endpoints (verify JWT from cookie)
- `/api/auth/login` and `/api/auth/logout` — Auth endpoints

### Authentication (`lib/auth.ts`)

Single admin user authenticated via `ADMIN_USER`/`ADMIN_PASS` env vars. JWT (HS256, 24h expiry) stored as HTTP-only cookie. Protected admin routes verify the token using `jose`.

### Key Directories

- `app/` — Pages and API routes (App Router)
- `app/admin/` — Protected admin pages (dashboard, event create/edit)
- `components/ui/` — Shadcn UI components (Tailwind v4 + CVA variants)
- `lib/` — `db.ts` (pg pool), `auth.ts` (JWT), `utils.ts` (cn helper)
- `types/` — TypeScript interfaces (Event, Participant, DistanceDetail)
- `scripts/` — Database migration scripts (run with Node.js directly)

### Styling

Tailwind CSS v4 with `@theme` directive in `globals.css` for CSS variables. Uses a Material Design-inspired custom color theme (`--md-primary`, `--md-surface-container`, etc.). Component variants via `class-variance-authority`.

## Environment Variables

```
DATABASE_URL=postgresql://...
ADMIN_USER=...
ADMIN_PASS=...
JWT_SECRET=...
```
