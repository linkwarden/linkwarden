import { describe, expect, it } from "vitest";
import { shouldOpenIncoming } from "./shareRedirect";

// Drives shouldOpenIncoming the way app/_layout.tsx does: the shared link
// lives in the data store (module state, kept for as long as the JS runtime),
// while the two refs belong to one mount of the root layout.
const createApp = () => {
  const store = { url: "" };

  const mountRoot = () => {
    const refs = {
      redirectedFrom: null as string | null,
      incomingShownFor: null as string | null,
    };

    // One run of the root layout's effect. Returns where it navigates, if anywhere.
    const effect = (pathname: string, hasShareIntent = false) => {
      if (pathname === "/incoming") {
        refs.redirectedFrom = null;
        refs.incomingShownFor = store.url;
        return null;
      }

      if (
        shouldOpenIncoming({
          pathname,
          hasShareIntent,
          sharedUrl: store.url,
          incomingShownFor: refs.incomingShownFor,
          redirectedFrom: refs.redirectedFrom,
        })
      ) {
        refs.redirectedFrom = pathname;
        return "/incoming";
      }

      return null;
    };

    return { effect };
  };

  return { store, mountRoot };
};

const url = "https://example.com/shared";

describe("share redirects across a whole flow", () => {
  it("opens /incoming once for a share while signed in, then never again", () => {
    const app = createApp();
    const root = app.mountRoot();

    app.store.url = url;
    expect(root.effect("/dashboard", true)).toBe("/incoming");
    // the store update re-runs the effect before the navigation lands
    expect(root.effect("/dashboard")).toBe(null);
    expect(root.effect("/incoming")).toBe(null);

    // /incoming saved it, cleared the store and went to the dashboard
    app.store.url = "";
    expect(root.effect("/incoming")).toBe(null);
    expect(root.effect("/dashboard")).toBe(null);
    expect(root.effect("/links/1")).toBe(null);
  });

  it("follows the index screen's redirect to the dashboard on a cold start", () => {
    const app = createApp();
    const root = app.mountRoot();

    app.store.url = url;
    expect(root.effect("/", true)).toBe("/incoming");
    expect(root.effect("/")).toBe(null);
    expect(root.effect("/dashboard")).toBe("/incoming");
    expect(root.effect("/dashboard")).toBe(null);
    expect(root.effect("/incoming")).toBe(null);
  });

  it("keeps a signed-out user on the login screen, also after signing in", () => {
    const app = createApp();
    const root = app.mountRoot();

    app.store.url = url;
    expect(root.effect("/", true)).toBe("/incoming");
    expect(root.effect("/incoming")).toBe(null);
    // /incoming redirects signed-out users to "/"
    expect(root.effect("/")).toBe(null);
    // signing in
    expect(root.effect("/dashboard")).toBe(null);
  });

  it("opens /incoming again for the same link shared a second time", () => {
    const app = createApp();
    const root = app.mountRoot();

    app.store.url = url;
    root.effect("/dashboard", true);
    root.effect("/incoming");
    app.store.url = "";
    root.effect("/incoming");
    root.effect("/dashboard");

    app.store.url = url;
    expect(root.effect("/dashboard", true)).toBe("/incoming");
  });

  it("opens /incoming for each iOS share, which all arrive on the same path", () => {
    const app = createApp();
    const root = app.mountRoot();
    const dataUrl = "/dataUrl=linkwardenShareKey";

    expect(root.effect(dataUrl)).toBe("/incoming");
    expect(root.effect("/incoming")).toBe(null);
    app.store.url = url;
    expect(root.effect("/incoming")).toBe(null);
    app.store.url = "";
    root.effect("/incoming");
    root.effect("/dashboard");

    expect(root.effect(dataUrl)).toBe("/incoming");
  });

  // Fails on f64c8bea: the refs reset with the root layout, the store doesn't,
  // so the leftover link is opened (and saved, if signed in by then).
  // Reproduced on the Pixel_9 emulator with a back press and a font size change.
  it.fails(
    "after a share left the store unsaved, a new root layout in the same runtime doesn't open /incoming without a share",
    () => {
      const app = createApp();
      const first = app.mountRoot();

      // shared while signed out: /incoming sent the user back to "/"
      app.store.url = url;
      first.effect("/", true);
      first.effect("/incoming");
      first.effect("/");
      first.effect("/dashboard");

      // Android recreates MainActivity (back press on a task a share started,
      // language or font size change) and React mounts the root layout again,
      // in the same JS runtime, so the store still has the link.
      const second = app.mountRoot();
      expect(second.effect("/")).toBe(null);
      expect(second.effect("/dashboard")).toBe(null);
    }
  );
});
