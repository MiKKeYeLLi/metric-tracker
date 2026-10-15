# Metric Tracker

A marketing operations dashboard for tracking directory submissions across products. Built with Next.js 14 (App Router), Prisma, PostgreSQL, and Google OAuth via NextAuth.

**Live:** https://metrics.zedu.chat

---

## Tech stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Auth | NextAuth v4 — Google OAuth provider |
| ORM | Prisma 5 |
| Database | PostgreSQL |
| Deployment | Coolify (Docker) |
| CI | GitHub Actions — malware scan gate → deploy |

---

## Local setup

### Prerequisites

- Node.js 20+
- PostgreSQL running locally (or a connection string to a remote instance)
- A Google OAuth app ([console.cloud.google.com](https://console.cloud.google.com/apis/credentials))

### 1. Clone and install

```bash
git clone <repo-url>
cd metric-tracker
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Open `.env` and fill in every value:

```env
# PostgreSQL connection string
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/metric-tracker

# Generate with: openssl rand -base64 32
NEXTAUTH_SECRET=your-secret-here

# Public URL — use http://localhost:3000 in development
NEXTAUTH_URL=http://localhost:3000

# From Google Cloud Console → APIs & Services → Credentials
# Authorized redirect URI: {NEXTAUTH_URL}/api/auth/callback/google
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
```

### 3. Run database migrations

```bash
npm run db:migrate        # creates and applies migrations (dev)
```

### 4. Start the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Sign in with Google to reach the dashboard.

---

## Available scripts

| Script | Description |
|---|---|
| `npm run dev` | Start Next.js development server |
| `npm run build` | Generate Prisma client and build for production |
| `npm run start` | Start production server (uses `$PORT` or 3000) |
| `npm run lint` | Run ESLint |
| `npm run db:migrate` | Create and apply a new Prisma migration (dev) |
| `npm run db:deploy` | Apply pending migrations (production / CI) |

---

## Database

The schema lives in `prisma/schema.prisma`. It currently covers NextAuth session tables (`User`, `Account`, `Session`, `VerificationToken`). Run migrations after any schema change:

```bash
npm run db:migrate        # dev — prompts for a migration name
npm run db:deploy         # production — applies without prompting
```

---

## Deployment (Coolify)

The app ships as a Docker container. Coolify runs `prisma migrate deploy` on container start via the `CMD` in the Dockerfile.

**Steps:**

1. Add the repository to Coolify. Set **Build pack** to `Dockerfile`.
2. Set all environment variables from `.env.example` in Coolify's variable editor.
3. Add the following GitHub repository secrets for the deploy workflow:

| Secret | Required | Description |
|---|---|---|
| `COOLIFY_WEBHOOK_URL` | Yes | Webhook URL from the Coolify application's deploy settings |
| `COOLIFY_TOKEN` | No | Bearer token for authenticated webhooks |

**CI pipeline:**

Pushes to `main` run the **Malware Scan (CI Gate)** workflow first. The **Deploy (Coolify)** workflow only triggers after the scan passes — it never deploys on a failed or skipped scan.

---

## Google OAuth setup

1. Go to [Google Cloud Console → Credentials](https://console.cloud.google.com/apis/credentials).
2. Create an **OAuth 2.0 Client ID** (Web application).
3. Add an **Authorized redirect URI**:
   - Development: `http://localhost:3000/api/auth/callback/google`
   - Production: `https://your-domain/api/auth/callback/google`
4. Copy the Client ID and Secret into `.env`.
