# 📓 Gullak — Project Overview & Handoff

A detailed, self-contained summary of everything built so far, so any new session (or person)
can continue confidently. Companion to the other docs:

| Doc | Purpose |
|---|---|
| [FEATURES.md](./FEATURES.md) | **What** to build — product requirements + decision log (source of truth) |
| [IMPLEMENTATION.md](./IMPLEMENTATION.md) | **How** — tech stack, design system, DB schema, build phases |
| [README.md](./README.md) | Run + **deploy** instructions (Vercel + optional Supabase) |
| [DEPLOYMENT.md](./DEPLOYMENT.md) | **Live ops/infra:** URLs, GitHub, SSH, Vercel, Supabase, keys, resume steps |
| **PROJECT_OVERVIEW.md** (this file) | Detailed handoff: architecture, file-by-file, logic, caveats |

---

## 1. What this is
**Gullak** is a minimal, warm, editorial web dashboard where a small group (originally two brothers)
set personal **milestones** in **categories** (Push-ups, DSA, Weight, …). Each milestone has a
**cash reward (₹)**; completing it grows a savings balance (the "gullak"). It also tracks daily
weight/activity graphs and a fun **Hall of Fame / Hall of Shame**.

The full behaviour (spill/surrender rules, scheduling, money math) is specified in **FEATURES.md**;
this doc focuses on the code.

## 2. Current status
- **v1.0 — LIVE in production.** Hosted on Vercel at **https://gullak-eosin.vercel.app** with **Supabase
  shared-sync enabled and verified**. All live infra/keys/resume steps are in [DEPLOYMENT.md](./DEPLOYMENT.md).
- **v1.0 — complete and deployable.** Typecheck + production build pass; PWA service worker builds.
- **Starts empty:** no demo profiles or data. First run shows the login screen in "create profile" mode.
- **Local-first** by default (works with zero backend). **Optional Supabase** sync turns on when env vars are set.
- Verified in the browser: login gate → dashboard → dialogs; achieve/spill/surrender money loop.

## 3. Tech stack
- **React 18 + TypeScript**, bundled with **Vite 5** (SPA — no server).
- **Tailwind CSS** with CSS-variable design tokens (light + warm-dark). Hand-rolled shadcn-style UI primitives.
- **Recharts** for the line charts.
- **Fonts:** Fraunces (display, sparingly), Inter (UI), JetBrains Mono (money) via `@fontsource-variable/*`.
- **lucide-react** icons.
- **vite-plugin-pwa** (installable + offline).
- **@supabase/supabase-js** for the optional shared-sync layer.

## 4. Run / build / deploy
```bash
npm install
npm run dev        # local dev server
npm run build      # production build -> dist/  (also emits PWA sw.js)
npm run typecheck  # tsc --noEmit
npm run preview    # preview the production build
```
Locked-down machines (sandbox): `npm install --cache "$TMPDIR/npm-cache"` and
`npm run dev -- --host 127.0.0.1 --port 5173`.
**Deploy:** push to GitHub → import on Vercel (Vite preset) → deploy. See README for the optional
Supabase setup (SQL + env vars).

## 5. Repository map
```
Tracker/
├─ FEATURES.md · IMPLEMENTATION.md · README.md · PROJECT_OVERVIEW.md
├─ index.html                 # SVG favicon, theme-color, root div
├─ vite.config.ts             # React + PWA plugin + '@' alias -> src
├─ tailwind.config.js         # token->color mapping, fonts, radius
├─ postcss.config.js · tsconfig.json · vercel.json (SPA rewrite)
├─ .env.example               # VITE_SUPABASE_URL / _ANON_KEY (optional)
├─ public/icon.svg            # PWA / favicon icon
└─ src/
   ├─ main.tsx                # Theme → Store → Auth providers, mounts <App/>
   ├─ App.tsx                 # shows <LoginScreen/> or <Dashboard/> based on auth
   ├─ index.css               # font @imports, Tailwind layers, :root/.dark tokens
   ├─ types.ts                # all domain types (see §6)
   ├─ theme/ThemeProvider.tsx # light/dark, persisted to localStorage 'gullak.theme'
   ├─ auth/AuthProvider.tsx   # device-local login (localStorage 'gullak.auth')
   ├─ lib/
   │  ├─ utils.ts             # cn() classnames + uid()
   │  ├─ date.ts              # todayISO, addWeeksISO/addDaysISO, minISO, isOverdue
   │  ├─ money.ts             # balanceOf (ledger sum), spillPenalty, canWithdraw
   │  ├─ format.ts            # formatRupees, formatDate
   │  └─ supabase.ts          # client (or null), isRemote flag, doc constants
   ├─ data/seed.ts            # CHART_COLORS + buildSeed() (currently EMPTY state)
   ├─ store/
   │  ├─ StoreContext.tsx     # the whole data store + actions + persistence + sync
   │  ├─ selectors.ts         # derived reads (active/upcoming/fame/shame/history…)
   │  └─ remote.ts            # optional Supabase load/save/subscribe (whole-doc)
   └─ components/
      ├─ Dashboard.tsx        # composes the page + owns dialog state
      ├─ Header.tsx           # wordmark, Log today, theme toggle, name, logout
      ├─ LoginScreen.tsx      # profile pick + passcode OR create profile
      ├─ HallOfFameShame.tsx · RewardCard.tsx · GraphWidgetCard.tsx
      ├─ ActiveMilestones.tsx · MilestoneRow.tsx · UpcomingList.tsx · HistoryList.tsx
      ├─ Section.tsx          # small uppercase section label
      ├─ CategoryDialog.tsx   # create/edit a goal (metric + milestones)
      ├─ WidgetDialog.tsx     # create/edit a graph (title + metric lines)
      ├─ DailyLogModal.tsx    # enter today's value for every metric
      └─ ui/                  # button, card, badge, input, label, select, modal
```

## 6. Data model (`src/types.ts`)
- **Profile**: `{ id, name, passcode? }`.
- **Metric**: a tracked number. `kind: 'category' | 'plain'` (category has milestones; plain is graph-only),
  `direction: 'higher' | 'lower'`, `unit?`, `startDate?`, `status: 'active' | 'surrendered' | 'completed'`, `sortOrder`.
- **Milestone**: `{ metricId, seq, target, reward, durationWeeks, startDate?, status, spillCount, activatedOn?, deadline?, completedOn? }`;
  `status: 'upcoming' | 'active' | 'achieved' | 'surrendered'`.
- **DailyLog**: `{ metricId, date, value }` — one per metric per day (upsert overwrites).
- **Transaction** (ledger): `{ profileId, type: 'achieve' | 'spill' | 'withdraw', amount(signed), milestoneId?, note?, createdAt }`.
- **GraphWidget**: `{ profileId, title, visible, sortOrder, lines: GraphLine[] }`; **GraphLine**: `{ metricId, color?, visible }`.
- **AppData**: everything above + `currentProfileId?` (device-local, not synced).

## 7. Core logic
- **Balance** is never stored/edited directly — it is the **sum of the transactions ledger** (`money.ts#balanceOf`).
- **Scheduling (weeks-based):** deadline = `activatedOn + durationWeeks`. First milestone activates on the
  category start date; each next activates when the previous completes.
- **No-extra-time rule:** effective completion date = `min(today, deadline)` (`date.ts#minISO`), so acting late never buys time.
- **Achieve:** `+reward` ledger txn; milestone → `achieved` with `completedOn`; next milestone activates from the
  effective completion date; if none left, the metric becomes `completed`.
- **Spill:** immediate `-reward/2` ledger txn; `spillCount++`; deadline resets to `min(today, deadline) + durationWeeks`. Balance may go negative.
- **Surrender:** milestone → `surrendered`; **the whole category (metric) closes**.
- **Overdue:** if `today > deadline` and still active, the row shows a **"Needs action"** badge (no auto-action).
- **Auto-offer:** when today's logged value meets the target (`>=` for higher-is-better, `<=` for lower), the row shows
  **"Target reached"** — you still confirm via the Achieved button.
- **Hall of Fame/Shame:** auto-ranked by reward (achieved vs surrendered), top 3 (`selectors.ts`).
- **Withdraw:** blocked when amount ≤ 0 or > current balance (`money.ts#canWithdraw`) — no overdraft.

## 8. Data layer & persistence
- Single source of truth: **`store/StoreContext.tsx`** (`useState<AppData>` + action functions in a `useMemo`).
- **Local-first:** persisted to `localStorage['gullak.v2']` on every change. `buildSeed()` returns EMPTY state.
- **Optional shared sync (`store/remote.ts` + `lib/supabase.ts`):** enabled only when `VITE_SUPABASE_URL` and
  `VITE_SUPABASE_ANON_KEY` exist. Stores the whole app document as JSON in a `gullak_documents` table
  (id = `'shared'`) and subscribes to realtime. `currentProfileId` is stripped before saving (device-local).
  A `lastSync` ref + JSON compare prevents echo/save loops; writes are debounced ~600ms.
- **Storage keys:** `gullak.v2` (data), `gullak.auth` (logged-in profile id), `gullak.theme` (light/dark).

## 9. Auth model
- **Light gate**, not real security (documented everywhere). `auth/AuthProvider.tsx` keeps the logged-in
  profile id in `localStorage['gullak.auth']` so it isn't asked every time. `App.tsx` renders `LoginScreen`
  until authed. Passcodes compared in plaintext locally (would be hashed in a real backend).

## 10. Design system & layout
- Warm palette: cream `#F0EAD9` / ink `#1C1A15` / olive accent `#7E7A46` (dark: espresso/cream/olive).
  Tokens live in `src/index.css` (`:root` + `.dark`) and map to Tailwind colors in `tailwind.config.js`.
- Fraunces only for the wordmark/headings; Inter for UI; JetBrains Mono for money.
- Dashboard order (`Dashboard.tsx`): Header → Hall of Fame|Shame → Weight|Reward → Progress chart(s) →
  **Active milestones (stacked vertically)** → Upcoming → History. 2-col on desktop, 1-col on mobile.

## 11. Known caveats / to verify
- **Supabase sync is untested live** (no credentials in the build environment). The code is guarded and
  local-first is unaffected, but do a real check after adding keys (see README §"Optional").
- **PWA icon** is an SVG (`public/icon.svg`). Installability is solid on modern Chromium/Safari; if you want
  guaranteed coverage everywhere, add 192/512 PNGs and reference them in `vite.config.ts` manifest.
- **Bundle size** ~800 kB (Recharts + Supabase). Fine for now; could code-split later.
- Passcode is a **light gate** only.

## 12. Suggested next steps / backlog
- Add an in-app **"Reset data"** / export-import (JSON) control.
- **Verify + polish Supabase** sync; consider the relational schema in IMPLEMENTATION.md §3 for real multi-user.
- Optional **reminders/notifications** for approaching deadlines.
- Optional **cross-profile "compete" view**.
- Consider raster PWA icons and code-splitting.
- Add automated tests around `store` logic (scheduling/money) if the rules grow.
