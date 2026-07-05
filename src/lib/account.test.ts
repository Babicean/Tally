import { describe, expect, it } from "vitest";
import {
  hashPassword,
  isValidEmail,
  makeSalt,
  parseAccountState,
  passwordProblem,
} from "./account";

describe("isValidEmail", () => {
  it("accepts ordinary addresses", () => {
    expect(isValidEmail("mo@example.com")).toBe(true);
    expect(isValidEmail("  padded@mail.co.uk ")).toBe(true);
  });

  it("rejects things that are not addresses", () => {
    expect(isValidEmail("")).toBe(false);
    expect(isValidEmail("no-at-sign")).toBe(false);
    expect(isValidEmail("two@@example.com")).toBe(false);
    expect(isValidEmail("nodot@example")).toBe(false);
    expect(isValidEmail("spaces in@example.com")).toBe(false);
  });
});

describe("passwordProblem", () => {
  it("requires eight characters", () => {
    expect(passwordProblem("short")).not.toBeNull();
    expect(passwordProblem("longenough")).toBeNull();
  });
});

describe("hashing", () => {
  it("is deterministic for the same password and salt", async () => {
    const salt = makeSalt();
    const a = await hashPassword("hunter22", salt);
    const b = await hashPassword("hunter22", salt);
    expect(a).toBe(b);
    expect(a).toMatch(/^[0-9a-f]{64}$/);
  });

  it("differs across salts and passwords", async () => {
    const salt = makeSalt();
    expect(await hashPassword("hunter22", salt)).not.toBe(
      await hashPassword("hunter23", salt),
    );
    expect(await hashPassword("hunter22", salt)).not.toBe(
      await hashPassword("hunter22", makeSalt()),
    );
  });

  it("makes unique 32-hex-char salts", () => {
    const salt = makeSalt();
    expect(salt).toMatch(/^[0-9a-f]{32}$/);
    expect(makeSalt()).not.toBe(salt);
  });
});

describe("parseAccountState", () => {
  const account = {
    email: "mo@example.com",
    passwordHash: "ab".repeat(32),
    salt: "cd".repeat(16),
    createdAt: 1751500000000,
    lastBackupAt: null,
  };

  it("round-trips a stored state", () => {
    const raw = JSON.stringify({
      version: 1,
      state: { account, signedIn: true },
    });
    const parsed = parseAccountState(raw);
    expect(parsed.account?.email).toBe("mo@example.com");
    expect(parsed.signedIn).toBe(true);
  });

  it("treats missing or corrupt data as no account", () => {
    expect(parseAccountState(null).account).toBeNull();
    expect(parseAccountState("not json").account).toBeNull();
    expect(parseAccountState("{}").account).toBeNull();
    expect(
      parseAccountState(
        JSON.stringify({ version: 1, state: { account: { email: 5 } } }),
      ).account,
    ).toBeNull();
  });

  it("never reports signed in without an account record", () => {
    const raw = JSON.stringify({
      version: 1,
      state: { account: null, signedIn: true },
    });
    expect(parseAccountState(raw).signedIn).toBe(false);
  });
});
