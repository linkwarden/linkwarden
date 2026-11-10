import { describe, expect, it } from "vitest";
import { verificationCodeFromInput } from "./verificationCode";

describe("verificationCodeFromInput", () => {
  it("keeps typed digits", () => {
    expect(verificationCodeFromInput("", "1")).toBe("1");
    expect(verificationCodeFromInput("12", "123")).toBe("123");
    expect(verificationCodeFromInput("123456", "12345")).toBe("12345");
    expect(verificationCodeFromInput("1", "")).toBe("");
  });

  it("drops anything that isn't a digit", () => {
    expect(verificationCodeFromInput("12", "12a")).toBe("12");
    expect(verificationCodeFromInput("", "123 456")).toBe("123456");
    expect(verificationCodeFromInput("", "123-456")).toBe("123456");
    expect(verificationCodeFromInput("", " 123456\n")).toBe("123456");
    expect(verificationCodeFromInput("", "Your code is 123456")).toBe("123456");
  });

  it("ignores digits typed into a full code", () => {
    expect(verificationCodeFromInput("123456", "1234567")).toBe("123456");
  });

  it("replaces a partly typed code with a pasted one", () => {
    expect(verificationCodeFromInput("1", "1987654")).toBe("987654");
    expect(verificationCodeFromInput("123", "123987654")).toBe("987654");
    expect(verificationCodeFromInput("111", "111111222")).toBe("111222");
    expect(verificationCodeFromInput("12", "12 987 654")).toBe("987654");
  });

  it("replaces a full code with a pasted one", () => {
    expect(verificationCodeFromInput("123456", "123456987654")).toBe("987654");
    expect(verificationCodeFromInput("123456", "987654")).toBe("987654");
  });

  it("keeps the first six digits of a longer paste", () => {
    expect(verificationCodeFromInput("", "1234567890")).toBe("123456");
    expect(verificationCodeFromInput("12", "121234567890")).toBe("123456");
  });

  it("adds a short paste to what was typed", () => {
    expect(verificationCodeFromInput("123", "123456")).toBe("123456");
    expect(verificationCodeFromInput("1234", "1234567")).toBe("123456");
  });
});
