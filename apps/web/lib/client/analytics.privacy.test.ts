import { beforeEach, describe, expect, it, vi } from "vitest";
import type { CaptureResult } from "posthog-js";

vi.mock("posthog-js", () => ({ default: { init: vi.fn(), capture: vi.fn() } }));

const load = async () => await import("./analytics");

const event = (
  name: string,
  properties: Record<string, any>,
  extra: Partial<CaptureResult> = {}
) => ({ uuid: "1", event: name, properties, ...extra }) as CaptureResult;

beforeEach(() => {
  vi.resetModules();
});

describe("sanitizePath edge cases", () => {
  it("replaces every id in a path, including 0 and very long ones", async () => {
    const { sanitizePath } = await load();

    expect(sanitizePath("/collections/1/links/22")).toBe(
      "/collections/[id]/links/[id]"
    );
    expect(sanitizePath("/links/0")).toBe("/links/[id]");
    expect(sanitizePath("/links/12345678901234567890/")).toBe("/links/[id]/");
  });

  it("drops a query string or hash that comes right after an id", async () => {
    const { sanitizePath } = await load();

    expect(sanitizePath("/preserved/7?format=2&q=private")).toBe(
      "/preserved/[id]"
    );
    expect(sanitizePath("/links/7#note-3")).toBe("/links/[id]");
    expect(sanitizePath("/links/7?")).toBe("/links/[id]");
  });

  it("leaves segments that only start or end with digits alone", async () => {
    const { sanitizePath } = await load();

    expect(sanitizePath("/settings/2fa")).toBe("/settings/2fa");
    expect(sanitizePath("/v1/links")).toBe("/v1/links");
  });
});

describe("beforeSend edge cases", () => {
  it("cleans the URL of every page in a heatmap and drops malformed entries", async () => {
    const { beforeSend, setAnalyticsAllowed } = await load();
    setAnalyticsAllowed(true);

    const sent = beforeSend(
      event("$$heatmap", {
        $heatmap_data: {
          "https://cloud.linkwarden.app/links/3#x": [{ x: 1, y: 2 }],
          "https://cloud.linkwarden.app/links/4?q=private": [{ x: 3, y: 4 }],
          "https://cloud.linkwarden.app/dashboard": "not a list",
        },
      })
    );

    expect(sent?.properties.$heatmap_data).toEqual({
      "https://cloud.linkwarden.app/links/[id]": [
        { x: 1, y: 2 },
        { x: 3, y: 4 },
      ],
    });
  });

  it("cleans URLs in the page leave and first touch properties", async () => {
    const { beforeSend, setAnalyticsAllowed } = await load();
    setAnalyticsAllowed(true);

    const sent = beforeSend(
      event(
        "$pageleave",
        {
          $current_url: "https://cloud.linkwarden.app/tags/9?sort=1",
          $prev_pageview_pathname: "/collections/5",
          $session_entry_url: "https://cloud.linkwarden.app/links/1?a=b#c",
          $session_entry_referrer: "https://mail.example.com/inbox/12?u=me",
        },
        {
          $set_once: {
            $initial_current_url: "https://cloud.linkwarden.app/links/8?a=b",
            $initial_pathname: "/links/8",
            $initial_referrer: "https://news.example.com/item?id=1",
          },
        }
      )
    );

    const everything = JSON.stringify(sent);
    expect(everything).not.toMatch(/\?|#|\/\d+(\/|"|$)/);
    expect(sent?.properties.$session_entry_referrer).toBe(
      "https://mail.example.com"
    );
  });

  // Error reports carry the error's message and stack frames as they are, so
  // a URL in an error message keeps its query string and ids.
  it.fails(
    "removes query strings and ids from URLs inside error reports",
    async () => {
      const { beforeSend, setAnalyticsAllowed } = await load();
      setAnalyticsAllowed(true);

      const sent = beforeSend(
        event("$exception", {
          $current_url: "https://cloud.linkwarden.app/collections/[id]",
          $exception_list: [
            {
              type: "TypeError",
              value:
                "Failed to load https://cloud.linkwarden.app/api/v1/links?searchQueryString=tax%20return&collectionId=12",
              mechanism: { type: "onunhandledrejection", handled: false },
              stacktrace: {
                type: "raw",
                frames: [
                  {
                    platform: "web:javascript",
                    filename:
                      "https://cloud.linkwarden.app/search?q=tax%20return",
                    lineno: 1,
                    colno: 2,
                  },
                ],
              },
            },
          ],
        })
      );

      const everything = JSON.stringify(sent);
      expect(everything).not.toContain("tax%20return");
      expect(everything).not.toContain("collectionId=12");
    }
  );
});
