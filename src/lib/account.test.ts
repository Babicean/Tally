import { describe, expect, it } from "vitest";
import {
  emailProblem,
  isValidEmail,
  passwordProblem,
  suggestEmailFix,
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
    expect(isValidEmail("double..dot@example.com")).toBe(false);
    expect(isValidEmail("numeric-tld@example.1x")).toBe(false);
  });

  it("explains each problem", () => {
    expect(emailProblem("")).toBe("Enter your email address.");
    expect(emailProblem("x".repeat(255) + "@a.com")).toContain("too long");
    expect(emailProblem("x".repeat(70) + "@a.com")).toContain("too long");
    expect(emailProblem("nope")).toContain("doesn't look like");
    expect(emailProblem("mo@example.com")).toBeNull();
  });
});

describe("suggestEmailFix", () => {
  it("catches classic domain typos", () => {
    expect(suggestEmailFix("mo@gmial.com")).toBe("mo@gmail.com");
    expect(suggestEmailFix("mo@hotnail.com")).toBe("mo@hotmail.com");
    expect(suggestEmailFix("mo@yaho.com")).toBe("mo@yahoo.com");
    expect(suggestEmailFix("mo@gmail.co")).toBe("mo@gmail.com");
  });

  it("fixes mistyped .com endings on any domain", () => {
    expect(suggestEmailFix("mo@example.con")).toBe("mo@example.com");
    expect(suggestEmailFix("mo@example.cmo")).toBe("mo@example.com");
    expect(suggestEmailFix("mo@example.ocm")).toBe("mo@example.com");
  });

  it("leaves plausible addresses alone", () => {
    expect(suggestEmailFix("mo@gmail.com")).toBeNull();
    expect(suggestEmailFix("mo@example.co.uk")).toBeNull();
    expect(suggestEmailFix("mo@proton.me")).toBeNull();
    expect(suggestEmailFix("garbage")).toBeNull();
  });
});

describe("passwordProblem", () => {
  it("requires eight characters", () => {
    expect(passwordProblem("short")).not.toBeNull();
    expect(passwordProblem("longenough")).toBeNull();
  });
});
