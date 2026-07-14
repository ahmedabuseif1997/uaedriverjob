# Deploying to DigitalOcean App Platform

This app is set up to deploy straight from GitHub to DigitalOcean App Platform, with a managed
PostgreSQL database and a pre-deploy job that runs Prisma migrations before new instances take
traffic. Everything below assumes you have a DigitalOcean account and the GitHub repo pushed to
`ahmedabuseif1997/uaedriverjob` (adjust `.do/app.yaml` if your repo path differs).

## One-time setup

### 1. Create the DigitalOcean Spaces bucket (file storage)

1. In the DO console: **Spaces Object Storage** -> **Create a Spaces Bucket**. Pick a region
   (e.g. `fra1`) and a unique bucket name.
2. Under the bucket's **Settings** tab, enable a CDN endpoint if you want faster asset loads
   (optional but recommended) — this gives you the `DO_SPACES_CDN_URL` value.
3. Generate an API key: **API** -> **Spaces Keys** -> **Generate New Key**. Save the access key
   and secret — these become `DO_SPACES_KEY` / `DO_SPACES_SECRET`.
4. Once the app is deployed (step 5 below), go back to the bucket's **CORS** settings and allow
   your app's origin (e.g. `https://uae-driver-jobs-xxxxx.ondigitalocean.app`, or your custom
   domain) for `PUT` requests — this is required for the presigned-upload flow (driver
   photos/resumes, company logos) to work from the browser.

Your `DO_SPACES_ENDPOINT` is the region endpoint, e.g. `https://fra1.digitaloceanspaces.com`,
and `DO_SPACES_REGION` is just the region code, e.g. `fra1`.

### 2. Create a Stripe account (test mode) and products

1. Sign up at [stripe.com](https://dashboard.stripe.com/register) if you don't have an account,
   and grab your **test mode** keys from **Developers -> API keys**: `STRIPE_SECRET_KEY` and
   `STRIPE_PUBLISHABLE_KEY`.
2. Create products/prices in **Products** for:
   - Three one-time prices (mode: payment) for job-post tiers: Standard, Featured, Urgent —
     these become `STRIPE_PRICE_JOB_STANDARD` / `_FEATURED` / `_URGENT`.
   - Three recurring monthly prices (mode: subscription) for employer plans: Basic, Pro,
     Enterprise — these become `STRIPE_PRICE_SUB_BASIC` / `_PRO` / `_ENTERPRISE`.
   - Reference AED amounts used for display and Order records live in `src/lib/stripe.ts`
     (`JOB_TIER_AMOUNT_AED`, `SUBSCRIPTION_PLAN_AMOUNT_AED`) — keep these in sync with whatever
     prices you actually create in Stripe.
3. You'll set up the webhook endpoint (`STRIPE_WEBHOOK_SECRET`) in step 6, after the app has a
   real URL to point Stripe at.

### 3. Generate a session secret

```bash
openssl rand -base64 32
```

This becomes `SESSION_SECRET`.

### 4. Create the App Platform app

**Option A — via the DO console:**
1. **Apps** -> **Create App** -> **GitHub**, select the `uaedriverjob` repo and branch (`main`).
2. When prompted for the app spec, choose **Edit Your App Spec** and paste the contents of
   `.do/app.yaml` from this repo (or point App Platform at the file directly if it offers to
   read it from the repo).
3. Review the detected `web` service and `migrate` pre-deploy job, and the bound
   `uae-driver-jobs-db` database component.

**Option B — via `doctl` CLI:**
```bash
doctl apps create --spec .do/app.yaml
```

### 5. Fill in the secret environment variables

In the App Platform console, under the app's **Settings -> App-Level Environment Variables** (or
per-component env vars), set the `SECRET`-typed values from `.do/app.yaml`:

- `SESSION_SECRET`
- `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PRICE_JOB_STANDARD`, `STRIPE_PRICE_JOB_FEATURED`, `STRIPE_PRICE_JOB_URGENT`
- `STRIPE_PRICE_SUB_BASIC`, `STRIPE_PRICE_SUB_PRO`, `STRIPE_PRICE_SUB_ENTERPRISE`
- `DO_SPACES_ENDPOINT`, `DO_SPACES_REGION`, `DO_SPACES_BUCKET`, `DO_SPACES_KEY`,
  `DO_SPACES_SECRET`, `DO_SPACES_CDN_URL`

`DATABASE_URL` and `NEXT_PUBLIC_BASE_URL` are already wired via the app spec's variable
bindings (`${uae-driver-jobs-db.DATABASE_URL}` and `${APP_URL}`) and don't need manual entry.

Deploy (or redeploy) once these are set.

### 6. Point Stripe's webhook at the deployed app

1. Once deployed, note the app's URL (e.g. `https://uae-driver-jobs-xxxxx.ondigitalocean.app`,
   or your custom domain if attached).
2. In the Stripe dashboard: **Developers -> Webhooks -> Add endpoint**, URL
   `https://<your-app-domain>/api/stripe/webhook`, and subscribe to at least:
   `checkout.session.completed`, `invoice.paid`, `customer.subscription.updated`,
   `customer.subscription.deleted`.
3. Copy the generated signing secret into `STRIPE_WEBHOOK_SECRET` in the App Platform env vars
   and redeploy.

### 7. Attach a custom domain (optional)

**Settings -> Domains** in the App Platform console — follow the DNS instructions there. Update
`NEXT_PUBLIC_BASE_URL` if it isn't automatically resolved via `${APP_URL}`, and update the
Stripe webhook URL and Spaces CORS origin to match the final domain.

## What happens on every push

- Pushing to `main` triggers `.github/workflows/ci.yml` (lint, typecheck, build) as a PR check,
  and separately triggers App Platform's own auto-deploy (`deploy_on_push: true` in
  `.do/app.yaml`) — these are independent; CI failing doesn't block the App Platform deploy, so
  treat CI as a required PR check if you want it to gate merges.
- On deploy, the `migrate` pre-deploy job runs `prisma migrate deploy` against the production
  database before the new `web` instance receives traffic.
- `/api/health` is used by App Platform's health check (a lightweight `SELECT 1` against the
  database) to confirm the new instance is actually serving before cutting over.

## Local development vs. production

Local dev uses a docker-compose Postgres (or the local Postgres install) and Stripe/DO Spaces
are optional — see the main `README.md`. In production, every one of the env vars above is
required for the corresponding feature to work; Stripe- and Spaces-dependent routes degrade to a
clear 503 rather than crashing if something is misconfigured, which makes it easy to tell what's
still missing after a deploy.
