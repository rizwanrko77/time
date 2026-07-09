<USER_REQUEST>
# Time Allocation & Availability Tool â€” Implementation Plan

A production tool (no mocks) for tracking where a user spends their hours and publishing an embeddable availability page. Built for a single primary user but with clean multi-user auth so anyone can register.

---

## 1. Product summary

The user registers, then adds **items** (called "Where" â€” tasks, clients, life, family) and assigns hours to each. Two kinds of items:

- **Assumed spent** â€” no timer. Spent always equals allocated. No completion rate. Cannot be freed for others (e.g. sleep, family).
- **Manual track** â€” has a Start/Stop timer stored in the DB so it works across devices. Real spent hours are measured; a completion rate is shown.

From capacity (168h/week or 720h/month via simple 30-day math), the tool computes:

- **Comfortably available** = capacity âˆ’ sum of all allocated hours.
- **Potentially available** = comfortably available + allocated hours of items whose notice period is exactly 0 days.

The user gets a private dashboard. Visitors get a **read-only, server-rendered public page** at `/{slug}` designed to be embedded via iframe. The public page shows a table (Where / Allocated / Completion / Notice), the two availability figures with info tooltips, and a CTA block.

---

## 2. Core rules (authoritative â€” do not deviate)

### 2.1 Unit of storage
Every allocation is stored as **hours per week** (`float`). All other periods are derived.

Input conversion (on the create/edit form only):
- Daily input `h` â†’ store `h * 7`
- Weekly input `h` â†’ store `h`
- Monthly input `h` â†’ store `h / 30 * 7`

Display conversion (from stored weekly value `w`):
- Weekly view â†’ `w`
- Monthly view â†’ `w / 7 * 30`
- (Daily is never shown in tables; it exists only as a create-form input.)

Round displayed hours to 1 decimal.

### 2.2 Capacity
- Weekly capacity = **168** hours.
- Monthly capacity = **720** hours (30 days Ã— 24). Use these constants; do not use calendar-accurate months.

### 2.3 Availability math (per selected view)
```
allocated_total   = Î£ item.allocated_hours          (all items, converted to view)
comfortably_avail = capacity - allocated_total
potentially_avail = comfortably_avail + Î£ allocated_hours WHERE notice_period_days = 0
```
- `comfortably_avail` may be negative if the user over-allocates; clamp display at 0 but keep the real number available for the dashboard (show a warning if negative).
- Notice period: integer days. `0` = free at will (counts toward potential). `NULL` = N/A (locked / assumed-spent, never counts). Any positive integer = real notice (excluded from potential).

### 2.4 Completion rate (manual_track only)
```
completion_pct = round( spent_hours_in_period / allocated_hours_in_period * 100 )
```
- Assumed-spent items show `â€”` (em dash), never a percentage.
- May exceed 100%. Display a bar that can overflow past 100%.
- If allocated is 0, show `â€”` (avoid divide-by-zero).

### 2.5 Spent-hours computation (manual_track)
`spent = Î£ (stopped_at âˆ’ started_at)` over completed entries. **The public page counts only completed entries** (never live/running time). The private dashboard MAY add live elapsed time for a running entry, computed client-side for display only â€” never written to the DB until Stop.

"In a period" for the manual tracker: the tool tracks **cumulative spent vs. a weekly/monthly allocation**. For v1, compute spent within a rolling window:
- Weekly view â†’ entries with `started_at >= now() - interval '7 days'`
- Monthly view â†’ entries with `started_at >= now() - interval '30 days'`

(This keeps the completion rate meaningful against the weekly/monthly allocation without needing calendar-boundary bookkeeping. Document this clearly in the UI: "last 7 / 30 days".)

### 2.6 Timezone
None. Store all timestamps as `timestamptz` in UTC. The tool only ever computes and displays **durations**, never wall-clock time-of-day.

---

## 3. Tech stack

- **Next.js (App Router, TypeScript)** deployed on **Vercel** (free tier).
- **Supabase**: Postgres + Auth (email/password) + Row Level Security. Free tier.
- **Styling**: Tailwind CSS. No component library required; keep it lightweight.
- **Data access**:
  - Dashboard (authenticated) â†’ Supabase client with the logged-in user's session; RLS enforces ownership.
  - Public page â†’ **server-rendered** Next.js route calling a `SECURITY DEFINER` Postgres function via the Supabase **service role key** (server-side only, never exposed to the browser). Returns only the safe, computed summary.
- **No mock data anywhere.** Every screen reads/writes real Postgres rows.

### 3.1 Environment variables
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=      # server-only, used by the public page route
```
The service role key must never be imported into a client component. Only use it inside route handlers / server components under `app/[slug]`.

---

## 4. Database schema

Run as Supabase migrations. Auth users live in `auth.users` (managed by Supabase). We add a `profiles` table keyed to the auth user.

```sql
-- 4.1 profiles: one per auth user
create table public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  slug          text unique not null,          -- used in /{slug} public URL
  display_name  text not null default '',
  page_title    text not null default '',
  page_desc     text not null default '',
  default_view  text not null default 'week'   -- 'week' | 'month'
                 check (default_view in ('week','month')),
  is_public     boolean not null default true,
  created_at    timestamptz not null default now()
);

-- 4.2 cta: one CTA block per profile (nullable fields)
create table public.cta (
  user_id      uuid primary key references public.profiles(id) on delete cascade,
  title        text,
  description  text,
  url          text
);

-- 4.3 items: the "Where" rows
create table public.items (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references public.profiles(id) on delete cascade,
  title               text not null,              -- freeform: "Client 1", "Apple", "Family"
  link                text,                        -- optional; makes title a hyperlink
  allocated_hours     double precision not null,   -- STORED AS HOURS/WEEK
  tracking_mode       text not null
                       check (tracking_mode in ('assumed_spent','manual_track')),
  notice_period_days  integer,                     -- 0 = at will, NULL = N/A, >0 = notice
  sort_order          integer not null default 0,
  is_active           boolean not null default true,
  created_at          timestamptz not null default now()
);
create index items_user_idx on public.items(user_id);

-- 4.4 time_entries: only for manual_track items
create table public.time_entries (
  id          uuid primary key default gen_random_uuid(),
  item_id     uuid not null references public.items(id) on delete cascade,
  user_id     uuid not null references public.profiles(id) on delete cascade,
  started_at  timestamptz not null default now(),
  stopped_at  timestamptz,                         -- NULL = running
  created_at  timestamptz not null default now()
);
create index time_entries_item_idx on public.time_entries(item_id);
-- Enforce at most one running entry per item (prevents double-start across devices)
create unique index one_running_per_item
  on public.time_entries(item_id) where (stopped_at is null);
```

### 4.1 Constraint notes
- `one_running_per_item` partial unique index is the cross-device safety guard: a second Start on an already-running item fails at the DB level.
- `assumed_spent` items must always have `notice_period_days = NULL`. Enforce in application logic (and optionally a CHECK: `tracking_mode = 'assumed_spent' â†’ notice_period_days is null`). Add:
```sql
alter table public.items add constraint assumed_has_no_notice
  check (tracking_mode <> 'assumed_spent' or notice_period_days is null);
```

---

## 5. Row Level Security

```sql
alter table public.profiles     enable row level security;
alter table public.cta          enable row level security;
alter table public.items        enable row level security;
alter table public.time_entries enable row level security;

-- profiles: owner full access
create policy "own profile" on public.profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

-- cta / items / time_entries: owner full access
create policy "own cta" on public.cta
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own items" on public.items
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own entries" on public.time_entries
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
```

The public page does **not** read these tables directly under RLS. It calls the function in Â§6, which runs `security definer` and returns only safe fields. No public SELECT policy is granted on raw tables.

---

## 6. Public summary function

A single `security definer` function returns everything the public page needs, already computed. It respects `is_public`.

```sql
create or replace function public.get_public_summary(p_slug text, p_view text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_profile   profiles%rowtype;
  v_capacity  double precision;
  v_factor    double precision;   -- weeklyâ†’view multiplier
  v_window    interval;
  v_items     jsonb;
  v_alloc_tot double precision;
  v_potential double precision;
  v_cta       jsonb;
begin
  select * into v_profile from profiles where slug = p_slug;
  if not found or v_profile.is_public = false then
    return null;
  end if;

  if p_view = 'month' then
    v_capacity := 720; v_factor := 30.0/7.0; v_window := interval '30 days';
  else
    v_capacity := 168; v_factor := 1.0;      v_window := interval '7 days';
  end if;

  -- Build per-item rows with allocated (in view units) and completion.
  with base as (
    select
      i.id, i.title, i.link, i.tracking_mode, i.notice_period_days,
      i.allocated_hours * v_factor as alloc_view,
      case when i.tracking_mode = 'manual_track' and i.allocated_hours > 0 then
        coalesce((
          select sum(extract(epoch from (te.stopped_at - te.started_at)))/3600.0
          from time_entries te
          where te.item_id = i.id
            and te.stopped_at is not null
            and te.started_at >= now() - v_window
        ), 0)
      else null end as spent_view
    from items i
    where i.user_id = v_profile.id and i.is_active = true
    order by i.sort_order, i.created_at
  )
  select
    jsonb_agg(jsonb_build_object(
      'title', title,
      'link', link,
      'allocated', round(alloc_view::numeric, 1),
      'notice_days', notice_period_days,
      'completion', case
        when tracking_mode = 'manual_track' and alloc_view > 0
          then round((spent_view / alloc_view * 100)::numeric, 0)
        else null end
    )),
    coalesce(sum(alloc_view), 0),
    coalesce(sum(alloc_view) filter (where notice_period_days = 0), 0)
  into v_items, v_alloc_tot, v_potential
  from base;

  select jsonb_build_object('title', title, 'description', description, 'url', url)
    into v_cta from cta where user_id = v_profile.id;

  return jsonb_build_object(
    'display_name', v_profile.display_name,
    'page_title',   v_profile.page_title,
    'page_desc',    v_profile.page_desc,
    'view',         case when p_view = 'month' then 'month' else 'week' end,
    'capacity',     v_capacity,
    'items',        coalesce(v_items, '[]'::jsonb),
    'comfortable',  round(greatest(v_capacity - v_alloc_tot, 0)::numeric, 1),
    'potential',    round(greatest(v_capacity - v_alloc_tot + v_potential, 0)::numeric, 1),
    'cta',          v_cta
  );
end;
$$;

-- allow the anon/service role to execute
grant execute on function public.get_public_summary(text, text) to anon, authenticated, service_role;
```

The public route calls this and renders HTML from the returned JSON. Nothing sensitive (raw entries, user_id, emails) ever leaves the DB.

---

## 7. Application structure

```
app/
  (auth)/
    login/page.tsx              # email+password sign in
    register/page.tsx           # sign up; on success create profile row + slug
  (dashboard)/
    layout.tsx                  # requires session; nav
    page.tsx                    # TIME TABLE (master grid + capacity summary)
    items/new/page.tsx          # create item
    items/[id]/page.tsx         # item detail + Start/Stop + entry history
    items/[id]/edit/page.tsx    # edit item
    settings/page.tsx           # profile, slug, page title/desc, default view,
                                #   is_public toggle, CTA fields
  [slug]/page.tsx               # PUBLIC embeddable page (server component)
  api/
    timer/start/route.ts        # POST { itemId } â†’ insert running entry
    timer/stop/route.ts         # POST { itemId } â†’ close running entry
lib/
  supabase/client.ts            # browser client (anon key)
  supabase/server.ts            # server client (cookies/session)
  supabase/admin.ts             # service-role client (server only) for public route
  hours.ts                      # conversion + capacity constants
  types.ts
```

### 7.1 hours.ts (single source of truth for math)
```ts
export const WEEK_CAPACITY = 168;
export const MONTH_CAPACITY = 720;

export function toWeekly(value: number, period: 'day'|'week'|'month'): number {
  if (period === 'day') return value * 7;
  if (period === 'month') return value / 30 * 7;
  return value;
}
export function fromWeekly(weekly: number, view: 'week'|'month'): number {
  return view === 'month' ? weekly / 7 * 30 : weekly;
}
export function capacity(view: 'week'|'month'): number {
  return view === 'month' ? MONTH_CAPACITY : WEEK_CAPACITY;
}
```

---

## 8. Pages â€” behaviour spec

### 8.1 Register / Login
- Supabase email+password auth.
- On **register success**: create a `profiles` row. Generate a slug from display name (slugify + short random suffix to guarantee uniqueness); allow editing later in settings. Create an empty `cta` row.
- Redirect to dashboard.

### 8.2 Time Table (dashboard home) â€” `/`
- Header: **week / month toggle** (defaults to profile.default_view).
- **Capacity summary card** at top: Capacity, Allocated total, Comfortably available, Potentially available (all in selected view). If comfortable < 0, show a red "over-allocated by Xh" warning.
- **Items grid**, columns: Where (link if set) Â· Allocated Â· Spent (manual only, else â€”) Â· Completion (bar + %, manual only) Â· Notice (`N/A` if NULL, `At will` if 0, `N days` if >0) Â· Mode badge Â· row actions (open, edit).
- Manual rows show a **live-ticking** spent value if a timer is running (client-side interval; display only).
- Quick "Start/Stop" inline button per manual item (calls the timer API).
- "Add item" button â†’ `/items/new`.

### 8.3 Create item â€” `/items/new`
Fields:
- Title (required, freeform).
- Link (optional URL).
- Tracking mode (radio): **Assumed spent** / **Manual track**.
- Allocated hours: number + period selector (**Day / Week / Month**) â†’ convert to weekly on save via `toWeekly`.
- Notice period (days): shown only when mode = manual_track. Integer â‰¥ 0. For assumed_spent, force `NULL` and hide the field.
- sort_order: append to end.
Validation: hours > 0; notice integer â‰¥ 0; assumed_spent â‡’ notice NULL.

### 8.4 Item detail â€” `/items/[id]`
- Big **Start / Stop** button (manual only). State derived from "is there an open entry for this item?" â€” query on load so any device reflects the true state.
  - Start â†’ `POST /api/timer/start`. If a running entry already exists (unique index conflict), show "already running" and refresh state.
  - Stop â†’ `POST /api/timer/stop` closes the open entry (`stopped_at = now()`).
- Show this item's allocated (selected view), spent (last 7/30 days), completion %.
- **Entry history**: list of completed entries with duration. Allow deleting an entry (owner only).
- Assumed-spent items: no timer UI; just show allocated and a note "assumed fully spent".

### 8.5 Edit item â€” `/items/[id]/edit`
Same form as create, pre-filled. Editing allocated re-normalizes to weekly. Changing mode from manualâ†’assumed should warn that notice is cleared and existing entries remain but no longer affect a (now hidden) completion rate.

### 8.6 Settings â€” `/settings`
- Display name, **slug** (unique; validate + show the public URL `https://<domain>/<slug>`).
- Page title, page description.
- Default view (week/month).
- **is_public** toggle (off â†’ public page returns "not available").
- CTA: title, description, url (all optional).
- Copy-to-clipboard for the **iframe embed snippet** (see Â§9).

### 8.7 Public page â€” `/[slug]` (server component, no client secrets)
- Read `?view=week|month` (default to profile.default_view via the function).
- Call `get_public_summary(slug, view)` through the **service-role server client**.
- If `null` â†’ render a minimal "This page isn't available."
- Render:
  - Page title + description (fallback to display name).
  - **Table**: Where (hyperlink if link) Â· Allocated Â· Completion (`â€”` for assumed; bar+% for manual) Â· Notice (`N/A` / `At will` / `N days`).
  - Below table: **Comfortably available** and **Potentially available**, each with an **(i)** tooltip:
    - Comfortable: "Time not committed to anything. Free to take on right now."
    - Potential: "Comfortably available time, plus tasks I can drop at will (0 notice). Tasks with a notice period could free up later, after their notice."
  - **week/month toggle** (links that set `?view=`; keep it server-rendered â€” a plain link toggle avoids shipping JS into the iframe).
  - **CTA block** if present: title, description, button linking to url.
- Self-contained, minimal CSS, transparent-friendly background so it embeds cleanly. Set appropriate caching headers (e.g. `revalidate` 60s) so it's cheap.

---

## 9. Embedding

Settings shows a copyable snippet:
```html
<iframe src="https://<domain>/<slug>?view=week"
        style="width:100%;max-width:640px;height:520px;border:0;"
        loading="lazy" title="My availability"></iframe>
```
- Ensure the public route does **not** send `X-Frame-Options: DENY`. Set a permissive `Content-Security-Policy: frame-ancestors *` (or a user-configurable allowlist later) on `/[slug]` responses so it can be embedded anywhere.
- Keep the page responsive down to ~320px wide.

---

## 10. Timer API details

`POST /api/timer/start` (auth required):
1. Verify the item belongs to the user and is `manual_track`.
2. Insert `time_entries(item_id, user_id, started_at=now())`.
3. On unique-violation (already running) â†’ return 409 with `{ running: true }`.

`POST /api/timer/stop` (auth required):
1. Find the open entry (`stopped_at is null`) for the item.
2. Set `stopped_at = now()`.
3. Return the closed entry.

Both use the session server client (RLS enforces ownership). Cross-device correctness comes from always deriving timer state from the DB, never from local storage.

---

## 11. Build order (milestones with verify gates)

Work in small, verifiable steps. After each, confirm it works against the real DB before moving on.

1. **Project + Supabase wiring.** Next.js + Tailwind + Supabase clients (browser/server/admin). Env vars set. Verify: a trivial authed query returns from Postgres.
2. **Migrations.** Apply Â§4 schema, Â§5 RLS, Â§6 function. Verify: `select get_public_summary('x','week')` returns null cleanly for a missing slug; RLS blocks cross-user reads (test with two users in SQL).
3. **Auth + profile bootstrap.** Register/login; auto-create profile + slug + empty cta. Verify: new user lands on empty dashboard; profile row exists.
4. **Items CRUD.** Create/edit/list with correct weekly normalization. Verify: entering 10h/day stores 70; 60h/month stores 14; month view shows them back correctly.
5. **Time table + availability math.** Capacity summary + grid + week/month toggle. Verify comfortable/potential against a hand-computed example (your Life/Client1/Client2 numbers).
6. **Timer.** Start/stop APIs + item detail + entry history + cross-device state (test: start on one browser, stop from another). Verify unique-index guard blocks double-start.
7. **Completion rate.** Rolling 7/30-day spent vs allocated; bar overflow past 100%. Verify 22 spent / 20 alloc = 110%.
8. **Settings + CTA + slug.** Editable slug with uniqueness; public URL + embed snippet copy.
9. **Public page.** Server-rendered from `get_public_summary`; tooltips; CTA; `is_public` gating; frame-ancestors header. Verify it renders inside a test iframe on a separate HTML file and never exposes the service key or raw entries (check network tab).
10. **Polish.** Over-allocation warning, empty states, responsive down to 320px, caching/revalidate on public route.

---

## 12. Explicit non-goals / guards for the implementer

- No timezone handling. Durations only.
- No calendar-accurate month math â€” 30-day constant everywhere.
- Public page shows **only completed entries**; never live time.
- `assumed_spent` items: no timer, no completion, `notice_period_days` always NULL, never counted in potential.
- Never expose `SUPABASE_SERVICE_ROLE_KEY` to any client component; it is used solely inside `app/[slug]` server code and admin server client.
- No public SELECT policies on raw tables â€” all public reads go through `get_public_summary`.
- No mock data or placeholder fixtures in any environment; every screen is wired to real Postgres.
</USER_REQUEST>
<ADDITIONAL_METADATA>
The current local time is: 2026-07-08T22:25:49+05:30.