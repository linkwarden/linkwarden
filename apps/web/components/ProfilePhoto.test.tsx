// @vitest-environment jsdom
import React, { act } from "react";
import { createRoot, Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import ProfilePhoto from "./ProfilePhoto";

// Uses the real next/image: it reports a load through onLoad both for a load
// event and for an image that's already complete when it mounts (cached).

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

const render = async (props: React.ComponentProps<typeof ProfilePhoto>) => {
  await act(async () => root.render(<ProfilePhoto {...props} />));
};

const avatar = () => container.firstElementChild as HTMLElement;
const img = () => container.querySelector("img");
// next/image re-assigns img.src, which makes it absolute.
const path = () => new URL(img()!.getAttribute("src")!, location.href).pathname;
const shimmering = () => avatar().classList.contains("skeleton");

const fire = async (target: HTMLImageElement, type: "load" | "error") => {
  // next/image hands a load on after img.decode() settles, a microtask later.
  await act(async () => {
    target.dispatchEvent(new Event(type));
  });
};

describe("ProfilePhoto", () => {
  it("shimmers while the photo loads and stops once it has loaded", async () => {
    await render({ src: "uploads/avatar/1.jpg" });

    expect(path()).toBe("/api/v1/avatar/1");
    expect(shimmering()).toBe(true);

    await fire(img()!, "load");

    expect(shimmering()).toBe(false);
    expect(img()).not.toBeNull();
  });

  it("doesn't shimmer over a photo the browser already has", async () => {
    const complete = Object.getOwnPropertyDescriptor(
      HTMLImageElement.prototype,
      "complete"
    );
    Object.defineProperty(HTMLImageElement.prototype, "complete", {
      configurable: true,
      get: () => true,
    });

    try {
      await render({ src: "https://example.test/cached.jpg" });
    } finally {
      Object.defineProperty(HTMLImageElement.prototype, "complete", complete!);
    }

    expect(img()?.getAttribute("src")).toBe("https://example.test/cached.jpg");
    expect(shimmering()).toBe(false);
  });

  it("falls back to the initial when the photo fails, without a shimmer", async () => {
    await render({ src: "uploads/avatar/2.jpg", name: "sam" });

    await fire(img()!, "error");

    expect(img()).toBeNull();
    expect(container.textContent).toBe("s");
    expect(shimmering()).toBe(false);
  });

  it("shimmers again for a new photo until that one has loaded", async () => {
    await render({ src: "uploads/avatar/1.jpg" });
    await fire(img()!, "load");
    expect(shimmering()).toBe(false);

    await render({ src: "uploads/avatar/3.jpg" });

    expect(path()).toBe("/api/v1/avatar/3");
    expect(shimmering()).toBe(true);

    await fire(img()!, "load");

    expect(shimmering()).toBe(false);
  });

  it("leaves the fallback for a new photo, then stops shimmering once it loads", async () => {
    await render({ src: "uploads/avatar/2.jpg", name: "sam" });
    await fire(img()!, "error");
    expect(img()).toBeNull();

    await render({ src: "uploads/avatar/4.jpg", name: "sam" });

    expect(path()).toBe("/api/v1/avatar/4");
    expect(shimmering()).toBe(true);

    await fire(img()!, "load");

    expect(shimmering()).toBe(false);
  });

  it("shimmers when a previously loaded source is requested again", async () => {
    await render({ src: "uploads/avatar/1.jpg" });
    await fire(img()!, "load");

    await render({ src: "uploads/avatar/3.jpg" });
    await render({ src: "uploads/avatar/1.jpg" });

    expect(path()).toBe("/api/v1/avatar/1");
    expect(shimmering()).toBe(true);

    await fire(img()!, "load");

    expect(shimmering()).toBe(false);
  });

  it("keeps a loaded photo when its source changes to an alias of the same URL", async () => {
    await render({ src: "uploads/avatar/1.jpg" });
    await fire(img()!, "load");
    const loaded = img();

    await render({ src: "avatar/1.jpg" });

    expect(path()).toBe("/api/v1/avatar/1");
    expect(img()).toBe(loaded);
    expect(shimmering()).toBe(false);
  });

  it("shows the initial, without a shimmer, when there's no photo", async () => {
    await render({ name: "alex" });

    expect(img()).toBeNull();
    expect(container.textContent).toBe("a");
    expect(shimmering()).toBe(false);
  });
});
