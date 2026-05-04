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

## Deployment

### Docker (Self-Hosted)

This repository now ships a 2-service Docker Compose setup:

- `web` — the Next.js 16 frontend
- `pocketbase` — the PocketBase backend on port `8090`

**Prerequisites**
- Ubuntu/Debian server
- Docker / Docker Compose

#### First Deploy

```bash
# 1. Clone the repo on your server
git clone <your-repo-url> ~/running-calender

# 2. Set up environment variables
cd ~/running-calender
cp .env.example .env
nano .env  # fill in all values

# 3. Run the setup script
sudo ./setup.sh
```

The script will:
- Install Docker and Nginx if not present
- Build and start the Docker containers
- Configure Nginx to proxy traffic from port 80 to the app

After the first deploy, visit `http://your-server:8090/_/` to bootstrap PocketBase and then apply the collection setup from [pocketbase/README.md](./pocketbase/README.md).

#### Re-deploy (after code changes)

```bash
cd ~/running-calender
sudo ./setup.sh
```

This pulls the latest changes, rebuilds the Docker image, and restarts the container.

#### Enable HTTPS

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d running.madebynz.xyz
```

#### `setup.sh` arguments

```
sudo ./setup.sh [DOMAIN] [SOURCE_DIR]
```

| Argument | Default | Description |
|----------|---------|-------------|
| `DOMAIN` | `running.madebynz.xyz` | Domain name for Nginx config |
| `SOURCE_DIR` | `~/running-calender` | Path to the cloned repository |

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
│   ├── data.ts             # Event and participant data access
│   └── utils.ts            # General utilities
├── pocketbase/             # PocketBase schema and rule setup notes
├── docker/pocketbase/      # PocketBase container build
└── types/                  # TypeScript type definitions
```

## License

MIT
