/**
 * Email and password validators, shared by the account UI. The local-only
 * account record that used to live here (the v2.3 beta) was retired when
 * real server accounts arrived — see src/lib/sync.ts and docs/SYNC.md.
 */

/**
 * Returns a user-facing problem with the email's shape, or null if it
 * looks sendable. True existence can only be proven by a verification
 * email once the server exists; this catches what's catchable offline.
 */
export function emailProblem(email: string): string | null {
  const e = email.trim();
  if (!e) return "Enter your email address.";
  if (e.length > 254) return "That email address is too long.";
  const match = /^([^\s@]+)@([^\s@]+\.[A-Za-z]{2,})$/.exec(e);
  if (!match || e.includes("..")) {
    return "That doesn't look like an email address.";
  }
  if (match[1].length > 64) return "That email address is too long.";
  return null;
}

export function isValidEmail(value: string): boolean {
  return emailProblem(value) === null;
}

/**
 * Catch the classic domain typos that pass every shape check but would
 * orphan the account the day sync arrives (gmail.con, hotnail.com, …).
 * Returns the corrected address, or null when nothing looks off.
 */
const DOMAIN_FIXES: Record<string, string> = {
  "gmial.com": "gmail.com",
  "gamil.com": "gmail.com",
  "gmali.com": "gmail.com",
  "gmai.com": "gmail.com",
  "gnail.com": "gmail.com",
  "gmail.co": "gmail.com",
  "hotmial.com": "hotmail.com",
  "hotnail.com": "hotmail.com",
  "hotmai.com": "hotmail.com",
  "hotmail.co": "hotmail.com",
  "outlok.com": "outlook.com",
  "outloook.com": "outlook.com",
  "outlook.co": "outlook.com",
  "yaho.com": "yahoo.com",
  "yhaoo.com": "yahoo.com",
  "yahooo.com": "yahoo.com",
  "iclod.com": "icloud.com",
  "icloud.co": "icloud.com",
  "protonmail.co": "protonmail.com",
  "proton.mee": "proton.me",
};

export function suggestEmailFix(email: string): string | null {
  const e = email.trim().toLowerCase();
  const at = e.lastIndexOf("@");
  if (at < 1) return null;
  const local = e.slice(0, at);
  const domain = e.slice(at + 1);
  let fixed = DOMAIN_FIXES[domain];
  if (!fixed) {
    // Transposed/mistyped ".com" endings on any domain.
    const dot = domain.lastIndexOf(".");
    if (dot > 0) {
      const tld = domain.slice(dot + 1);
      if (tld === "con" || tld === "cmo" || tld === "ocm" || tld === "comm") {
        fixed = `${domain.slice(0, dot)}.com`;
      }
    }
  }
  if (!fixed || fixed === domain) return null;
  return `${local}@${fixed}`;
}

/** Returns a user-facing problem with the password, or null if it's fine. */
export function passwordProblem(password: string): string | null {
  if (password.length < 8) return "Use at least 8 characters.";
  return null;
}
