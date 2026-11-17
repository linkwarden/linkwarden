import { afterEach, describe, expect, it } from "vitest";
import {
  isNewSsoUsersDisabled,
  isRegistrationDisabled,
  parseBooleanEnv,
} from "./registration";

describe("parseBooleanEnv", () => {
  it("accepts true", () => {
    expect(parseBooleanEnv("true")).toBe(true);
  });

  it("ignores case and surrounding whitespace", () => {
    expect(parseBooleanEnv(" TRUE ")).toBe(true);
    expect(parseBooleanEnv("True\r")).toBe(true);
  });

  it("accepts values wrapped in quotes", () => {
    expect(parseBooleanEnv('"true"')).toBe(true);
    expect(parseBooleanEnv("'true'")).toBe(true);
  });

  it("accepts 1, yes and on", () => {
    expect(parseBooleanEnv("1")).toBe(true);
    expect(parseBooleanEnv("yes")).toBe(true);
    expect(parseBooleanEnv("on")).toBe(true);
  });

  it("treats empty, missing and other values as false", () => {
    expect(parseBooleanEnv(undefined)).toBe(false);
    expect(parseBooleanEnv("")).toBe(false);
    expect(parseBooleanEnv("false")).toBe(false);
    expect(parseBooleanEnv("0")).toBe(false);
    expect(parseBooleanEnv('"true')).toBe(false);
  });
});

describe("isRegistrationDisabled", () => {
  const original = process.env.NEXT_PUBLIC_DISABLE_REGISTRATION;

  afterEach(() => {
    if (original === undefined)
      delete process.env.NEXT_PUBLIC_DISABLE_REGISTRATION;
    else process.env.NEXT_PUBLIC_DISABLE_REGISTRATION = original;
  });

  it("reads the variable at call time", () => {
    delete process.env.NEXT_PUBLIC_DISABLE_REGISTRATION;
    expect(isRegistrationDisabled()).toBe(false);

    process.env.NEXT_PUBLIC_DISABLE_REGISTRATION = '"true"';
    expect(isRegistrationDisabled()).toBe(true);
  });
});

describe("isNewSsoUsersDisabled", () => {
  const original = {
    registration: process.env.NEXT_PUBLIC_DISABLE_REGISTRATION,
    sso: process.env.DISABLE_NEW_SSO_USERS,
  };

  afterEach(() => {
    for (const [key, value] of [
      ["NEXT_PUBLIC_DISABLE_REGISTRATION", original.registration],
      ["DISABLE_NEW_SSO_USERS", original.sso],
    ] as const) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  });

  it("is enabled when nothing is set", () => {
    delete process.env.NEXT_PUBLIC_DISABLE_REGISTRATION;
    delete process.env.DISABLE_NEW_SSO_USERS;
    expect(isNewSsoUsersDisabled()).toBe(false);
  });

  it("follows DISABLE_NEW_SSO_USERS", () => {
    delete process.env.NEXT_PUBLIC_DISABLE_REGISTRATION;
    process.env.DISABLE_NEW_SSO_USERS = "true";
    expect(isNewSsoUsersDisabled()).toBe(true);
    expect(isRegistrationDisabled()).toBe(false);
  });

  it("is disabled together with registration", () => {
    process.env.NEXT_PUBLIC_DISABLE_REGISTRATION = "true";
    delete process.env.DISABLE_NEW_SSO_USERS;
    expect(isNewSsoUsersDisabled()).toBe(true);
  });
});
