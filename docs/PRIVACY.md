# Tally — Privacy Policy

_Effective from the release that introduces account sync (see
CHANGELOG). Until you install that version and sign in, the previous
promise holds unchanged: nothing ever leaves your device._

## The short version

Tally works fully offline. If you never create an account, **no data
about you is collected, transmitted, or stored anywhere except your
own phone** — there are no analytics, no trackers, no ads, and no
third-party SDKs that phone home.

If you choose to create an account and back up, exactly two things are
stored on our server, and both are deleted the moment you delete your
account.

## What is collected, and when

**Without an account (the default):** nothing. Your entries, menu,
goals, and settings live in the app's local storage on your phone.
Export/Import backups are files you control.

**With an account (opt-in):**

- **Your email address** — used as your login and for verification and
  password-reset emails. Nothing else is sent to it.
- **Your backup payload** — the same JSON the Export button produces:
  entries (calories, descriptions, optional protein/fat, timestamps),
  menu items, goals, and app settings. It is uploaded when you back up
  and downloaded when you restore.

**Steps (opt-in, Settings > Show steps):** Tally reads your daily step
count from Health Connect (Android) or Apple Health (iOS) while the app
is open, and shows it. It is read fresh each time, never written to
Tally's storage, never included in a backup, and never uploaded. Tally
asks for read access to steps only, nothing else in your health data.
Turn the switch off and Tally stops reading; revoke the permission in
Health Connect or the Health app and it stops too.

That is the complete list. No device identifiers, no location, no
contacts, no analytics events.

## Where it lives

Backups and accounts are stored with **Supabase** (our database and
authentication provider) in the **Sydney, Australia** region.
Connections are HTTPS-only; data is encrypted at rest; passwords are
hashed with bcrypt and are never visible to us or to Supabase staff.
Access to your row is enforced by database-level Row Level Security:
your data is readable and writable only by requests authenticated as
you.

## Retention and deletion

While you are signed in, the app backs your data up automatically
shortly after you make changes; each backup overwrites the previous
one. Your backup is kept until you overwrite it with a newer one or
delete your account. **Delete account** (Settings → Account) permanently
removes your account and your backup from the server in the same
operation — there is no grace period, no soft-delete, and no copy kept.
Data on your phone is never touched by account deletion.

## What we will never do

- Sell or share your data with anyone.
- Use your data for advertising or profiling.
- Add analytics or tracking without changing this policy and saying so
  loudly in the changelog first.

## Contact

Questions or deletion requests that the in-app button can't handle:
open an issue on the GitHub repository, or email the address on the
developer's GitHub profile.
