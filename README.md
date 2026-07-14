# UAE Driver Jobs

A driver-focused job board for the UAE. Employers pay via Stripe to publish job listings; drivers create a profile once and apply to jobs with a single tap. Built with Next.js (App Router), PostgreSQL/Prisma, and Stripe, with Arabic/English (RTL) support and a mobile-first, installable PWA experience.

See [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) for deploying to DigitalOcean App Platform.

## Stack

- **Framework**: Next.js (App Router) + TypeScript
- **Database**: PostgreSQL via Prisma ORM (driver-adapter based, `@prisma/adapter-pg`)
- **Auth**: Hand-rolled email/password with DB-backed sessions (httpOnly cookies)
- **Payments**: Stripe (one-time Checkout for pay-per-post, subscriptions for recurring plans)
- **File storage**: DigitalOcean Spaces (S3-compatible), via presigned uploads
- **i18n**: `next-intl`, English/Arabic with full RTL layout support
- **Styling**: Tailwind CSS, mobile-first, custom lightweight UI primitives (`src/components/ui`)

## Local development

### 1. Install dependencies

```bash
npm install
```

### 2. Start Postgres

Using docker-compose:

```bash
docker compose up -d
```

Then copy the example env file and adjust if needed:

```bash
cp .env.example .env
```

The default `.env.example` `DATABASE_URL` already matches the docker-compose service.

### 3. Run migrations and seed data

```bash
npm run db:migrate
npm run db:seed
```

Seed data includes an admin, a few employers, drivers, and active job posts. All seeded accounts use the password `password123`.

### 4. Start the dev server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) (redirects to `/en`; try `/ar` for the Arabic/RTL experience).

## Environment variables

See `.env.example` for the full list. Stripe and DigitalOcean Spaces integrations are optional for local development — routes that depend on them return a clear error instead of crashing the app when the corresponding env vars are unset. To exercise the full Stripe flow locally, use the [Stripe CLI](https://stripe.com/docs/stripe-cli):

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

## Scripts

| Script               | Description                        |
| -------------------- | ----------------------------------- |
| `npm run dev`         | Start the Next.js dev server        |
| `npm run build`       | Production build                    |
| `npm run start`       | Start the production server         |
| `npm run lint`        | ESLint                              |
| `npm run typecheck`   | TypeScript check with no emit       |
| `npm run db:migrate`  | Run Prisma migrations (dev)         |
| `npm run db:deploy`   | Apply migrations (production/CI)    |
| `npm run db:seed`     | Seed the database with sample data  |
| `npm run db:studio`   | Open Prisma Studio                  |
