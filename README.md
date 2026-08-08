# 🏆 Gullak — Milestone Reward Tracker

A minimal, warm, editorial dashboard where you and your brother set personal **milestones**
across categories (Push-ups, DSA, Weight…), each with a **cash reward (₹)**. Completing them
grows your **gullak** (savings). Includes weight & activity graphs and a Hall of Fame / Shame.

- **🌐 Live:** https://gullak-eosin.vercel.app · **Ops / infra / keys / resume steps:** [DEPLOYMENT.md](./DEPLOYMENT.md)
- **Spec:** [FEATURES.md](./FEATURES.md) · **Build/design notes:** [IMPLEMENTATION.md](./IMPLEMENTATION.md)
- **Stack:** React + TypeScript (Vite) · Tailwind · Recharts · optional Supabase · PWA

> The app is **local-first**: it runs fully on your device using `localStorage` with no backend.
> Add Supabase keys (below) to turn on **shared online sync** across devices.

---

## Run locally
```bash
npm install
npm run dev
# open the printed URL (default http://localhost:5173)
```
> On some locked-down machines you may need a writable npm cache and an explicit host:
> ```bash
> npm install --cache "$TMPDIR/npm-cache"
> npm run dev -- --host 127.0.0.1 --port 5173
> ```

Reset everything on a device by clearing the `gullak.v2` key in your browser's localStorage.

Other scripts: `npm run build` (production build → `dist/`), `npm run preview`, `npm run typecheck`.

---

## Deploy to Vercel
> ✅ **Already deployed & live:** https://gullak-eosin.vercel.app — repo `adiwish/gullak`, auto-deploys on
> every push to `main`. Full live details (Vercel project, Supabase, SSH, env keys, troubleshooting,
> resume checklist) are in **[DEPLOYMENT.md](./DEPLOYMENT.md)**. The steps below are the generic recipe.

1. Push this folder to a **GitHub** repo.
2. On **vercel.com** → **New Project** → import the repo. Framework preset: **Vite** (auto-detected).
3. Click **Deploy**. You get a live URL; every push to `main` redeploys.

`vercel.json` already adds the SPA fallback rewrite. No env vars are required for the local-first
version — it works immediately.

---

## Optional: shared online sync (Supabase)
Enable this so both of you see the same live data from any device.

1. Create a free project at **supabase.com**. Copy the **Project URL** and **anon public key**
   (Project Settings → API).
2. In the Supabase **SQL Editor**, run:
   ```sql
   create table gullak_documents (
     id text primary key,
     data jsonb not null default '{}'::jsonb,
     updated_at timestamptz default now()
   );

   alter table gullak_documents enable row level security;
   create policy "v1 open" on gullak_documents
     for all using (true) with check (true);

   -- live updates across devices
   alter publication supabase_realtime add table gullak_documents;
   ```
3. Add these environment variables — locally in `.env.local` (see `.env.example`) and in
   **Vercel → Project → Settings → Environment Variables**:
   ```
   VITE_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
   VITE_SUPABASE_ANON_KEY=YOUR-ANON-KEY
   ```
4. Redeploy. The app now loads/saves a single shared document and syncs in real time.

> **Security note:** the anon key ships in the browser and the passcode is a **light gate** only —
> fine for a family tool, not real multi-tenant security. Hardening (Supabase Auth + per-user RLS,
> or the relational schema in IMPLEMENTATION.md §3) is future work.

---

## Install on your phone (PWA)
Open the deployed URL on your phone → browser menu → **Add to Home Screen**. It installs as an
app with offline caching.
