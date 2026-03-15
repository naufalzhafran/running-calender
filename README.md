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

### Docker (Self-Hosted)

This is the recommended way to deploy on a VPS or dedicated server. The app is containerized via Docker Compose and served through Nginx.

**Prerequisites**
- Ubuntu/Debian server
- PostgreSQL accessible (the Docker Compose setup connects to the `postgres-docker_default` network by default — adjust in `docker-compose.yml` if your setup differs)

#### First Deploy

```bash
# 1. Clone the repo on your server
git clone <your-repo-url> ~/running-calender

# 2. Set up environment variables
cd ~/running-calender
cp .env.example .env
nano .env  # fill in all values

# 3. Run the setup script
sudo ./setup.sh your-domain.com ~/running-calender
```

The script will:
- Install Docker and Nginx if not present
- Build and start the Docker container (migrations run automatically on startup)
- Configure Nginx to proxy traffic from port 80 to the app

#### Re-deploy (after code changes)

```bash
cd ~/running-calender
sudo ./setup.sh your-domain.com ~/running-calender
```

This pulls the latest changes, rebuilds the Docker image, and restarts the container.

#### Enable HTTPS

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

#### `setup.sh` arguments

```
sudo ./setup.sh [DOMAIN] [SOURCE_DIR]
```

| Argument | Default | Description |
|----------|---------|-------------|
| `DOMAIN` | `running.yourdomain.com` | Domain name for Nginx config |
| `SOURCE_DIR` | `~/running-calender` | Path to the cloned repository |

---

### Deploy to Vercel

1. **Push your code to GitHub**
2. **Create a new project on Vercel** and import your repository
3. **Add environment variables** in the Vercel dashboard:
   ```
   DATABASE_URL=your_production_database_url
   ADMIN_USER=your_admin_username
   ADMIN_PASS=your_admin_password
   JWT_SECRET=your_jwt_secret_min_32_characters_long
   ```
4. Run migrations manually against your production DB:
   ```bash
   DATABASE_URL=your_production_url npm run migrate up
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
