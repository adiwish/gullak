# 🏆 Milestone Reward Tracker — Feature Specification (v1)

> **Status:** Requirements draft for review — this document is the source of truth.
> **Currency:** ₹ (INR); "k" = thousand. **Timezone:** local device time; a "day" ends at midnight.
> **Last updated:** 2026-08-08

---

## 0. Project Status & How to Continue
- **Phase:** Requirements complete (all open items resolved, §14) and **tech stack chosen**.
  See **[IMPLEMENTATION.md](./IMPLEMENTATION.md)** for the build plan, setup steps, and data model.
- **Stack:** React + TypeScript (Vite), Tailwind + shadcn/ui, Supabase (Postgres), Vercel hosting, PWA.
- **To resume in a new session:** read this file (§15 is the decision log) for *what* to build, then
  IMPLEMENTATION.md for *how*. Next action = start Phase 0 (scaffold) in IMPLEMENTATION.md §5.

---

## 1. Overview
A shared web dashboard where users set personal **milestones** across **categories**
(e.g. PushUp, PullUp, Squats, DSA, Videos). Each milestone carries a **cash reward (₹)**.
Completing milestones grows the user's **Reward balance** ("Gullak"). The app also tracks
daily weight and activity graphs and keeps a fun **Hall of Fame / Hall of Shame**.

## 2. Glossary
- **Profile** — a user account, protected by a passcode.
- **Metric** — any number logged once per day. A **milestone category** is a metric with milestones;
  a **plain metric** is tracked for graphs only.
- **Milestone** — a target within a category with a reward, a duration in weeks, and a start date.
- **Graph widget** — a user-created chart; each **line** is attached to a chosen metric.
- **Balance / Gullak** — the user's running reward total (never edited directly).

## 3. Profiles & Login
- On launch the app shows existing **profiles** plus a **"Create profile"** option (name + passcode).
- Selecting a profile and entering its **passcode** loads that profile's private data.
- The system supports **any number of users** (not limited to two).
- The device **remembers** the logged-in profile so the passcode isn't required every time; a **Logout** switches profiles.
- Data is stored **online** in a shared backend so profiles are reachable from any device.
- The passcode is a **light gate**, not strong security (no encryption in v1).

## 4. Metrics, Categories & Direction
- A **metric** is any named number the user logs **once per day** (re-entering a day **overwrites** it).
- Two kinds of metric:
  - **Milestone category** — a metric that also has an **ordered list of milestones** (rewards),
    e.g. "PushUp", "DSA".
  - **Plain metric** — tracked only for graphs, no milestones, e.g. "Weight", "Sleep hours".
    Can be added anytime (e.g. a future habit) even if it isn't part of any milestone.
- **Direction:** each metric is **higher-is-better** (default) or **lower-is-better**. This decides when a
  target is met (≥ target vs. ≤ target).
- Any metric (category or plain) can be **attached as a line** on any graph (see §9).

## 5. Milestones
Each milestone has:

| Field | Example | Notes |
|---|---|---|
| Target | 35 | the number to reach |
| Reward | ₹2,000 | paid on achieve |
| Duration | 1 week | whole weeks only (1, 2, 3…) |
| Start date | (optional) | defaults sensibly; can be **past or future** (see scheduling) |
| Status | Active | see lifecycle below |

**Statuses:** `Upcoming → Active → Achieved / Spilled / Surrendered`

### Scheduling (weeks-based)
- Every milestone has a **start date** and a **deadline = start date + its duration in weeks**.
- **Default start dates** (all overridable):
  - Milestone 1 defaults to the **category's start date** (which defaults to creation day).
  - Each **next** milestone defaults to starting when the **previous one completes**.
- **Flexible start:** the user can set a milestone (or the category) to start on **any date — past or
  future**. This covers "start it in a few days" and "I already started but forgot to add it".
- A milestone whose start date is **in the future** stays **Upcoming** (shown as "Starts on <date>")
  and becomes **Active** on that date.
- **Upcoming** milestones show a **projected deadline**, chained from the durations; these shift
  automatically when an earlier milestone moves, is reordered, or slips.
- **No-extra-time rule (lateness never helps):** for scheduling, a milestone's *effective completion
  date* = **min(action date, deadline)**.
  - Achieve **early** → the next milestone starts on the **achieve date** (you keep the time you saved).
  - Act **late / overdue** → treated as of the **deadline**, so the next cycle starts from the deadline,
    not from when you clicked. (Spill's new deadline = **min(today, deadline) + duration**.)
- If a deadline passes with no action, the milestone **stays Active**, shows a **"Needs action"**
  highlight, and waits until the user marks Achieved / Spill / Surrender.

## 6. Active, Upcoming & History Views
- **Active milestones** — shows **one per category** (the current one), each with
  **[Achieved] [Spill] [Surrender]** buttons. Overdue ones show a **"Needs action"** highlight.
- **Upcoming milestones** — shows the **next one per category**, with its projected deadline.
- **History (bottom):** **Achieved** and **Surrendered** items move to the **bottom** to keep the
  history. **Surrendered** categories are shown **greyed out**.

## 7. Milestone Actions & Money Rules

### ✅ Achieved
- Adds the **full reward** to the balance.
- The **next** milestone activates on the **effective completion date** = min(today, deadline)
  (see the no-extra-time rule in §5).
- Contributes to the **Hall of Fame**.
- **Auto-offer:** when the day's entered value **meets the target** (≥ target for higher-is-better
  metrics, ≤ target for lower-is-better — see §4), the app **highlights** the milestone and **asks the
  user to confirm** "Achieved" (it never auto-completes).

### 💧 Spill (missed / retry)
- **Immediately subtracts half the milestone's reward** from the balance.
- The milestone **keeps its full reward** (the target is unchanged).
- The deadline **resets to min(today, deadline) + its duration** — a fresh cycle to retry, with **no
  extra time for lateness** (see §5).
- Can be repeated; each spill deducts another half-reward.
- **Example:** reward ₹4k, balance ₹10k → spill → −₹2k → **₹8k**; spill again → **₹6k**.
  Later achieving it adds the **full ₹4k**.

### 🏳️ Surrender
- The user gives up. **Closes the entire category** — all remaining milestones are cancelled.
- Contributes to the **Hall of Shame**.

## 8. Reward Balance & Withdraw
- Each profile has a running **balance**, starting at **₹0**. It changes **only** through Achieve
  (+reward), Spill (−½ reward), and Withdraw (−amount) — it is **never directly editable**.
- The balance **can go negative** ("in the red") due to spills.
- **Withdraw** subtracts an amount (with a note) when the user spends money; kept in a
  **withdrawal history** (date, amount, note).
- **Guardrail (no overdraft):** you **cannot withdraw more than your current balance** — just like a
  bank. Withdrawals are blocked when the balance is 0 or negative.

## 9. Graphs (widgets)
- The user can **create multiple graph widgets** (not just weight & activity) — e.g. add one for a
  **future habit** at any time.
- Each widget holds one or more **lines**; the user **attaches each line to a chosen metric** — any
  milestone category **or** a plain metric, **including metrics that aren't part of any milestone**.
- A metric does **not** automatically get a line; the user picks which metrics a widget plots.
- **Visibility controls:** toggle **each line** on/off, and **hide/show the whole widget**.
- Widgets can be **created, edited, and deleted**.
- **Defaults shipped:** a **Weight** widget (kg) and an **Activity** widget — both editable like any other.

## 10. Hall of Fame / Hall of Shame
- **Hall of Fame** — top **2–3 achieved** milestones, auto-ranked by reward value.
- **Hall of Shame** — top **2–3 surrendered** milestones, auto-ranked by reward value.

## 11. Editing (full flexibility)
- Milestones: **edit** (target / reward / duration / start date), **delete**, **reorder**, **insert** in the
  middle. Reordering **recomputes projected dates** automatically.
- Categories, metrics, and graph widgets: **edit** and **delete**.
- Everything is editable **except the Reward balance** — the total can never be edited by hand; it
  only moves via Achieve / Spill / Withdraw (see §8).

## 12. Worked Example
Create category **"PushUp"** on **Aug 8**:
- M1: 35 reps, ₹2k, 1 week → deadline **Aug 15** (Active)
- M2: 45 reps, ₹3k, 2 weeks → projected **Aug 29** (Upcoming)
- M3: 55 reps, ₹4k, 2 weeks → projected **Sep 12** (Upcoming)

On **Aug 12** the user logs **35** pushups → app highlights M1 → user confirms **Achieved**
→ balance **+₹2k = ₹2k**. M2 activates Aug 12, deadline **Aug 26**, and M3's projection shifts earlier accordingly.

## 13. Out of Scope (v1)
- No reminders / notifications.
- No encryption or real authentication.
- No native mobile app (responsive web is fine).
- Profiles are private — no cross-profile viewing/comparison.

## 14. Resolved Items (were open)
1. **Overdue styling** → a **"Needs action"** highlight; lateness gives **no extra time** (§5).
2. **Metric direction** → mostly **higher-is-better**, but each metric can be **lower-is-better** (§4).
3. **Reorder + projected dates** → **recompute automatically** (§11).
4. **Withdraw guardrail** → **no overdraft**; can't withdraw more than the balance (§8).
5. **History** → **Achieved & Surrendered** move to the **bottom**; surrendered are **greyed** (§6).

## 15. Decision Log (agreed)
- Milestones use **duration in weeks** plus a **flexible start date** (past or future); default start =
  category start / previous completion.
- **No-extra-time rule:** effective completion date = **min(action date, deadline)**; lateness never
  extends the schedule.
- **Spill** = immediate **−½ reward** from balance; milestone keeps full reward; deadline resets to
  **min(today, deadline) + weeks**; repeatable.
- **Reward accounting** = penalties hit balance immediately; balance can go **negative**; the balance
  is **never directly editable**; **withdrawals cannot overdraft**.
- **Achieve after spills** = full original reward is still added.
- **Overdue** = stays Active with a **"Needs action"** highlight until the user acts.
- **Metrics** have a **direction** (higher/lower-is-better); **plain (non-milestone) metrics** are allowed.
- **Graphs** = user-created **widgets**; each line is **attached to a chosen metric**; per-line and
  per-widget visibility toggles.
- **Graph ↔ milestone** = linked; reaching the target **auto-offers** Achieved (user confirms).
- **Surrender** = closes the whole category.
- **History** = **Achieved & Surrendered** items move to the bottom; surrendered greyed.
- **Fame/Shame** = auto-ranked by reward value.
- **Accounts** = multi-profile (create name + passcode at runtime); remembered on device.
- **Weight** = tracking only; **daily values** = one editable value/day/metric (overwrite).
- **Editing** = full CRUD (milestones, categories, metrics, graph widgets); balance excluded.
