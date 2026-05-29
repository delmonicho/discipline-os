# Getting Started — Discipline OS

A runbook from empty repo → deployed, dogfood-ready app. ~45 min the first time.
Stack: Vite + React 19, Tailwind v4, Supabase (Postgres + Edge Functions), Vercel, Claude.

You already have these from the design phase — drop them into the repo as you go:
```
supabase/migrations/001_discipline_os.sql
supabase/functions/_shared/coach-core.ts
supabase/functions/coach/index.ts
supabase/functions/coach-stream/index.ts
supabase/seed_personal.sql
prototype/DisciplineOS.jsx          ← design + interaction source of truth
CLAUDE_CODE_PROMPT.md               ← paste into Claude Code at step 7
```

---

## 1. Repo + Vite app

```bash
# create the repo on GitHub first (empty), then:
git clone git@github.com:delmonicho/discipline-os.git
cd discipline-os
npm create vite@latest . -- --template react-ts
npm install
```

Copy the `supabase/` folder and `prototype/DisciplineOS.jsx` from the design phase into the repo now.

## 2. Tailwind v4 + Supabase client

```bash
npm install @tailwindcss/vite
npm install @supabase/supabase-js
```

`vite.config.ts` — add the Tailwind plugin:
```ts
import tailwindcss from "@tailwindcss/vite";
export default defineConfig({ plugins: [react(), tailwindcss()] });
```
`src/index.css` — one line: `@import "tailwindcss";`
(The prototype is inline-styled and loads its own fonts, so Tailwind is here for future work, not a dependency of the current UI.)

## 3. Supabase project

1. Create a project at supabase.com → copy the **Project URL** and **anon public key** (Settings → API), and note the **project ref** (the subdomain).
2. Link the CLI and push the schema:
```bash
npm install -g supabase
supabase login
supabase init                       # keep your existing supabase/ files
supabase link --project-ref <your-ref>
supabase db push                    # applies 001_discipline_os.sql (tables + RLS)
```

## 4. Deploy the coach functions

```bash
supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
supabase functions deploy coach
supabase functions deploy coach-stream
```
(`SUPABASE_URL` / `SUPABASE_ANON_KEY` are injected automatically; `_shared/` is bundled, not deployed.)

## 5. Env vars

`.env.local` (gitignored):
```
VITE_SUPABASE_URL=https://<your-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon-key>
```

## 6. Auth + seed your plan

- Auth: email magic link is simplest for a solo dogfood — it's on by default. (Google OAuth is an option later; you've wired it in LearnLang.)
- Sign in once (you'll build the sign-in screen in step 7, or use the Supabase dashboard → Authentication → add a user).
- Grab your uid: in the SQL editor run `select id, email from auth.users;`
- Paste it into `supabase/seed_personal.sql` and run that file. Your §4 plan (2 active, 3 queued, intentions, starter coach profile) is now live.

## 7. Wire the prototype to live data (Claude Code)

Open Claude Code at the repo root and paste **`CLAUDE_CODE_PROMPT.md`**. It will scaffold auth, then wire each surface to Supabase in phases, pausing for you to test. Work one phase at a time — don't let it run all the way through.

## 8. Deploy to Vercel

```bash
npm i -g vercel
vercel
```
In the Vercel project settings add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`. Build command `npm run build`, output `dist`.
PWA polish (installable, offline daily-loop via `vite-plugin-pwa`) is a later step — not blocking for dogfood.

---

## Verify as you go
- [ ] `supabase db push` succeeded; tables visible in the dashboard with RLS on
- [ ] `curl` the `coach` function with a user JWT returns a reply (see backend README)
- [ ] Seed ran; `select * from habits;` shows 2 active + 3 queued
- [ ] Sign in works; Today shows your two morning habits
- [ ] Completing an orb writes a `habit_logs` row (`source='manual'`); refresh keeps it
- [ ] Progress garden reads from real logs; grid toggle matches
- [ ] Coach streams from `coach-stream` with inline status pills
- [ ] Accepting a proposal flips a queued habit to active on Today

## The point of the dogfood
Run *yourself* — workout + system design, both anchored to your morning — through it for two weeks before touching onboarding, notifications, or opening it up. You won't churn on your own tool the way a stranger would, so this is where you find what's actually missing.
