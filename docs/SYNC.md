# Tally Sync — architecture

The account beta (v2.3) promised this day: email + password accounts,
local-only, with a `verified` flag and a "Last backed up: not yet" row
waiting for a real server. This document is the design for that server.

## Decision: Supabase (hosted), free tier

We use **Supabase** (supabase.com) — a managed Postgres + auth platform
— rather than self-hosting PocketBase on a VPS.

Why it fits:

- **Cheap**: the free tier ($0) covers a beta many times over — 500 MB
  database (a Tally backup is a few KB per user), 50k monthly auth
  users, real verification emails included. No card required.
- **Managed**: no server to patch, no TLS to renew, no backups to
  babysit. "Existing solution", per the owner's call.
- **Auth built in**: email + password with server-side bcrypt, email
  verification, password reset — all the things the local beta faked,
  for free. Our `verified` flag becomes real.
- **Row Level Security (RLS)**: the database itself enforces that a
  user can only touch their own row. Even a bug in our client cannot
  read someone else's data.
- Region: **Sydney (ap-southeast-2)** — the owner and first users are
  in Australia.

Known free-tier caveat: projects pause after ~7 days with zero API
traffic. Any real usage prevents this; if the beta goes quiet, the
dashboard un-pauses it in one click. Acceptable for a beta.

## Data model: the backup IS the sync payload

One table. Not per-entry rows.

```sql
create table public.backups (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  payload    jsonb not null,
  updated_at timestamptz not null default now()
);
```

`payload` is exactly the JSON that Export backup already produces. Sync
reuses the code paths we trust most:

- **Push** = `buildBackup()` → upsert the row. Sets "Last backed up".
- **Pull** = fetch the row → `parseBackup()` → the existing
  `importBackup()` merge (id-based, add-only, already handles
  duplicates). Then push the merged result back.
- **Restore on a new phone** = sign in → pull. Done.

Why a blob and not rows: it reuses the tested backup/merge logic,
cannot corrupt partially (one atomic document), keeps the schema
trivial, and at Tally's data size (KBs) there is nothing to gain from
deltas. If Tally ever needs multi-device live sync, that's a v2 with
per-entry rows — the payload gives us a perfect migration source.

## Security posture (the owner's checklist, answered)

- **API keys.** Supabase generates two at project creation
  (Settings → API):
  - the **anon (publishable) key** — ships inside the app, *by
    design*. It is not a secret; it only identifies the project. All
    authority comes from the signed-in user's JWT + RLS. This is the
    industry-standard model (Firebase works the same way).
  - the **service_role key** — god-mode. It never leaves the Supabase
    dashboard. Not in the repo, not in CI, not in the app. We do not
    need it anywhere.
- **SQL injection: no surface.** The client never sends SQL. It calls
  Supabase's REST layer (PostgREST) through `@supabase/supabase-js`,
  which parameterizes everything. Even a hostile string in a food
  description lands as an inert JSON value. RLS is the backstop
  behind that.
- **Row Level Security on, deny-by-default:**

  ```sql
  alter table public.backups enable row level security;

  create policy "own backup: read"
    on public.backups for select using (auth.uid() = user_id);
  create policy "own backup: insert"
    on public.backups for insert with check (auth.uid() = user_id);
  create policy "own backup: update"
    on public.backups for update using (auth.uid() = user_id);
  ```

  No delete policy — deletion happens only via account deletion.
- **Passwords**: bcrypt server-side by Supabase Auth. The app never
  stores a password (an upgrade over the local beta's salted SHA-256,
  which is retired).
- **Transport**: HTTPS only; Supabase does not serve plaintext.
- **Sessions**: short-lived JWTs with refresh, handled by the SDK;
  stored via the same mirrored-storage layer as everything else.
- **Rate limiting**: Supabase Auth has built-in limits on sign-up /
  sign-in / reset endpoints.
- **Deliberately NOT doing yet**: end-to-end encryption of the
  payload. E2EE would mean a forgotten password = unrecoverable data,
  which is the wrong trade for a calorie diary beta. Documented as a
  possible future for the paranoid-mode toggle. The payload is still
  encrypted at rest (Supabase disk encryption) and in transit.

## Delete account — for real this time

A security-definer function the signed-in user calls on themselves:

```sql
create or replace function public.delete_account()
returns void
language sql
security definer
set search_path = ''
as $$
  delete from auth.users where id = auth.uid();
$$;

revoke execute on function public.delete_account() from anon;
grant execute on function public.delete_account() to authenticated;
```

`on delete cascade` on `backups.user_id` wipes the payload in the same
transaction. The existing two-tap Delete account UI now calls this,
then clears the local account record. What stays on the phone stays —
deleting the account never touches on-device entries, same promise as
the beta.

## App changes (implementation phase)

- `src/lib/sync.ts` — thin wrapper over `@supabase/supabase-js`:
  signUp / signIn / signOut / deleteAccount / pushBackup / pullBackup.
  Project URL + anon key live in `src/lib/syncConfig.ts` (committed —
  they are public by design).
- Account panel: real sign-up (sends verification email), verified
  badge driven by the real flag, **Back up now** button + auto-push
  after N changes, "Last backed up" shows the real `updated_at`.
- Local beta accounts (`tally.account`) are retired: on update, a
  signed-in-locally user sees "Accounts are real now — create your
  account to enable sync" and the old record is cleared. (No real
  users besides the owner; clean break approved.)
- **Honest-copy updates** (the current wording becomes false):
  - Settings footer → "Tally v… · your data stays on this device
    unless you turn on account sync."
  - Data card → "Everything stays on this device unless you sign in
    and back up. Export a file backup any time."
  - Account panel gains one line: "Backups are stored encrypted at
    rest on our server (Supabase, Sydney) and deleted the moment you
    delete your account."
- BETA label stays until the flow has survived a phone-swap restore.

## Policy + store-program impact

- **docs/PRIVACY.md** (drafted alongside this doc) becomes the privacy
  policy: what is collected (email; the backup payload when sync is
  used), where it lives (Supabase, Sydney), retention (until account
  deletion), the no-sync default (nothing collected at all), contact.
  Hosted for free via the GitHub repo URL — TestFlight requires a
  privacy policy URL in App Store Connect.
- **TestFlight / App Store Connect**: App Privacy questionnaire must
  declare: *Contact info → email address* (linked to identity,
  app functionality) and *Health & fitness → nutrition data* (linked
  to identity via the account, app functionality, not used for
  tracking/ads). Beta App Review reads these.
- **Android**: currently sideloaded ("latest" APK), so no Play
  questionnaire yet; if Tally ever ships via Play, the Data safety
  form mirrors the same answers.
- Reps inherits all of this later — same account model, same table
  shape (`payload` is already app-tagged `"app": "reps"`).

## Rollout order

1. Owner creates the Supabase project, hands over Project URL + anon
   key (see steps in the main conversation / below).
2. SQL above runs once in the Supabase SQL editor; email confirmation
   turned on in Auth settings.
3. Client work ships on a side branch (`claude/tally-sync`) to the
   beta release channel first — same playbook as the account beta.
4. Phone-swap test: sign in on a second device (or cleared app),
   pull, verify every entry and setting arrives.
5. Merge to main, BETA label softened, policy links live.

## Owner's one-time setup (~10 minutes, all in a browser)

1. https://supabase.com → sign in with GitHub → **New project**.
   Organization: personal. Name: `tally-sync`. Region: **Sydney**.
   Database password: let it generate one and store it somewhere safe
   (we likely never need it — it's for direct DB access only).
2. When the project finishes provisioning: **Project Settings → API**.
   Copy two things: **Project URL** (`https://xxxx.supabase.co`) and
   the **anon / publishable key**. Both are safe to paste in chat —
   they ship in the app anyway.
3. **Authentication → Providers → Email**: leave email+password on;
   ensure **Confirm email** is enabled.
4. Hand over URL + anon key. Everything after that is repo work.
