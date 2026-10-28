import { afterEach, describe, expect, it } from "vitest";
import { isRegistrationDisabled, parseBooleanEnv } from "./registration";

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
