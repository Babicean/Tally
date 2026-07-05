import { mirrorRemove, mirrorWrite } from "./mirror";

/**
 * Account beta — LOCAL ONLY. The record never leaves the device; it exists
 * so the flows are real and the data model is settled before the sync
 * server arrives. The password is salted and hashed even locally (hygiene,
 * not security — the real server will do proper KDF hashing server-side).
 */
const ACCOUNT_KEY = "tally.account";
const ACCOUNT_VERSION = 1;

export interface Account {
  email: string;
  passwordHash: string;
  salt: string;
  createdAt: number;
  /** Stamped by the sync server one day; always null in the local beta. */
  lastBackupAt: number | null;
}

export interface AccountState {
  account: Account | null;
  /** An account can exist while logged out; the record stays for log-in. */
  signedIn: boolean;
}

interface AccountShape {
  version: number;
  state: AccountState;
}

export const EMPTY_ACCOUNT_STATE: AccountState = {
  account: null,
  signedIn: false,
};

export function isValidEmail(value: string): boolean {
  // Deliberately loose: one @ with something on both sides and a dot after.
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

/** Returns a user-facing problem with the password, or null if it's fine. */
export function passwordProblem(password: string): string | null {
  if (password.length < 8) return "Use at least 8 characters.";
  return null;
}

export function makeSalt(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

export async function hashPassword(
  password: string,
  salt: string,
): Promise<string> {
  const data = new TextEncoder().encode(`${salt}:${password}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest), (b) =>
    b.toString(16).padStart(2, "0"),
  ).join("");
}

/** Pure parser so loading is testable without storage. */
export function parseAccountState(raw: string | null): AccountState {
  if (!raw) return { ...EMPTY_ACCOUNT_STATE };
  try {
    const parsed = JSON.parse(raw) as AccountShape;
    const a = parsed?.state?.account;
    if (
      !a ||
      typeof a.email !== "string" ||
      typeof a.passwordHash !== "string" ||
      typeof a.salt !== "string"
    ) {
      return { ...EMPTY_ACCOUNT_STATE };
    }
    return {
      account: {
        email: a.email,
        passwordHash: a.passwordHash,
        salt: a.salt,
        createdAt: typeof a.createdAt === "number" ? a.createdAt : Date.now(),
        lastBackupAt:
          typeof a.lastBackupAt === "number" ? a.lastBackupAt : null,
      },
      signedIn: parsed.state.signedIn === true,
    };
  } catch {
    return { ...EMPTY_ACCOUNT_STATE };
  }
}

export function loadAccountState(): AccountState {
  try {
    return parseAccountState(localStorage.getItem(ACCOUNT_KEY));
  } catch {
    return { ...EMPTY_ACCOUNT_STATE };
  }
}

function saveAccountState(state: AccountState): void {
  try {
    const payload: AccountShape = { version: ACCOUNT_VERSION, state };
    const json = JSON.stringify(payload);
    localStorage.setItem(ACCOUNT_KEY, json);
    mirrorWrite(ACCOUNT_KEY, json);
  } catch {
    // Storage unavailable — the account just won't persist.
  }
}

export async function createAccount(
  email: string,
  password: string,
): Promise<AccountState> {
  const salt = makeSalt();
  const state: AccountState = {
    account: {
      email: email.trim().toLowerCase(),
      passwordHash: await hashPassword(password, salt),
      salt,
      createdAt: Date.now(),
      lastBackupAt: null,
    },
    signedIn: true,
  };
  saveAccountState(state);
  return state;
}

export type SignInResult =
  | { ok: true; state: AccountState }
  | { ok: false; problem: string };

export async function signIn(
  state: AccountState,
  email: string,
  password: string,
): Promise<SignInResult> {
  const account = state.account;
  if (!account || account.email !== email.trim().toLowerCase()) {
    return {
      ok: false,
      problem: "No account with that email on this device.",
    };
  }
  const hash = await hashPassword(password, account.salt);
  if (hash !== account.passwordHash) {
    return { ok: false, problem: "Wrong password." };
  }
  const next: AccountState = { account, signedIn: true };
  saveAccountState(next);
  return { ok: true, state: next };
}

/** Log out but keep the record so logging back in works. */
export function signOut(state: AccountState): AccountState {
  const next: AccountState = { account: state.account, signedIn: false };
  saveAccountState(next);
  return next;
}

/** Remove the account entirely. Entries and settings are untouched. */
export function deleteAccount(): AccountState {
  try {
    localStorage.removeItem(ACCOUNT_KEY);
    mirrorRemove(ACCOUNT_KEY);
  } catch {
    // Nothing to clean up if storage is unavailable.
  }
  return { ...EMPTY_ACCOUNT_STATE };
}
