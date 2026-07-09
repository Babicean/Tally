import { mirrorWrite } from "./mirror";
import { SYNC_KEY, SYNC_URL } from "./syncConfig";

/**
 * The sync client: a thin, dependency-free wrapper over Supabase's
 * auth (GoTrue) and data (PostgREST) endpoints. The server can only
 * ever be touched through parameterized REST — the app never sends
 * SQL — and Row Level Security scopes every request to the signed-in
 * user's own row. See docs/SYNC.md for the architecture.
 */

const SESSION_KEY = "tally.session";

export interface SyncUser {
  id: string;
  email: string;
  /** Real email verification, set by Supabase once the link is clicked. */
  verified: boolean;
  createdAt: string;
}

export interface SyncSession {
  accessToken: string;
  refreshToken: string;
  /** Epoch seconds when the access token dies. */
  expiresAt: number;
  user: SyncUser;
}

export type SyncResult<T> = { ok: true } & T;
export type SyncProblem = { ok: false; problem: string };

/* ---- session persistence ------------------------------------------------ */

export function parseSession(raw: string | null): SyncSession | null {
  if (!raw) return null;
  try {
    const s = JSON.parse(raw) as SyncSession;
    if (
      typeof s?.accessToken === "string" &&
      typeof s?.refreshToken === "string" &&
      typeof s?.expiresAt === "number" &&
      typeof s?.user?.id === "string" &&
      typeof s?.user?.email === "string"
    ) {
      return s;
    }
  } catch {
    // Corrupt session: treat as signed out.
  }
  return null;
}

export function loadSession(): SyncSession | null {
  try {
    return parseSession(localStorage.getItem(SESSION_KEY));
  } catch {
    return null;
  }
}

function saveSession(session: SyncSession | null): void {
  try {
    if (session === null) {
      localStorage.removeItem(SESSION_KEY);
      mirrorWrite(SESSION_KEY, "");
    } else {
      const json = JSON.stringify(session);
      localStorage.setItem(SESSION_KEY, json);
      mirrorWrite(SESSION_KEY, json);
    }
  } catch {
    // Storage unavailable — the session just won't persist.
  }
}

/* ---- error mapping ------------------------------------------------------- */

/** Translate GoTrue/PostgREST errors into calm, specific sentences. */
export function friendlyAuthProblem(
  status: number,
  body: { error_code?: string; msg?: string; message?: string } | null,
): string {
  const code = body?.error_code ?? "";
  const msg = (body?.msg ?? body?.message ?? "").toLowerCase();
  if (code === "invalid_credentials" || msg.includes("invalid login")) {
    return "Wrong email or password.";
  }
  if (code === "email_not_confirmed" || msg.includes("not confirmed")) {
    return "Your email isn't verified yet. Check your inbox for the link.";
  }
  if (
    code === "user_already_exists" ||
    code === "email_exists" ||
    msg.includes("already registered")
  ) {
    return "That email already has an account. Try logging in.";
  }
  if (code === "weak_password" || msg.includes("password")) {
    return "That password is too weak. Use at least 8 characters.";
  }
  if (code === "over_request_rate_limit" || status === 429) {
    return "Too many attempts. Wait a minute and try again.";
  }
  if (status >= 500) return "The server hiccuped. Try again in a moment.";
  return "Something went wrong. Try again.";
}

const NETWORK_PROBLEM =
  "Couldn't reach the server. Check your connection and try again.";

async function bodyOf(res: Response): Promise<Record<string, unknown> | null> {
  try {
    return (await res.json()) as Record<string, unknown>;
  } catch {
    return null;
  }
}

/* ---- auth ---------------------------------------------------------------- */

function toSession(data: {
  access_token: string;
  refresh_token: string;
  expires_in?: number;
  expires_at?: number;
  user: {
    id: string;
    email?: string;
    email_confirmed_at?: string | null;
    created_at?: string;
  };
}): SyncSession {
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt:
      data.expires_at ??
      Math.floor(Date.now() / 1000) + (data.expires_in ?? 3600),
    user: {
      id: data.user.id,
      email: data.user.email ?? "",
      verified: Boolean(data.user.email_confirmed_at),
      createdAt: data.user.created_at ?? new Date().toISOString(),
    },
  };
}

export async function signUp(
  email: string,
  password: string,
): Promise<SyncResult<{ needsConfirmation: boolean }> | SyncProblem> {
  try {
    const res = await fetch(`${SYNC_URL}/auth/v1/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: SYNC_KEY },
      body: JSON.stringify({ email, password }),
    });
    const body = await bodyOf(res);
    if (!res.ok) {
      return { ok: false, problem: friendlyAuthProblem(res.status, body) };
    }
    // Supabase obfuscates sign-ups against existing emails by returning a
    // fake user with no identities — surface it honestly instead.
    const user = (body?.user ?? body) as {
      identities?: unknown[];
    } | null;
    if (user && Array.isArray(user.identities) && user.identities.length === 0) {
      return {
        ok: false,
        problem: "That email already has an account. Try logging in.",
      };
    }
    if (body?.access_token) {
      // Email confirmation disabled server-side: signed in immediately.
      saveSession(toSession(body as Parameters<typeof toSession>[0]));
      return { ok: true, needsConfirmation: false };
    }
    return { ok: true, needsConfirmation: true };
  } catch {
    return { ok: false, problem: NETWORK_PROBLEM };
  }
}

export async function signIn(
  email: string,
  password: string,
): Promise<
  SyncResult<{ session: SyncSession }> | (SyncProblem & { unverified?: boolean })
> {
  try {
    const res = await fetch(
      `${SYNC_URL}/auth/v1/token?grant_type=password`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", apikey: SYNC_KEY },
        body: JSON.stringify({ email, password }),
      },
    );
    const body = await bodyOf(res);
    if (!res.ok || !body?.access_token) {
      const code = String(body?.error_code ?? "");
      const msg = String(body?.msg ?? "").toLowerCase();
      return {
        ok: false,
        problem: friendlyAuthProblem(res.status, body),
        // Callers route unverified accounts back to the verify pane,
        // where the resend button lives — a lost email is never a
        // dead end.
        unverified:
          code === "email_not_confirmed" || msg.includes("not confirmed"),
      };
    }
    const session = toSession(body as Parameters<typeof toSession>[0]);
    saveSession(session);
    // The local-only beta record is superseded by real accounts.
    try {
      localStorage.removeItem("tally.account");
      mirrorWrite("tally.account", "");
    } catch {
      // Nothing to clean.
    }
    return { ok: true, session };
  } catch {
    return { ok: false, problem: NETWORK_PROBLEM };
  }
}

export async function resendConfirmation(
  email: string,
): Promise<SyncResult<object> | SyncProblem> {
  try {
    const res = await fetch(`${SYNC_URL}/auth/v1/resend`, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: SYNC_KEY },
      body: JSON.stringify({ type: "signup", email }),
    });
    if (!res.ok) {
      return {
        ok: false,
        problem: friendlyAuthProblem(res.status, await bodyOf(res)),
      };
    }
    return { ok: true };
  } catch {
    return { ok: false, problem: NETWORK_PROBLEM };
  }
}

/**
 * Send a password-reset email. The link lands on docs/reset.html
 * (hosted on GitHub Pages), which sets the new password against the
 * recovery token — the app never sees or stores it.
 */
export async function requestPasswordReset(
  email: string,
): Promise<SyncResult<object> | SyncProblem> {
  try {
    const redirect = encodeURIComponent(
      "https://babicean.github.io/Tally/reset.html",
    );
    const res = await fetch(
      `${SYNC_URL}/auth/v1/recover?redirect_to=${redirect}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", apikey: SYNC_KEY },
        body: JSON.stringify({ email }),
      },
    );
    if (!res.ok) {
      return {
        ok: false,
        problem: friendlyAuthProblem(res.status, await bodyOf(res)),
      };
    }
    return { ok: true };
  } catch {
    return { ok: false, problem: NETWORK_PROBLEM };
  }
}

export async function signOut(): Promise<void> {
  const session = loadSession();
  saveSession(null);
  if (!session) return;
  try {
    // Best effort; local sign-out already happened.
    await fetch(`${SYNC_URL}/auth/v1/logout`, {
      method: "POST",
      headers: {
        apikey: SYNC_KEY,
        Authorization: `Bearer ${session.accessToken}`,
      },
    });
  } catch {
    // Offline sign-out is still a sign-out.
  }
}

/** Refresh when the token is inside its final minute. */
async function freshSession(): Promise<SyncSession | null> {
  const session = loadSession();
  if (!session) return null;
  if (session.expiresAt - Date.now() / 1000 > 60) return session;
  try {
    const res = await fetch(
      `${SYNC_URL}/auth/v1/token?grant_type=refresh_token`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", apikey: SYNC_KEY },
        body: JSON.stringify({ refresh_token: session.refreshToken }),
      },
    );
    const body = await bodyOf(res);
    if (!res.ok || !body?.access_token) {
      // Refresh token dead: the session is over.
      saveSession(null);
      return null;
    }
    const next = toSession(body as Parameters<typeof toSession>[0]);
    saveSession(next);
    return next;
  } catch {
    // Offline: hand back the stale session; the caller's request will
    // fail with a network problem, which is the honest outcome.
    return session;
  }
}

/* ---- backups ------------------------------------------------------------- */

const SIGNED_OUT_PROBLEM = "You're signed out. Log in and try again.";

export async function pushBackup(
  payload: unknown,
): Promise<SyncResult<{ updatedAt: string }> | SyncProblem> {
  const session = await freshSession();
  if (!session) return { ok: false, problem: SIGNED_OUT_PROBLEM };
  try {
    const res = await fetch(
      `${SYNC_URL}/rest/v1/backups?on_conflict=user_id`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: SYNC_KEY,
          Authorization: `Bearer ${session.accessToken}`,
          Prefer: "resolution=merge-duplicates,return=representation",
        },
        body: JSON.stringify([
          {
            user_id: session.user.id,
            payload,
            updated_at: new Date().toISOString(),
          },
        ]),
        // Let an auto-backup finish even if the app is backgrounded
        // mid-request.
        keepalive: true,
      },
    );
    if (!res.ok) {
      return {
        ok: false,
        problem:
          res.status === 401 || res.status === 403
            ? SIGNED_OUT_PROBLEM
            : "Backup didn't go through. Try again.",
      };
    }
    const rows = (await res.json()) as { updated_at?: string }[];
    return {
      ok: true,
      updatedAt: rows?.[0]?.updated_at ?? new Date().toISOString(),
    };
  } catch {
    return { ok: false, problem: NETWORK_PROBLEM };
  }
}

export async function pullBackup(): Promise<
  SyncResult<{ payload: unknown; updatedAt: string } | { payload: null }> |
  SyncProblem
> {
  const session = await freshSession();
  if (!session) return { ok: false, problem: SIGNED_OUT_PROBLEM };
  try {
    const res = await fetch(
      `${SYNC_URL}/rest/v1/backups?select=payload,updated_at`,
      {
        headers: {
          apikey: SYNC_KEY,
          Authorization: `Bearer ${session.accessToken}`,
        },
      },
    );
    if (!res.ok) {
      return { ok: false, problem: "Couldn't fetch your backup. Try again." };
    }
    const rows = (await res.json()) as {
      payload: unknown;
      updated_at: string;
    }[];
    if (!rows.length) return { ok: true, payload: null };
    return { ok: true, payload: rows[0].payload, updatedAt: rows[0].updated_at };
  } catch {
    return { ok: false, problem: NETWORK_PROBLEM };
  }
}

/**
 * Delete the account server-side (a security-definer RPC removes the
 * auth user; the backup row cascades away) and sign out locally.
 */
export async function deleteAccount(): Promise<
  SyncResult<object> | SyncProblem
> {
  const session = await freshSession();
  if (!session) return { ok: false, problem: SIGNED_OUT_PROBLEM };
  try {
    const res = await fetch(`${SYNC_URL}/rest/v1/rpc/delete_account`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: SYNC_KEY,
        Authorization: `Bearer ${session.accessToken}`,
      },
      body: "{}",
    });
    if (!res.ok) {
      return { ok: false, problem: "Deletion failed. Try again." };
    }
    saveSession(null);
    return { ok: true };
  } catch {
    return { ok: false, problem: NETWORK_PROBLEM };
  }
}

/* ---- last-backup bookkeeping (cosmetic, local) --------------------------- */

const LAST_BACKUP_KEY = "tally.lastBackup";

export function rememberLastBackup(iso: string): void {
  try {
    localStorage.setItem(LAST_BACKUP_KEY, iso);
  } catch {
    // Cosmetic only.
  }
}

export function lastBackupAt(): string | null {
  try {
    return localStorage.getItem(LAST_BACKUP_KEY);
  } catch {
    return null;
  }
}

export function clearLastBackup(): void {
  try {
    localStorage.removeItem(LAST_BACKUP_KEY);
  } catch {
    // Cosmetic only.
  }
}
