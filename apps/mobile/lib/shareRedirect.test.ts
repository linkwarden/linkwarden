import { describe, expect, it } from "vitest";
import { shouldOpenIncoming } from "./shareRedirect";

const url = "https://example.com/shared";

const state = (
  overrides: Partial<Parameters<typeof shouldOpenIncoming>[0]>
) => ({
  pathname: "/",
  hasShareIntent: false,
  sharedUrl: "",
  incomingShownFor: null,
  redirectedFrom: null,
  ...overrides,
});

describe("opening /incoming for a shared link", () => {
  it("opens it when a share comes in", () => {
    expect(shouldOpenIncoming(state({ hasShareIntent: true }))).toBe(true);
    expect(
      shouldOpenIncoming(
        state({ pathname: "/dashboard", hasShareIntent: true })
      )
    ).toBe(true);
  });

  it("opens it for the iOS share extension's link", () => {
    expect(
      shouldOpenIncoming(state({ pathname: "/dataUrl=linkwardenShareKey" }))
    ).toBe(true);
  });

  it("doesn't open it again from the screen it was already opened from", () => {
    expect(
      shouldOpenIncoming(
        state({ sharedUrl: url, redirectedFrom: "/", hasShareIntent: true })
      )
    ).toBe(false);
    expect(
      shouldOpenIncoming(state({ sharedUrl: url, redirectedFrom: "/" }))
    ).toBe(false);
  });

  it("opens it again when another redirect moved the app before /incoming showed up", () => {
    expect(
      shouldOpenIncoming(
        state({ pathname: "/dashboard", sharedUrl: url, redirectedFrom: "/" })
      )
    ).toBe(true);
    expect(
      shouldOpenIncoming(
        state({
          pathname: "/subscribe",
          sharedUrl: url,
          redirectedFrom: "/dashboard",
        })
      )
    ).toBe(true);
  });

  it("leaves a link alone once /incoming has opened with it", () => {
    // /incoming sends signed-out users back to the login screen
    expect(
      shouldOpenIncoming(state({ sharedUrl: url, incomingShownFor: url }))
    ).toBe(false);
    expect(
      shouldOpenIncoming(
        state({ pathname: "/dashboard", sharedUrl: url, incomingShownFor: url })
      )
    ).toBe(false);
  });

  it("opens it for a new link after an earlier one was shown", () => {
    expect(
      shouldOpenIncoming(
        state({
          pathname: "/dashboard",
          sharedUrl: "https://example.com/next",
          incomingShownFor: url,
        })
      )
    ).toBe(true);
  });

  it("does nothing on /incoming or when no link is waiting", () => {
    expect(
      shouldOpenIncoming(
        state({ pathname: "/incoming", hasShareIntent: true, sharedUrl: url })
      )
    ).toBe(false);
    expect(shouldOpenIncoming(state({ pathname: "/dashboard" }))).toBe(false);
    expect(
      shouldOpenIncoming(
        state({ pathname: "/dashboard", incomingShownFor: url })
      )
    ).toBe(false);
  });
});
