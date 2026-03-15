# Running Calendar

A Next.js 16 application for managing running event calendars with Indonesian language UI.

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Database**: PostgreSQL with raw SQL queries
- **Authentication**: JWT cookie-based auth
- **UI**: Shadcn UI components with Tailwind CSS v4
- **Migrations**: node-pg-migrate

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Variables

Create a `.env.local` file in the root directory:

```env
# Database connection string
DATABASE_URL=postgresql://username:password@localhost:5432/running_calendar

# Admin credentials (for logging into the admin dashboard)
ADMIN_USER=your_admin_username
ADMIN_PASS=your_admin_password

# JWT secret for token signing (generate a secure random string)
JWT_SECRET=your_jwt_secret_min_32_characters_long
```

### 3. Run Development Server

```bash
npm run dev
```

Open <http://localhost:3000> with your browser.

## Database Migrations

### Prerequisites

- PostgreSQL database running
- `DATABASE_URL` environment variable set

### Available Commands

```bash
# Apply all pending migrations
npm run migrate up

# Rollback the last migration
npm run migrate down

# Create a new migration file
npm run migrate create <migration_name>

# Push migrations to database (alias for migrate up)
npm run db:push
```

### Migration Files

Migration files are located in the `migrations/` directory. Each migration has `up` and `down` functions to apply and rollback schema changes.

## Deployment

### Deploy to Vercel

1. **Push your code to GitHub**
2. **Create a new project on Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
3. **Configure Environment Variables**
   In the Vercel dashboard, add the following environment variables:
   ```
   DATABASE_URL=your_production_database_url
   ADMIN_USER=your_admin_username
   ADMIN_PASS=your_admin_password
   JWT_SECRET=your_jwt_secret_min_32_characters_long
   ```
4. **Deploy**

### Database Setup on Production

1. **Create a PostgreSQL database**
   - Use Vercel Postgres, Supabase, Neon, or any PostgreSQL hosting provider
   - Get your connection string (DATABASE\_URL)
2. **Run migrations**
   - Option A: Run locally with production DATABASE\_URL
     ```bash
     DATABASE_URL=your_production_url npm run migrate up
     ```
   - Option B: Configure Vercel to run migrations on deploy (requires custom deployment script)

### Self-Hosting

If deploying to a custom server:

1. Build the application:
   ```bash
   npm run build
   ```
2. Set environment variables on your server
3. Run migrations:
   ```bash
   npm run migrate up
   ```
4. Start the production server:
   ```bash
   npm start
   ```

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
│   ├── db.ts               # PostgreSQL connection pool
│   ├── auth.ts             # JWT authentication
│   └── utils.ts            # General utilities
├── migrations/              # Database migration files
└── types/                  # TypeScript type definitions
```

## License

MIT
