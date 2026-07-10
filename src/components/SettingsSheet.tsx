import { FormEvent, useEffect, useState } from "react";
import Sheet from "./Sheet";
import type { AccentPref, ThemePref } from "../lib/theme";
import { parseProtein } from "../lib/menu";
import { emailProblem, passwordProblem, suggestEmailFix } from "../lib/account";
import {
  clearLastBackup,
  deleteAccount,
  lastBackupAt,
  loadSession,
  pullBackup,
  pushBackup,
  rememberLastBackup,
  requestPasswordReset,
  resendConfirmation,
  signIn,
  signOut,
  signUp,
  type SyncSession,
} from "../lib/sync";
import {
  buildBackup,
  parseBackup,
  type BackupPayload,
  type MergeResult,
} from "../lib/backup";

interface Props {
  open: boolean;
  theme: ThemePref;
  onSetTheme: (theme: ThemePref) => void;
  accent: AccentPref;
  onSetAccent: (accent: AccentPref) => void;
  trackProtein: boolean;
  onSetTrackProtein: (on: boolean) => void;
  proteinTarget: number | null;
  onSetProteinTarget: (grams: number | null) => void;
  fatTarget: number | null;
  onSetFatTarget: (grams: number | null) => void;
  trackWeight: boolean;
  onSetTrackWeight: (on: boolean) => void;
  /** Snapshot of everything worth backing up, in export format. */
  getBackup: () => BackupPayload;
  /** Merge a pulled backup into local data; reports what was added. */
  onRestore: (backup: BackupPayload) => MergeResult;
  /** Open straight on the account login form (the welcome page's path). */
  startAtLogin?: boolean;
  onClose: () => void;
}

const THEME_OPTIONS: { id: ThemePref; label: string }[] = [
  { id: "system", label: "System" },
  { id: "light", label: "Light" },
  { id: "dark", label: "Dark" },
];

const ACCENT_OPTIONS: { id: AccentPref; label: string }[] = [
  { id: "azure", label: "Azure" },
  { id: "emerald", label: "Emerald" },
];

type View = "settings" | "account";
type AccountForm = "none" | "create" | "login";

export default function SettingsSheet({
  open,
  theme,
  onSetTheme,
  accent,
  onSetAccent,
  trackProtein,
  onSetTrackProtein,
  proteinTarget,
  onSetProteinTarget,
  fatTarget,
  onSetFatTarget,
  trackWeight,
  onSetTrackWeight,
  getBackup,
  onRestore,
  startAtLogin = false,
  onClose,
}: Props) {
  const [target, setTarget] = useState("");
  const [fatT, setFatT] = useState("");
  const [view, setView] = useState<View>("settings");
  const [session, setSession] = useState<SyncSession | null>(() =>
    loadSession(),
  );
  const [awaitingVerify, setAwaitingVerify] = useState<string | null>(null);
  const [lastBackup, setLastBackup] = useState<string | null>(() =>
    lastBackupAt(),
  );
  const [syncNote, setSyncNote] = useState<string | null>(null);
  const [form, setForm] = useState<AccountForm>("none");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  // Direction-aware drill animation: forward slides in from the right,
  // back slides in from the left; the first render doesn't animate.
  const [backAnim, setBackAnim] = useState(false);

  useEffect(() => {
    if (open) {
      setTarget(proteinTarget !== null ? String(proteinTarget) : "");
      setFatT(fatTarget !== null ? String(fatTarget) : "");
      setView(startAtLogin ? "account" : "settings");
      setSession(loadSession());
      setLastBackup(lastBackupAt());
      setSyncNote(null);
      setForm(startAtLogin ? "login" : "none");
      setEmail("");
      setPassword("");
      setFormError(null);
      setConfirmDelete(false);
      setBackAnim(false);
    }
  }, [open, proteinTarget, fatTarget, startAtLogin]);

  const commitTarget = () => {
    const parsed = parseProtein(target);
    if (parsed === undefined) {
      // Invalid input: fall back to what's stored.
      setTarget(proteinTarget !== null ? String(proteinTarget) : "");
      setFatT(fatTarget !== null ? String(fatTarget) : "");
      return;
    }
    onSetProteinTarget(parsed === 0 ? null : parsed);
  };

  const commitFatTarget = () => {
    const parsed = parseProtein(fatT);
    if (parsed === undefined) {
      setFatT(fatTarget !== null ? String(fatTarget) : "");
      return;
    }
    onSetFatTarget(parsed === 0 ? null : parsed);
  };

  const openForm = (which: AccountForm) => {
    setForm(which);
    setEmail("");
    setPassword("");
    setFormError(null);
    setSuggestion(null);
    setShowPassword(false);
  };

  /** Run the actual create/login once the address is settled. */
  const finishSubmit = async (emailValue: string) => {
    setBusy(true);
    try {
      if (form === "create") {
        const result = await signUp(emailValue, password);
        if (!result.ok) {
          setFormError(result.problem);
        } else if (result.needsConfirmation) {
          setAwaitingVerify(emailValue);
          setForm("none");
        } else {
          setSession(loadSession());
          setForm("none");
        }
      } else {
        const result = await signIn(emailValue, password);
        if (result.ok) {
          setSession(result.session);
          setAwaitingVerify(null);
          setForm("none");
        } else if (result.unverified) {
          // Their account exists but the inbox link never got clicked
          // (or the email is long gone) — the verify pane has Resend.
          setAwaitingVerify(emailValue);
          setSyncNote(null);
          setForm("none");
        } else {
          setFormError(result.problem);
        }
      }
    } finally {
      setBusy(false);
    }
  };

  const backUpNow = async () => {
    if (busy) return;
    setBusy(true);
    setSyncNote(null);
    try {
      const result = await pushBackup(getBackup());
      if (result.ok) {
        rememberLastBackup(result.updatedAt);
        setLastBackup(result.updatedAt);
        setSyncNote("Backed up.");
      } else {
        setSyncNote(result.problem);
      }
    } finally {
      setBusy(false);
    }
  };

  const restoreNow = async () => {
    if (busy) return;
    setBusy(true);
    setSyncNote(null);
    try {
      const result = await pullBackup();
      if (!result.ok) {
        setSyncNote(result.problem);
        return;
      }
      if (result.payload === null) {
        setSyncNote("No backup on the server yet. Back up first.");
        return;
      }
      const backup = parseBackup(JSON.stringify(result.payload));
      if (!backup) {
        setSyncNote("The server backup looks damaged. Nothing was changed.");
        return;
      }
      const merged = onRestore(backup);
      setSyncNote(
        merged.addedEntries === 0 && merged.addedItems === 0
          ? "Already up to date — nothing new in the backup."
          : `Restored ${merged.addedEntries} entr${
              merged.addedEntries === 1 ? "y" : "ies"
            } and ${merged.addedItems} menu item${
              merged.addedItems === 1 ? "" : "s"
            }.`,
      );
      // Push the merged whole back so the server copy is the union too.
      // Settings come from the backup we just applied (React hasn't
      // flushed the state yet, so loadSettings() would race it).
      const push = await pushBackup(
        buildBackup(merged.entries, merged.menu, backup.settings),
      );
      if (push.ok) {
        rememberLastBackup(push.updatedAt);
        setLastBackup(push.updatedAt);
      }
    } finally {
      setBusy(false);
    }
  };

  const submitAccount = async (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    const emProblem = emailProblem(email);
    if (emProblem) {
      setFormError(emProblem);
      return;
    }
    const pwProblem = passwordProblem(password);
    if (form === "create" && pwProblem) {
      setFormError(pwProblem);
      return;
    }
    // Well-formed but suspicious (gmail.con and friends): offer the fix
    // once instead of silently accepting an address mail can't reach.
    if (form === "create" && !suggestion) {
      const fix = suggestEmailFix(email);
      if (fix) {
        setSuggestion(fix);
        return;
      }
    }
    await finishSubmit(email);
  };

  const signedIn = session !== null;

  const accountPane = (
    <div className="pane pane-enter" key="account">
      <button
        type="button"
        className="drill-back"
        onClick={() => {
          setBackAnim(true);
          setView("settings");
          setForm("none");
          setConfirmDelete(false);
        }}
      >
        <span aria-hidden="true">‹</span> Settings
      </button>

      {signedIn && session ? (
        <>
          <div className="acct-card">
            <div className="acct-avatar" aria-hidden="true">
              {session.user.email[0].toUpperCase()}
            </div>
            <div className="acct-id">
              <span className="acct-email">{session.user.email}</span>
              <span className="acct-since">
                Since{" "}
                {new Date(session.user.createdAt).toLocaleDateString(
                  undefined,
                  { month: "long", day: "numeric", year: "numeric" },
                )}
                {session.user.verified ? " · verified" : " · unverified"}
              </span>
            </div>
          </div>
          <div className="settings-row">
            <div className="settings-row-text">
              <span className="settings-row-title">Last backed up</span>
              <span className="settings-row-sub">
                {lastBackup
                  ? new Date(lastBackup).toLocaleString(undefined, {
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })
                  : "Not yet."}
              </span>
            </div>
            <span className="beta-chip">Beta</span>
          </div>
          <div className="sheet-actions">
            <button
              type="button"
              className="add-submit"
              onClick={() => void backUpNow()}
              disabled={busy}
            >
              Back up now
            </button>
            <button
              type="button"
              className="sheet-secondary quiet"
              onClick={() => void restoreNow()}
              disabled={busy}
            >
              Restore from backup
            </button>
          </div>
          {syncNote && (
            <p className="acct-note" role="status">
              {syncNote}
            </p>
          )}
          <div className="sheet-actions">
            <button
              type="button"
              className="sheet-secondary quiet"
              onClick={() => {
                void signOut();
                setSession(null);
                setSyncNote(null);
              }}
            >
              Log out
            </button>
            <button
              type="button"
              className="sheet-secondary"
              disabled={busy}
              onClick={() => {
                if (!confirmDelete) {
                  setConfirmDelete(true);
                  return;
                }
                setConfirmDelete(false);
                setBusy(true);
                void deleteAccount()
                  .then((result) => {
                    if (result.ok) {
                      clearLastBackup();
                      setLastBackup(null);
                      setSession(null);
                      setSyncNote(null);
                    } else {
                      setSyncNote(result.problem);
                    }
                  })
                  .finally(() => setBusy(false));
              }}
            >
              {confirmDelete
                ? "Tap again to delete your account"
                : "Delete account"}
            </button>
          </div>
          {confirmDelete && (
            <p className="acct-note" role="alert">
              Deletes your account and your server backup, permanently and
              immediately. Your entries, menu, and settings stay on this
              phone.
            </p>
          )}

        </>
      ) : awaitingVerify && form === "none" ? (
        <>
          <p className="sheet-sub">
            We sent a verification link to{" "}
            <strong>{awaitingVerify}</strong>. Tap it, then come back and
            log in.
          </p>
          <div className="sheet-actions">
            <button
              type="button"
              className="add-submit"
              onClick={() => openForm("login")}
            >
              Verified? Log in
            </button>
            <button
              type="button"
              className="sheet-secondary quiet"
              disabled={busy}
              onClick={() => {
                setBusy(true);
                void resendConfirmation(awaitingVerify)
                  .then((result) =>
                    setSyncNote(
                      result.ok
                        ? "Verification email sent again."
                        : result.problem,
                    ),
                  )
                  .finally(() => setBusy(false));
              }}
            >
              Resend the email
            </button>
            <button
              type="button"
              className="sheet-secondary quiet"
              onClick={() => {
                // Escape hatch: typo'd address, or changed your mind.
                setAwaitingVerify(null);
                setSyncNote(null);
                setForm("none");
              }}
            >
              Wrong address? Start over
            </button>
          </div>
          {syncNote && (
            <p className="acct-note" role="status">
              {syncNote}
            </p>
          )}
        </>
      ) : form === "none" ? (
        <>
          <p className="sheet-sub">
            Keep your data safe beyond this phone. Back up to your
            account, restore on any device.
          </p>
          <div className="sheet-actions">
            <button
              type="button"
              className="add-submit"
              onClick={() => openForm("create")}
            >
              Create account
            </button>
            <button
              type="button"
              className="sheet-secondary quiet"
              onClick={() => openForm("login")}
            >
              Log in
            </button>
          </div>
        </>
      ) : (
        <>
          <p className="sheet-sub">
            {form === "create"
              ? "Just an email and a password. No name, no photo, no fuss."
              : "Welcome back."}
          </p>
          <form onSubmit={submitAccount} noValidate>
            <div className="field sheet-name">
              <input
                type="email"
                inputMode="email"
                autoComplete="email"
                autoCapitalize="none"
                spellCheck={false}
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setFormError(null);
                  setSuggestion(null);
                }}
                placeholder="you@example.com"
                aria-label="Email address"
              />
            </div>
            <div className="field sheet-name">
              <input
                type={showPassword ? "text" : "password"}
                autoComplete={
                  form === "create" ? "new-password" : "current-password"
                }
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setFormError(null);
                }}
                placeholder={
                  form === "create" ? "Password (8+ characters)" : "Password"
                }
                aria-label="Password"
              />
              <button
                type="button"
                className="pw-toggle"
                onClick={() => setShowPassword((s) => !s)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                aria-pressed={showPassword}
              >
                {showPassword ? (
                  <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                    <path
                      d="M2.5 10s2.8-5 7.5-5 7.5 5 7.5 5-2.8 5-7.5 5-7.5-5-7.5-5z"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinejoin="round"
                    />
                    <circle
                      cx="10"
                      cy="10"
                      r="2.4"
                      stroke="currentColor"
                      strokeWidth="1.5"
                    />
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                    <path
                      d="M3.5 8.5c1.6 1.9 3.9 3.25 6.5 3.25s4.9-1.35 6.5-3.25M10 12v2.25M5.4 11.2l-1.4 1.9M14.6 11.2l1.4 1.9"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                  </svg>
                )}
              </button>
            </div>
            {suggestion ? (
              <div className="acct-suggest" role="alert">
                <p>
                  Did you mean <strong>{suggestion}</strong>?
                </p>
                <div className="suggest-actions">
                  <button
                    type="button"
                    className="suggest-use"
                    onClick={() => {
                      setEmail(suggestion);
                      setSuggestion(null);
                      void finishSubmit(suggestion);
                    }}
                  >
                    Yes, use that
                  </button>
                  <button
                    type="button"
                    className="suggest-keep"
                    onClick={() => {
                      setSuggestion(null);
                      void finishSubmit(email);
                    }}
                  >
                    Keep what I typed
                  </button>
                </div>
              </div>
            ) : (
              formError && (
                <p className="add-error" role="alert">
                  {formError}
                </p>
              )
            )}
            <div className="sheet-actions">
              <button type="submit" className="add-submit" disabled={busy}>
                {form === "create" ? "Create account" : "Log in"}
              </button>
              {form === "login" && (
                <button
                  type="button"
                  className="sheet-secondary quiet"
                  disabled={busy}
                  onClick={() => {
                    const problem = emailProblem(email);
                    if (problem) {
                      setFormError(
                        "Enter your email above first, then tap this.",
                      );
                      return;
                    }
                    setBusy(true);
                    void requestPasswordReset(email)
                      .then((result) =>
                        setFormError(
                          result.ok
                            ? "Reset email sent. Set a new password there, then log in here."
                            : result.problem,
                        ),
                      )
                      .finally(() => setBusy(false));
                  }}
                >
                  Forgot password?
                </button>
              )}
              <button
                type="button"
                className="sheet-secondary quiet"
                onClick={() => openForm("none")}
              >
                Cancel
              </button>
            </div>
          </form>

        </>
      )}
    </div>
  );

  const settingsPane = (
    <div
      className={`pane${backAnim ? " pane-enter-back" : ""}`}
      key="settings"
    >
      <p className="settings-label">Appearance</p>
      <div className="seg" role="radiogroup" aria-label="Appearance">
        {THEME_OPTIONS.map((o) => (
          <button
            key={o.id}
            role="radio"
            aria-checked={theme === o.id}
            className={`seg-btn${theme === o.id ? " active" : ""}`}
            onClick={() => onSetTheme(o.id)}
          >
            {o.label}
          </button>
        ))}
      </div>

      <p className="settings-label">Accent</p>
      <div className="accent-row" role="radiogroup" aria-label="Accent color">
        {ACCENT_OPTIONS.map((o) => (
          <button
            key={o.id}
            role="radio"
            aria-checked={accent === o.id}
            className={`accent-btn${accent === o.id ? " active" : ""}`}
            onClick={() => onSetAccent(o.id)}
          >
            <span className={`accent-dot ${o.id}`} aria-hidden="true" />
            {o.label}
          </button>
        ))}
      </div>

      <p className="settings-label">Advanced tracking</p>
      <div className="settings-row">
        <div className="settings-row-text">
          <span className="settings-row-title">Track macros</span>
          <span className="settings-row-sub">
            Adds protein and fat to menu items and entries.
          </span>
        </div>
        <button
          className={`switch${trackProtein ? " on" : ""}`}
          role="switch"
          aria-checked={trackProtein}
          aria-label="Advanced tracking"
          onClick={() => onSetTrackProtein(!trackProtein)}
        >
          <span className="switch-knob" />
        </button>
      </div>
      {trackProtein && (
        <div className="settings-row">
          <div className="settings-row-text">
            <span className="settings-row-title">Daily protein target</span>
            <span className="settings-row-sub">Blank for no target.</span>
          </div>
          <div className="field field-cal settings-target">
            <input
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              onBlur={commitTarget}
              onKeyDown={(e) => {
                if (e.key === "Enter") (e.target as HTMLInputElement).blur();
              }}
              inputMode="numeric"
              aria-label="Daily protein target in grams"
            />
            <span className="unit">g</span>
          </div>
        </div>
      )}
      {trackProtein && (
        <div className="settings-row">
          <div className="settings-row-text">
            <span className="settings-row-title">Daily fat target</span>
            <span className="settings-row-sub">Blank for no target.</span>
          </div>
          <div className="field field-cal settings-target">
            <input
              value={fatT}
              onChange={(e) => setFatT(e.target.value)}
              onBlur={commitFatTarget}
              onKeyDown={(e) => {
                if (e.key === "Enter") (e.target as HTMLInputElement).blur();
              }}
              inputMode="numeric"
              aria-label="Daily fat target in grams"
            />
            <span className="unit">g</span>
          </div>
        </div>
      )}

      <p className="settings-label">Weight</p>
      <div className="settings-row">
        <div className="settings-row-text">
          <span className="settings-row-title">Track weight</span>
          <span className="settings-row-sub">
            Track your weight and view trends over time.
          </span>
        </div>
        <button
          className={`switch${trackWeight ? " on" : ""}`}
          role="switch"
          aria-checked={trackWeight}
          aria-label="Track weight"
          onClick={() => onSetTrackWeight(!trackWeight)}
        >
          <span className="switch-knob" />
        </button>
      </div>

      <p className="settings-label">Account</p>
      <button
        type="button"
        className="settings-row settings-link"
        onClick={() => setView("account")}
      >
        <div className="settings-row-text">
          <span className="settings-row-title">
            {signedIn && session ? session.user.email : "Account"}
          </span>
          <span className="settings-row-sub">
            {signedIn && session
              ? session.user.verified
                ? "Signed in · sync beta"
                : "Signed in · verify your email"
              : "Optional. Back up your data beyond this phone."}
          </span>
        </div>
        {signedIn && session ? (
          <span className="settings-icon avatar" aria-hidden="true">
            {session.user.email[0].toUpperCase()}
          </span>
        ) : (
          <span className="settings-icon" aria-hidden="true">
            <svg width="15" height="15" viewBox="0 0 20 20" fill="none">
              <circle
                cx="10"
                cy="7"
                r="3.1"
                stroke="currentColor"
                strokeWidth="1.6"
              />
              <path
                d="M4.2 16.4c1-2.6 3.2-4 5.8-4s4.8 1.4 5.8 4"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
            </svg>
          </span>
        )}
        <span className="chevron" aria-hidden="true">
          ›
        </span>
      </button>

      <p className="settings-foot">
        Tally v{__APP_VERSION__} · your data stays on this device unless
        you turn on account sync.
        <br />
        File backups live in the History tab.
      </p>
    </div>
  );

  return (
    <Sheet
      open={open}
      title={view === "account" ? "Account" : "Settings"}
      onClose={onClose}
    >
      {view === "account" ? accountPane : settingsPane}
    </Sheet>
  );
}
