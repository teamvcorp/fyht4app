# Black Belt Parenting (by FYHT4) — Deploy & Setup (app.fyht4.com)

Mobile-first parenting-coach app. Next.js 16 (App Router) + MongoDB (native driver) + Auth.js v5 + Claude + Stripe + Vercel Blob.

## Local development

1. Fill `.env.local` (copy from `.env.example`). Required to run end-to-end:
   - `MONGODB_URI`, `MONGODB_DB`
   - `AUTH_SECRET` (generate: `npx auth secret`)
   - `ANTHROPIC_API_KEY` (+ optional `ANTHROPIC_MODEL`, default `claude-sonnet-4-6`)
   - Stripe: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_MEMBERSHIP_PRICE_ID`
   - `BLOB_READ_WRITE_TOKEN` (lesson/test videos)
   - Optional tuning: `MEMBER_DAILY_LIMIT` (default 10), `TAEKWONDO_WEEK_MS` (default 7 days; set e.g. `60000` to demo the weekly gate fast)
2. Seed the codex + principle shells: `npm run seed && npm run seed:principles`
3. `npm run dev` → http://localhost:3000
4. Make yourself admin: `npm run make-admin -- you@email.com`

## Plans & pricing (where each is set)

| Plan | Amount | Configured |
|---|---|---|
| Free | 1 Q/day | `FREE_QUESTIONS_PER_DAY` in `lib/quota.ts` |
| Basic Membership | $25/mo | a **recurring Stripe Price** → `STRIPE_MEMBERSHIP_PRICE_ID`; daily cap = `MEMBER_DAILY_LIMIT` (protects Claude token cost) |
| Tier book | $25 once | inline price (`BOOK_FEE_CENTS` in `lib/taekwondo.ts`) — no Stripe Price needed |
| Belt test | $20 once/belt | inline price (`BELT_TEST_FEE_CENTS`) |
| Taekwondo tier enrollment | $900–$2,100 | **not yet charged** — enrollment is a free placeholder; wire real (installment) checkout later |

## Stripe setup

1. Create **one recurring Price** ($25/mo) for the membership → put its id in `STRIPE_MEMBERSHIP_PRICE_ID`. (The $25 book and $20 belt test use inline prices — no Price objects needed.)
2. Add a webhook endpoint → `https://app.fyht4.com/api/stripe/webhook`, events:
   `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`.
   Put the signing secret in `STRIPE_WEBHOOK_SECRET`. The one webhook handles all flows (it branches on `metadata.type`: `belt_test`, `book`, else subscription).
3. Local testing: `stripe listen --forward-to localhost:3000/api/stripe/webhook` (use test keys + card `4242 4242 4242 4242`).
4. Members manage/cancel via the Stripe **Billing Portal** (Account → Manage billing, `/api/stripe/portal`). Enable the portal in Stripe Dashboard → Settings → Billing → Customer portal.

## Token-cost guardrail

Members are capped at `MEMBER_DAILY_LIMIT` questions/UTC-day (default 10). At ~$0.03–0.04/answer on Sonnet 4.6, that's well under the $25/mo price even for a daily-max user. Raise/lower via the env var.

## Vercel deploy

1. Import the repo into Vercel. Framework preset: Next.js (no special build config).
2. Add all env vars from `.env.example` in **Project → Settings → Environment Variables**.
   Set `AUTH_URL` and `NEXT_PUBLIC_APP_URL` to `https://app.fyht4.com`.
3. Add the domain **app.fyht4.com** under Project → Domains; point the DNS `CNAME` for `app` at Vercel.
4. Create a MongoDB Atlas cluster; allow Vercel egress IPs (or 0.0.0.0/0 for serverless) and use the SRV URI.
5. Create a Vercel Blob store (private) and add `BLOB_READ_WRITE_TOKEN`.
6. After first deploy, run the seed once against the production DB (`MONGODB_URI=<prod> npm run seed`).

## Notes / next steps

- Rive: `components/Character.tsx` isolates the character slot (currently `public/master.png`). Swap in `@rive-app/react-canvas` there when the animation is ready.
- Codex: `scripts/seed-codex.ts` holds 5 starter entries — grow this together; retrieval is keyword+age (`lib/coach/codex.ts`), upgrade to embeddings as it scales.
- Book + Taekwondo upsells are placeholders; the engine already extracts `ageYears` + `topic` for the future book-matching pass.
