# 🛠️ Milestone Reward Tracker — Implementation Plan

> Companion to [FEATURES.md](./FEATURES.md) (the requirements source of truth).
> This doc covers the **tech stack, setup steps, data model, architecture, and build phases**.
> **Last updated:** 2026-08-08

---

## 0. Tech Stack (agreed)
| Layer | Choice |
|---|---|
| Frontend | **React + TypeScript** (Vite SPA) |
| UI | **Tailwind CSS + shadcn/ui** |
| Charts | **shadcn Charts** (Recharts) |
| Backend + DB | **Supabase** (hosted Postgres, auto REST API, realtime) |
| Auth | Passcode per profile (hashed) + remember-on-device (localStorage) |
| Hosting | **Vercel** (GitHub auto-deploy); DB on Supabase |
| Mobile | **PWA** (installable on phone) |

All business rules (spill math, scheduling, no-overdraft) run in the TypeScript app and persist to
Supabase. Fine for a small trusted group.

> ⚠️ **Security note (v1):** the Supabase anon key ships in the browser and profiles are not real
> auth accounts, so the passcode is a **light gate only** — anyone with the URL could read data.
> Acceptable for two brothers. Hardening path noted in §7.

---

## 0.5 Design System (UI)
**Direction:** warm, minimal, **plain/clean dashboard** (toned-down — not heavy editorial).
Cream + ink + **one olive accent**. Supports **light** and **warm-dark** modes.
**Fraunces used sparingly** (wordmark, page titles, the big balance number); **Inter** for all UI;
**monospace** for money/figures.

### Fonts (all free)
| Role | Font | Where |
|---|---|---|
| Display (sparingly) | **Fraunces** | wordmark, page titles, big balance |
| UI / body | **Inter** | everything else |
| Money / numeric | **Geist Mono** (or JetBrains Mono) | balance, rewards, ledger, chart axes |

### Colour tokens
| Token | Light | Dark |
|---|---|---|
| background | `#F0EAD9` | `#211D17` |
| card / surface | `#F6F1E4` | `#2A251E` |
| foreground (ink) | `#1C1A15` | `#EDE7D8` |
| muted text | `#7A756A` | `#A79E8C` |
| border / input | `#DBD3C1` | `#3A342A` |
| primary (button) | `#1C1A15` (cream text) | `#EDE7D8` (espresso text) |
| accent (olive) | `#7E7A46` | `#B7AE67` |

**Status (muted, earthy — used sparingly):** achieved `#5F7052`/`#8CA07A` · needs-action
`#9A7B3E`/`#C6A35C` · surrender & negative-balance `#9A5A47`/`#C08472`.
**Chart palette:** olive `#7E7A46`, clay `#9C6B4A`, sage `#6E7A5A`, stone `#8A7E6A`, slate `#5F6B70`.

### shadcn CSS variables (paste into `src/index.css`; adjust format to your shadcn version)
```css
:root{
  --radius:0.5rem;
  --background:#F0EAD9; --foreground:#1C1A15;
  --card:#F6F1E4; --card-foreground:#1C1A15;
  --primary:#1C1A15; --primary-foreground:#F6F1E4;
  --secondary:#E7E0CF; --secondary-foreground:#1C1A15;
  --muted:#E7E0CF; --muted-foreground:#7A756A;
  --accent:#7E7A46; --accent-foreground:#F6F1E4;
  --border:#DBD3C1; --input:#DBD3C1; --ring:#7E7A46;
}
.dark{
  --background:#211D17; --foreground:#EDE7D8;
  --card:#2A251E; --card-foreground:#EDE7D8;
  --primary:#EDE7D8; --primary-foreground:#211D17;
  --secondary:#332C23; --secondary-foreground:#EDE7D8;
  --muted:#332C23; --muted-foreground:#A79E8C;
  --accent:#B7AE67; --accent-foreground:#211D17;
  --border:#3A342A; --input:#3A342A; --ring:#B7AE67;
}
```

### Component notes (plain dashboard)
- **Cards:** cream surface, 1px tan border, radius ~8px, comfortable padding, airy but standard grid.
- **Headings:** Inter semibold, normal case; Fraunces reserved for the wordmark, page titles and the balance.
- **Buttons:** primary = solid ink; secondary = thin outline; ghost for tertiary. Arrows optional/subtle.
- **Balance & money:** Geist Mono; negative balance shown in the muted clay colour.
- **Status chips:** small, muted, earthy. "Needs action" in amber-olive.
- **Charts:** thin lines, light grid, olive/earthy strokes, legend = small toggle chips (per-line visibility).
- **History / surrendered:** greyed and quiet, at the bottom.
- **Dark mode:** a simple toggle in the header (espresso + cream).
- **Icons:** `lucide-react` (ships with shadcn), used sparingly.

---

## 0.6 Dashboard Layout
Single scrolling page. **Two columns on desktop, single column on mobile.** Top-to-bottom:

1. **Header (slim):** `GULLAK` wordmark (Fraunces) left; **dark-mode toggle** + **profile switcher**
   (`Aditya ▾`) right.
2. **Hall of Fame │ Hall of Shame** — two columns; Shame greyed.
3. **Weight │ Reward** — Weight line chart (left); Reward card (right) = mono `₹12,000` + `Withdraw →`.
4. **Progress** — full-width line chart with per-line toggles (`▸ pushup ▸ dsa`) + hide-widget.
5. **Active** — milestones **stacked vertically** (full-width rows), each showing `CATEGORY · M#`,
   target, `₹reward · due <date>` (or `NEEDS ACTION`), actions `[Achieved →] · spill · surrender`.
6. **Upcoming** — quiet vertical list (next per category), muted.
7. **History** — completed (✓) & surrendered (⨯, greyed), newest first.

```
┌────────────────────────────────────────────────────────────────┐
│  ✦ GULLAK                                     ☾   Aditya ▾      │
├───────────────────────────────┬────────────────────────────────┤
│  HALL OF FAME                  │  HALL OF SHAME        (greyed) │
├───────────────────────────────┼────────────────────────────────┤
│  WEIGHT                        │  REWARD                        │
│  [ minimal line chart ]        │   ₹ 12,000   [ WITHDRAW → ]    │
├───────────────────────────────┴────────────────────────────────┤
│  PROGRESS                        ▸ pushup   ▸ dsa    (toggles)  │
│  [ ──────────── minimal line chart ──────────── ]              │
├───────────────────────────── hairline ─────────────────────────┤
│  ACTIVE  (stacked vertically)                                  │
│  [ PUSHUP · M2   45 reps      ₹3,000 · due 26 Aug   ACHIEVED → ]│
│  [ DSA · M1      20 questions ₹2,000 · due 30 Aug   ACHIEVED → ]│
│  [ SQUATS · M3   75 reps      ⚑ NEEDS ACTION        ACHIEVED → ]│
│  UPCOMING (quiet): PUSHUP·M3 55 · ₹4k ~9 Sep · DSA·M2 …         │
├───────────────────────────── hairline ─────────────────────────┤
│  HISTORY  (completed ✓ & surrendered ⨯, greyed)                │
└────────────────────────────────────────────────────────────────┘
```

---

## 1. Prerequisites & Accounts (one-time setup)
1. **Node.js LTS (v20+)** — install from <https://nodejs.org> (or via `nvm`). Verify:
   ```bash
   node -v
   npm -v
   ```
2. **Git** — verify `git --version` (comes with Xcode CLT on macOS: `xcode-select --install`).
3. **GitHub account** — <https://github.com> (for code + Vercel login).
4. **Supabase account** — <https://supabase.com> (sign in with GitHub). Create a **new project**;
   note the **Project URL** and **anon public key** (Project Settings → API).
5. **Vercel account** — <https://vercel.com> (sign in with GitHub).

---

## 2. Project Scaffold (in the `Tracker` folder)
```bash
# From inside /Users/aditya.barnwal/Tracker (keep FEATURES.md / IMPLEMENTATION.md)
npm create vite@latest . -- --template react-ts
# If prompted about existing files, choose "Ignore files and continue"
npm install

# Tailwind + shadcn/ui (follow prompts; pick defaults)
npx shadcn@latest init
# Add the components we'll use
npx shadcn@latest add button card dialog input label select tabs badge dropdown-menu \
  form sonner table separator chart

# Supabase client
npm install @supabase/supabase-js

# PWA plugin
npm install -D vite-plugin-pwa

# Fonts (self-hosted) + dark-mode toggle
npm install @fontsource-variable/fraunces @fontsource-variable/inter @fontsource-variable/geist-mono next-themes
```
Create **`.env.local`** (git-ignored) with your Supabase keys:
```
VITE_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR-ANON-KEY
```
Run locally: `npm run dev`.

---

## 3. Database Schema (run in Supabase → SQL Editor)
```sql
-- PROFILES
create table profiles (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  passcode_hash text not null,          -- SHA-256 of passcode (light gate)
  created_at timestamptz default now()
);

-- METRICS: milestone categories AND plain (graph-only) metrics
create table metrics (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  name text not null,
  kind text not null default 'category' check (kind in ('category','plain')),
  direction text not null default 'higher' check (direction in ('higher','lower')),
  unit text,                             -- e.g. 'kg', 'reps'
  start_date date,                       -- category start (milestone 1 default)
  status text not null default 'active' check (status in ('active','surrendered','completed')),
  sort_order int not null default 0,
  created_at timestamptz default now()
);

-- MILESTONES (ordered within a category)
create table milestones (
  id uuid primary key default gen_random_uuid(),
  metric_id uuid not null references metrics(id) on delete cascade,
  seq int not null,
  target numeric not null,
  reward numeric not null,
  duration_weeks int not null check (duration_weeks >= 1),
  start_date date,                       -- explicit override (past/future); else computed
  status text not null default 'upcoming'
    check (status in ('upcoming','active','achieved','surrendered')),
  spill_count int not null default 0,
  activated_on date,
  deadline date,
  completed_on date,                     -- effective completion = min(action, deadline)
  created_at timestamptz default now()
);

-- DAILY LOGS: one value per metric per day (upsert to overwrite)
create table daily_logs (
  id uuid primary key default gen_random_uuid(),
  metric_id uuid not null references metrics(id) on delete cascade,
  log_date date not null,
  value numeric not null,
  updated_at timestamptz default now(),
  unique (metric_id, log_date)
);

-- TRANSACTIONS ledger: balance = SUM(amount). Never edit balance directly.
create table transactions (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  type text not null check (type in ('achieve','spill','withdraw')),
  amount numeric not null,               -- signed: +reward / -half / -withdraw
  milestone_id uuid references milestones(id) on delete set null,
  note text,                             -- for withdrawals
  created_at timestamptz default now()
);

-- GRAPH WIDGETS + LINES
create table graph_widgets (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  title text not null,
  visible boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz default now()
);
create table graph_lines (
  id uuid primary key default gen_random_uuid(),
  widget_id uuid not null references graph_widgets(id) on delete cascade,
  metric_id uuid not null references metrics(id) on delete cascade,
  color text,
  visible boolean not null default true,
  created_at timestamptz default now()
);

-- Balance helper
create view profile_balances as
select p.id as profile_id, coalesce(sum(t.amount), 0) as balance
from profiles p left join transactions t on t.profile_id = p.id
group by p.id;

-- v1 light-gate RLS: enable and add a permissive policy on each table.
-- (Harden later with Supabase Auth — see §7.)
alter table profiles       enable row level security;
alter table metrics        enable row level security;
alter table milestones     enable row level security;
alter table daily_logs     enable row level security;
alter table transactions   enable row level security;
alter table graph_widgets  enable row level security;
alter table graph_lines    enable row level security;
-- Example (repeat per table, adjusting the name):
create policy "v1 open" on profiles      for all using (true) with check (true);
create policy "v1 open" on metrics       for all using (true) with check (true);
create policy "v1 open" on milestones    for all using (true) with check (true);
create policy "v1 open" on daily_logs    for all using (true) with check (true);
create policy "v1 open" on transactions  for all using (true) with check (true);
create policy "v1 open" on graph_widgets for all using (true) with check (true);
create policy "v1 open" on graph_lines   for all using (true) with check (true);
```

**Weight** is just a plain metric named "Weight" (unit `kg`) shown by a default "Weight" widget.

---

## 4. App Architecture
```
src/
  lib/
    supabase.ts        # Supabase client (reads VITE_ env vars)
    scheduling.ts      # deadlines, effective completion = min(action, deadline), projections
    money.ts           # spill penalty, ledger balance, withdraw guardrail
    hash.ts            # SHA-256 passcode hashing (Web Crypto)
    session.ts         # remember selected profile (localStorage)
  types/               # TS types mirroring the DB tables
  components/ui/        # shadcn components
  components/
    ProfileGate.tsx    # select/create profile + passcode
    Dashboard.tsx      # overall layout (matches the sketch)
    RewardCard.tsx     # balance + Withdraw dialog (no-overdraft)
    MilestoneCard.tsx  # active card w/ Achieved / Spill / Surrender + "Needs action"
    UpcomingList.tsx
    HistoryList.tsx    # achieved + surrendered (greyed) at the bottom
    HallOfFameShame.tsx
    GraphWidget.tsx    # chart + per-line & per-widget visibility toggles
    MetricEditor.tsx   # create/edit metric (category or plain) + milestones (reorder/insert)
    DailyEntry.tsx     # enter today's value per metric (upsert)
  features/            # data hooks (useProfiles, useMetrics, useMilestones, ...)
  App.tsx  main.tsx
```
**Key logic**
- `effectiveCompletion(action, deadline) = min(action, deadline)` (no extra time for lateness).
- On **Achieve**: write `transactions(+reward)`, set milestone `achieved`/`completed_on`, activate next
  milestone from the effective completion date.
- On **Spill**: write `transactions(-reward/2)`, `spill_count++`, deadline = `min(today, deadline) + weeks`.
- On **Surrender**: milestone `surrendered`, metric `status='surrendered'` (closes category).
- **Balance** always read from `profile_balances` (never stored/edited directly).
- **Withdraw**: block if `amount > balance`.
- **Auto-offer**: after a daily-log upsert, if value meets target (≥ for higher, ≤ for lower) → highlight
  the active milestone and prompt to confirm Achieved.

---

## 5. Build Phases (incremental, each shippable)
| Phase | Deliverable |
|---|---|
| 0 | Scaffold: Vite + Tailwind + shadcn + Supabase client + deploy skeleton to Vercel |
| 1 | **Profiles**: create/select, passcode hash, remember-on-device |
| 2 | **Metrics**: create/edit categories & plain metrics; daily value entry (upsert) |
| 3 | **Milestones**: CRUD + reorder/insert + scheduling engine (start dates, deadlines, projections) |
| 4 | **Money**: achieve/spill/surrender + transactions ledger + balance + withdraw guardrail |
| 5 | **Dashboard**: active / upcoming / history views + "Needs action" + auto-offer |
| 6 | **Graphs**: widgets, attach lines to metrics, per-line & per-widget visibility; Weight + Activity defaults |
| 7 | **Hall of Fame / Shame** (auto-ranked by reward) |
| 8 | **PWA** + responsive polish + final deploy |

---

## 6. Deployment (Vercel)
1. `git init && git add . && git commit -m "init"`.
2. Create a GitHub repo and push.
3. Vercel → **New Project** → import the repo → framework preset **Vite**.
4. Add env vars **VITE_SUPABASE_URL** and **VITE_SUPABASE_ANON_KEY**.
5. Deploy → you get a live URL. Every push to `main` auto-deploys.

---

## 6.5 Build Progress & How to Run (v1.0)
**Implemented (deployable):**
- Vite + React + TS; Tailwind tokens (light/dark) + Fraunces/Inter/JetBrains Mono; dark-mode toggle.
- Passcode **login gate** + profile create / switch / logout (device-remembered).
- Full **CRUD**: create/edit/delete goals (categories) & plain metrics; add/edit/delete/reorder milestones;
  create/edit/delete graph widgets and attach metric lines; daily-log modal for any metric.
- Core loop: achieve / spill / surrender, ledger balance, withdraw (no overdraft), "Needs action" / "Target reached".
- Dashboard per §0.6; Hall of Fame/Shame; Weight + Reward; Progress charts.
- **PWA** (installable, offline) via vite-plugin-pwa + `public/icon.svg`.
- **Optional Supabase sync** (whole-document `gullak_documents` jsonb + realtime), auto-enabled when
  `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` are set; falls back to local-first otherwise.
- **Vercel**-ready (`vercel.json` SPA rewrite). See `README.md` for deploy + Supabase SQL.

**Data layer:** local-first (`localStorage` key `gullak.v2`). Sync uses a single shared jsonb document
(simpler than the relational schema in §3, which stays future hardening). `currentProfileId` is device-local.

**Run:** `npm install` then `npm run dev` (README has flags for locked-down machines).

---

## 7. Later / Hardening (post-v1)
- Replace the light passcode gate with **Supabase Auth** + per-user **RLS** for real privacy.
- Optional cross-profile "compete" view.
- Reminders/notifications for approaching deadlines.
- Move sensitive rules to Supabase **Edge Functions** if we ever open it up beyond family.
```
