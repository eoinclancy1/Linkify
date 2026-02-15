# Linkify

LinkedIn employee advocacy tracker — monitors employee posting activity, engagement metrics, and company mentions across your team's LinkedIn profiles.

## Tech Stack

- **Framework**: Next.js 16 (App Router) + React 19
- **ORM**: Prisma 7 with `@prisma/adapter-pg`
- **Scraping**: Apify actors via `apify-client`
- **Styling**: TailwindCSS 4
- **State**: SWR (data fetching), Zustand (client state)
- **Charts**: Recharts 3

## Quick Start

```bash
npm install
cp .env.local.example .env.local  # or edit .env.local directly
npm run dev                        # http://localhost:3000
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string. Only needed when `USE_MOCK_DATA=false`. |
| `APIFY_TOKEN` | Apify API token for running LinkedIn scrapers. |
| `CRON_SECRET` | Bearer token to authenticate the `/api/cron/scrape` endpoint. |
| `USE_MOCK_DATA` | `"true"` = use mock data (no DB needed). `"false"` = use PostgreSQL. |
| `NEXT_PUBLIC_APIFY_CONFIGURED` | `"true"` enables scrape controls in the settings UI. |
| `NEON_API_KEY` | (Optional) Neon personal API key for usage cost tracking on `/usage`. |
| `NEON_PROJECT_ID` | (Optional) Neon project ID (from Project Settings, not extractable from DATABASE_URL). |

## Data Provider System

All data access goes through the `DataProvider` interface (`src/lib/data/provider.ts`).

- `USE_MOCK_DATA=true` (or no `DATABASE_URL`) → `MockDataProvider` with hardcoded sample data
- `USE_MOCK_DATA=false` + valid `DATABASE_URL` → `PostgresDataProvider` backed by Prisma

The factory `getDataProvider()` is a singleton — provider choice is locked for the lifetime of the process.

## Database (Prisma 7)

### Key Gotchas

1. **No `url` in `schema.prisma`** — the datasource block has only `provider = "postgresql"`. The connection URL lives in `prisma.config.ts`.
2. **Adapter required** — Prisma 7 uses `@prisma/adapter-pg` + the `pg` package. The client singleton is in `src/lib/db/prisma.ts`. Must pass an explicit `pg.Pool` instance to `PrismaPg` (not the `{ connectionString }` shorthand) for Vercel compatibility.
3. **JSON field casting** — when writing `unknown[]` data to JSON columns, cast to `Prisma.InputJsonValue`.
4. **Environment loading** — `prisma.config.ts` uses `dotenv` with `{ path: ".env.local" }` to load the correct env file.
5. **No dynamic `require()`** — the production bundler (Turbopack) breaks `require()` calls. Use static imports everywhere. The DataProvider factory uses static imports of both `MockDataProvider` and `PostgresDataProvider`.
6. **Vercel serverless** — `pg` and `@prisma/adapter-pg` must be in `serverExternalPackages` in `next.config.ts` to avoid bundling issues.
7. **Build scripts** — `package.json` has `"build": "prisma generate && next build"` and `"postinstall": "prisma generate"` to ensure the Prisma client is generated on Vercel.

### Migration Commands

```bash
npx prisma generate          # regenerate client after schema changes
npx prisma migrate dev       # create + apply migration in dev
npx prisma migrate deploy    # apply pending migrations in production
npx prisma studio            # visual DB browser
```

## Prisma Schema Summary

### Models (7)

| Model | Purpose |
|-------|---------|
| `Employee` | LinkedIn profile data, department, active status |
| `Post` | Individual LinkedIn posts with engagement metrics |
| `CompanyMention` | Posts that mention the company |
| `EngagementSnapshot` | Point-in-time engagement metrics for trend tracking |
| `PostingActivity` | Daily post counts per employee |
| `ScrapeRun` | Scrape job history with status, stats, and `costUsd` per run |
| `AppConfig` | Singleton row for company URL, name, scrape settings, `vercelMonthlyCostUsd` |

### Enums (4)

| Enum | Values |
|------|--------|
| `Department` | ENGINEERING, MARKETING, SALES, PRODUCT, DESIGN, LEADERSHIP, OPERATIONS, PEOPLE, PARTNERSHIPS, DATA, OTHER |
| `PostType` | ORIGINAL, RESHARE, ARTICLE, POLL |
| `ScrapeType` | EMPLOYEE_DISCOVERY, PROFILE_SCRAPE, POST_SCRAPE, ENGAGEMENT_UPDATE |
| `ScrapeStatus` | PENDING, RUNNING, COMPLETED, FAILED, PARTIAL |

## Apify Scrapers

Three actors in `src/lib/apify/scrapers/` (all from `harvestapi` — free, no cookies required):

| Actor ID | File | Purpose |
|----------|------|---------|
| `harvestapi/linkedin-company-employees` | `employee-discovery.ts` | Discovers employee profile URLs from a company page. Uses `takePages: 100` to prevent empty results. |
| `harvestapi/linkedin-profile-scraper` | `profile-scraper.ts` | Scrapes full profile details (bio, experience, skills). Handles `avatarUrl` as object `{ url, sizes }`. |
| `harvestapi/linkedin-profile-posts` | `post-scraper.ts` | Scrapes posts with engagement metrics and company mention detection. Excludes reposts, handles array comments and invalid dates. 5s delay between profiles. |

## Scraper Robustness

The scrapers handle various Apify data inconsistencies:

- **Post scraper**: The `harvestapi/linkedin-profile-posts` actor returns a non-obvious data format:
  - **Dates**: `postedAt` is an **object** `{ timestamp, date, postedAgoShort, postedAgoText }`, not a string. `extractPostedAt()` handles this.
  - **Engagement**: Metrics are nested under an `engagement` object (`post.engagement.likes`), not top-level. The mapper checks nested first, then falls back to top-level fields.
  - **URLs**: The actor returns `linkedinUrl` (not `url` or `postUrl`) with full `https://www.linkedin.com/posts/...` format.
  - **Post ID**: Uses `shareUrn` (e.g. `urn:li:ugcPost:...`) or `id` (numeric string). `entityId` is the activity ID.
  - **Text**: Uses `content` field (not `text` or `textContent`).
  - `toCount()` handles engagement fields that may be arrays instead of numbers. `isRepost()` checks both `isRepost` boolean and post type to exclude reshares.
- **Profile scraper**: `extractUrl()` handles `avatarUrl` being either a string or an object `{ url, sizes }`.
- **Employee discovery**: Uses `takePages: 100` to prevent the Apify actor from returning empty results.
- **Stuck run auto-expiry**: The orchestrator auto-expires runs stuck in RUNNING status.

## Vercel Background Execution

The scrape trigger route uses Next.js `after()` (from `next/server`) with `maxDuration: 300` (5 minutes) to run scrapes in the background after returning a response. This prevents Vercel function timeouts for long-running scrape operations.

## API Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/employees` | GET | List all employees (or by ID via query param) |
| `/api/employees` | POST | Create employee from LinkedIn URL |
| `/api/posts` | GET | All posts or by employee, with optional date range |
| `/api/hits` | GET | Posts with 100+ likes, sorted by engagement |
| `/api/stats` | GET | Dashboard summary stats |
| `/api/streaks` | GET | Posting streaks for all or one employee |
| `/api/activity` | GET | Posting activity for an employee |
| `/api/mentions` | GET | Company mentions with date/sort filters |
| `/api/config` | GET, POST | Read or update app configuration |
| `/api/scrape/trigger` | POST | Start a scrape job (`full`, `discovery`, `profiles`, or `posts`). Uses `after()` + `maxDuration: 300` for Vercel background execution. |
| `/api/scrape/status` | GET | Scrape run history and current status |
| `/api/cron/scrape` | GET | Cron-triggered full scrape (requires `CRON_SECRET`) |
| `/api/usage` | GET | Aggregated 30-day costs for Apify (from ScrapeRun), Neon (API), and Vercel (manual). |

## Key Directories

```
src/lib/data/       DataProvider interface, mock + postgres implementations
src/lib/db/         Prisma client singleton
src/lib/apify/      Apify client wrapper + scraper modules
src/lib/scraping/   ScrapeOrchestrator (coordinates discovery → profile → post pipeline)
src/lib/utils/      Shared helpers
src/app/api/        Next.js API routes
prisma/             Schema + migrations
```

## Deployment

### Production Stack
- **Hosting**: Vercel (auto-deploys from `main` branch)
- **Database**: Neon (serverless PostgreSQL) — `ep-empty-math-ai0tutbj-pooler.c-4.us-east-1.aws.neon.tech`
- **URL**: https://airops-linkify.vercel.app/
- **Cron**: Vercel cron runs daily at 2 AM UTC (`vercel.json`)

### Production Environment Variables (set in Vercel dashboard)

| Variable | Value |
|----------|-------|
| `DATABASE_URL` | Neon connection string (`?sslmode=require`) |
| `APIFY_TOKEN` | Apify API token |
| `CRON_SECRET` | Random secret for cron auth |
| `USE_MOCK_DATA` | `false` |
| `NEXT_PUBLIC_APIFY_CONFIGURED` | `true` |
| `NEON_API_KEY` | (Optional) Neon personal API key for `/usage` cost tracking |
| `NEON_PROJECT_ID` | (Optional) Neon project ID for `/usage` cost tracking |

### Going Live (Mock → Real Data)

1. Set up PostgreSQL (Neon) and set `DATABASE_URL` in `.env.local`
2. Run `npx prisma migrate deploy` to create tables
3. Get an Apify API token and set `APIFY_TOKEN`
4. Set `USE_MOCK_DATA="false"`
5. Set `NEXT_PUBLIC_APIFY_CONFIGURED="true"`
6. Set `CRON_SECRET` to a secure random string
7. Open Settings, enter your company LinkedIn URL, and trigger a scrape
8. (Optional) Set up a cron job to hit `/api/cron/scrape` with `Authorization: Bearer <CRON_SECRET>`

## Common Commands

```bash
npm run dev          # start dev server
npm run build        # production build
npm run lint         # run ESLint
npx prisma generate  # regenerate Prisma client
npx prisma migrate dev  # create + apply migration
npx prisma studio    # visual DB browser
```

## UI Component Notes

- Badge component variants: `green`, `blue`, `orange`, `red`, `neutral` (not `gray`)
- Settings page uses SWR with 5-second polling for live scrape status. Has individual scrape buttons: Full Sync, Discover Employees, Update Profiles, Update Posts. Links to `/usage` page.
- Usage page (`/usage`) shows 30-day cost breakdown: Apify (from ScrapeRun.costUsd), Neon (from consumption API), Vercel (manual entry stored in AppConfig.vercelMonthlyCostUsd).
- Theme colors: `linkify-green` (#1DB954), `background` (#121212), `surface` (#181818), `elevated` (#282828), `highlight` (#333333)
- Next.js 16 uses `proxy.ts` instead of `middleware.ts` (deprecated but still works)
