# 🚀 Gullak — Deployment, Infra & Handoff (Live Ops)

> **Read this first when resuming in a new session.** It captures the *live* hosting setup —
> URLs, GitHub, SSH, Vercel, Supabase, keys, and the gotchas we hit — so you can pick up instantly.
>
> Companion docs: [FEATURES.md](./FEATURES.md) (what) · [IMPLEMENTATION.md](./IMPLEMENTATION.md) (how) ·
> [PROJECT_OVERVIEW.md](./PROJECT_OVERVIEW.md) (code handoff) · [README.md](./README.md) (run/deploy).
>
> **Status:** ✅ **LIVE in production with Supabase shared-sync enabled and verified.**
> **Last updated:** 2026-08-08 · **Private repo — for personal reference only.**

---

## 0. TL;DR — quick resume
| Thing | Value |
|---|---|
| 🌐 Live app | **https://gullak-eosin.vercel.app** |
| 📦 GitHub repo | **git@github.com:adiwish/gullak.git** (private, branch `main`) |
| ▲ Vercel project | `gullak` (scope: `aditya-barnwals-projects`) — auto-deploys on push to `main` |
| 🟢 Supabase project | ref `eyffsdwvlosonfwyuxqi` → `https://eyffsdwvlosonfwyuxqi.supabase.co` |
| 🖥️ Local dev | `npm install && npm run dev` (uses `.env.local`, already created) |
| 🚢 Deploy | `git push origin main` → Vercel rebuilds automatically |

**Golden rule:** env vars are **build-time** (Vite). After changing any `VITE_*` var in Vercel,
you **must redeploy** for it to take effect.

---

## 1. Live URLs
- **Production (use this):** https://gullak-eosin.vercel.app
- **Git/main alias:** https://gullak-git-main-aditya-barnwals-projects.vercel.app
  *(may be gated by Vercel's deployment-protection login — the `-eosin` alias is the public one)*

---

## 2. Accounts & ownership
Everything is under **one GitHub identity** (single sign-on into Vercel & Supabase):
- **GitHub:** `adiwish` · email `adityabarnwal16@gmail.com`
- **Vercel:** logged in via GitHub · team/scope `aditya-barnwals-projects`
- **Supabase:** logged in via GitHub · org "adiwish's Org" (Free tier)

> Account **passwords are NOT stored here** (I never handle them). Fill in yourself if you want — see §7.

---

## 3. GitHub repo & git identity
- **Repo:** https://github.com/adiwish/gullak (private)
- **Remote (SSH):** `git@github.com:adiwish/gullak.git`
- **Default branch:** `main`
- **Repo-local git identity** (set via `git config` inside the repo, not global):
  - `user.name  = adiwish`
  - `user.email = adityabarnwal16@gmail.com`

Set again if cloning fresh:
```bash
git config user.name  "adiwish"
git config user.email "adityabarnwal16@gmail.com"
```

---

## 4. SSH setup — personal GitHub vs company GitLab (IMPORTANT)
This machine has a **company GitLab** SSH key. We created a **separate key for personal GitHub** so
the two never mix. Routing is handled by `~/.ssh/config`.

| Host | Key file | Purpose |
|---|---|---|
| `gitlab.phonepe.com` | `~/.ssh/id_ed25519` | Company GitLab (untouched) |
| `github.com` | `~/.ssh/id_ed25519_github` | Personal GitHub (this project) |

`~/.ssh/config` contains:
```
Host gitlab.phonepe.com
  AddKeysToAgent yes
  UseKeychain yes
  IdentityFile ~/.ssh/id_ed25519

Host github.com
  HostName github.com
  User git
  IdentityFile ~/.ssh/id_ed25519_github
  IdentitiesOnly yes
```

**Personal GitHub public key** (safe to share; already added to GitHub → Settings → SSH keys):
```
ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIErw0E7iiuG8NEcAv6fMs4l2sNBm681fY6rtKPbZd4ak adityabarnwal16@gmail.com
```
- The **private** key `~/.ssh/id_ed25519_github` stays on the machine — **never commit it**.
- Test auth: `ssh -T git@github.com` → should say `Hi adiwish! You've successfully authenticated`.
- If setting up a new machine: `ssh-keygen -t ed25519 -C "adityabarnwal16@gmail.com" -f ~/.ssh/id_ed25519_github -N ""`,
  add the new `.pub` to GitHub, and recreate the `~/.ssh/config` `github.com` block above.

---

## 5. Vercel
- **Project:** `gullak` · **Scope:** `aditya-barnwals-projects`
- **Framework preset:** Vite · **Build:** `npm run build` · **Output:** `dist`
- **Auto-deploy:** every push to `main` triggers a production build (GitHub integration).
- **SPA rewrite:** handled by `vercel.json`.
- **Environment variables** live in **Settings → Environment Variables** and MUST be enabled for the
  **Production** environment (see §8). They are compiled into the bundle at build time.
- **Force a clean rebuild:** `git commit --allow-empty -m "chore: rebuild" && git push origin main`,
  or Vercel → Deployments → ⋯ → **Redeploy** (uncheck "Use existing Build Cache" if in doubt).

---

## 6. Supabase (shared online sync)
- **Project ref:** `eyffsdwvlosonfwyuxqi`
- **Project URL:** `https://eyffsdwvlosonfwyuxqi.supabase.co`
  *(found under Settings → Data API, or click the green **Connect** button)*
- **Region:** South Asia (Mumbai) recommended — confirm in dashboard.
- **How the app uses it** (`src/lib/supabase.ts` + `src/store/remote.ts`): a single shared JSON
  document — one row, `id = 'shared'`, whole `AppData` stored in a `jsonb` column; realtime keeps
  devices in sync. `currentProfileId` is stripped before saving (device-local).

**Schema** (already run in SQL Editor — here for re-creation):
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
> RLS is intentionally **open** ("v1 open") — the documented **light gate**. Anyone with the URL +
> anon key can read/write the shared doc. Fine for a private family tool; not hardened multi-tenant auth.

---

## 7. Credentials & keys
> The repo is **private / personal only**, so live values are stored here for convenience.

### ✅ Stored (safe — publishable / already public in the browser bundle)
| Key | Value |
|---|---|
| Supabase Project URL | `https://eyffsdwvlosonfwyuxqi.supabase.co` |
| Supabase **anon** (public/legacy) key — **used by the app** | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5ZmZzZHd2bG9zb25md3l1eHFpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYxOTIwOTYsImV4cCI6MjEwMTc2ODA5Nn0.1_S2DPRXrzOatXDTeWM7bYDSYRovjQ4j7hXGYYrzcCA` |

> This is the **anon** key (role `anon`, expires ~2036). It is *designed* to ship in the browser, and
> it's already retrievable from the deployed JS bundle — so keeping it here adds no real exposure.
> On the new Supabase dashboard this lives under **Settings → API Keys → Legacy anon, service_role**.
> The newer `sb_publishable_...` key would also work, but the app is wired for this legacy anon key.

### 🚫 NOT stored (real secrets — fill in yourself if you want; I never handle these)
| Secret | Where to get it | Value |
|---|---|---|
| Supabase **DB password** | You set it when creating the project | `<fill in yourself — not stored>` |
| Supabase **service_role / `sb_secret_...`** key | Dashboard → Settings → API Keys | `<never put in browser/frontend>` |
| GitHub / Vercel / Supabase account logins | Your password manager | `<fill in yourself — not stored>` |

> ⚠️ Never put the **service_role**/secret key in the frontend or any `VITE_*` var — it bypasses RLS.

---

## 8. Environment variables
Same two vars in **both** places. Names must be **exact** (Vite only exposes `VITE_`-prefixed vars).

| Name | Value |
|---|---|
| `VITE_SUPABASE_URL` | `https://eyffsdwvlosonfwyuxqi.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | the anon key from §7 |

- **Vercel:** Settings → Environment Variables → add both → tick **Production** (also Preview/Development) → **redeploy**.
- **Local:** `.env.local` (git-ignored) already exists in the repo root with both values, so `npm run dev` syncs too.
  Recreate it by copying `.env.example` → `.env.local` and pasting the values.

---

## 9. Common commands
```bash
npm install            # install deps
npm run dev            # local dev server (reads .env.local)
npm run build          # production build -> dist/ (also emits PWA sw.js)
npm run typecheck      # tsc --noEmit
npm run preview        # preview the production build

git push origin main   # deploy (Vercel auto-builds)
git commit --allow-empty -m "chore: rebuild" && git push origin main   # force clean rebuild
```

---

## 10. Health-check / verification (copy-paste)
Read the Supabase keys from `.env.local`, then hit the REST API and the live bundle.
```bash
set -a && source ./.env.local && set +a

# 1) Supabase API reachable + table + RLS OK (expect HTTP 200 and a JSON array)
curl -s -w "\n-> HTTP %{http_code}\n" \
  "$VITE_SUPABASE_URL/rest/v1/gullak_documents?select=id,updated_at" \
  -H "apikey: $VITE_SUPABASE_ANON_KEY" -H "Authorization: Bearer $VITE_SUPABASE_ANON_KEY"

# 2) Are the keys baked into the LIVE bundle? (expect occurrences: 1)
BASE="https://gullak-eosin.vercel.app"
ASSET=$(curl -s "$BASE/" | grep -oE '/assets/index-[^"]+\.js' | head -1)
curl -s "$BASE$ASSET" | grep -o 'eyffsdwvlosonfwyuxqi' | wc -l
```
> Real-world sync test: open the app on two devices/browsers, create a profile + milestone on one,
> confirm it appears on the other.

---

## 11. Troubleshooting & gotchas (learned this session)
- **Env var on Preview only → sync dead in prod.** The classic bug we hit: `VITE_*` vars were added
  to *Preview* only. They must be enabled for **Production**, then **redeploy**.
- **Vite bakes env at build time.** Changing a var in Vercel does nothing until a **new build**. If the
  live JS asset hash (`/assets/index-XXXX.js`) doesn't change after a var edit, the build didn't pick it
  up (identical bundle = env not seen). Push an empty commit to force a fresh build.
- **CDN cache:** `X-Vercel-Cache: HIT` can serve a cached `index.html`; a new deploy purges it. The
  content-hashed asset name is the source of truth — if it changed, the build changed.
- **SSH in restricted shells:** operations touching `~/.ssh` (keygen, `known_hosts`, push) need full
  filesystem access; if a tool sandbox blocks them you'll see `Operation not permitted` / `Permission
  denied (publickey)` — run them in a normal terminal.
- **Use the `github.com` host** (not a raw IP) so `~/.ssh/config` routes to the personal key.

---

## 12. Resume checklist for a brand-new session
1. `cd` into the repo · `npm install`.
2. Confirm `.env.local` exists with the two `VITE_SUPABASE_*` vars (recreate from §8 if missing).
3. `npm run dev` → app should load with sync on.
4. `ssh -T git@github.com` → expect `Hi adiwish!`. If not, redo the SSH steps in §4.
5. Make changes → `git push origin main` → Vercel auto-deploys → verify with §10.
