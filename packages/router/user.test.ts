import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { QueryClient } from "@tanstack/react-query";
import type { MobileAuth } from "@linkwarden/types/global";

const { useSession } = vi.hoisted(() => ({ useSession: vi.fn() }));

let queryClient: QueryClient;

vi.mock("next-auth/react", () => ({ useSession }));

// Outside of React the hooks hand back their options, so the mutation's
// callbacks can be run directly against a real query cache
vi.mock("@tanstack/react-query", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@tanstack/react-query")>()),
  useMutation: (options: unknown) => options,
  useQueryClient: () => queryClient,
}));

import { useUpdateUserPreference } from "./user";

type Mutation = {
  mutationFn: (preference: Record<string, unknown>) => Promise<any>;
  onSuccess: (data: any) => void;
  onMutate: (preference: Record<string, unknown>) => Promise<void>;
};

const mobileAuth: MobileAuth = {
  instance: "https://cloud.linkwarden.app",
  session: "mobile-token",
  status: "authenticated",
};

const respond = (status: number, response: unknown) =>
  vi.fn(async () => ({
    ok: status >= 200 && status < 300,
    status,
    json: async () => ({ response }),
  }));

const cachedUser = {
  id: 7,
  theme: "light",
  shareUsageAnalytics: true,
  hasPassword: true,
  hasOAuthAccount: false,
};

beforeEach(() => {
  queryClient = new QueryClient();
  queryClient.setQueryData(["user"], cachedUser);
  useSession.mockReset();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("useUpdateUserPreference", () => {
  describe("in the mobile app", () => {
    it("saves to the signed in instance with the app's token, for the cached user", async () => {
      const fetch = respond(200, { ...cachedUser, shareUsageAnalytics: false });
      vi.stubGlobal("fetch", fetch);

      const mutation = useUpdateUserPreference(
        mobileAuth
      ) as unknown as Mutation;
      await mutation.mutationFn({ shareUsageAnalytics: false });

      expect(useSession).not.toHaveBeenCalled();
      expect(fetch).toHaveBeenCalledWith(
        "https://cloud.linkwarden.app/api/v1/users/7/preference",
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer mobile-token",
          },
          body: JSON.stringify({ shareUsageAnalytics: false }),
        }
      );
    });

    it("updates the cached user without touching the web page's theme", async () => {
      // There's no document in the app, so reaching for it would throw
      expect(typeof document).toBe("undefined");

      const mutation = useUpdateUserPreference(
        mobileAuth
      ) as unknown as Mutation;

      expect(() =>
        mutation.onSuccess({ id: 7, theme: "dark", shareUsageAnalytics: false })
      ).not.toThrow();
      expect(queryClient.getQueryData(["user"])).toMatchObject({
        shareUsageAnalytics: false,
        theme: "dark",
      });
    });
  });

  describe("on the web", () => {
    beforeEach(() => {
      useSession.mockReturnValue({ data: { user: { id: 3 } } });
    });

    it("saves for the signed in user on the same site, with the session cookie only", async () => {
      const fetch = respond(200, { id: 3, shareUsageAnalytics: false });
      vi.stubGlobal("fetch", fetch);

      const mutation = useUpdateUserPreference() as unknown as Mutation;
      await mutation.mutationFn({ shareUsageAnalytics: false });

      expect(fetch).toHaveBeenCalledWith("/api/v1/users/3/preference", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shareUsageAnalytics: false }),
      });
    });

    it("still applies the saved theme to the page", async () => {
      const setAttribute = vi.fn();
      vi.stubGlobal("document", {
        querySelector: (selector: string) =>
          selector === "html" ? { setAttribute } : null,
      });

      const mutation = useUpdateUserPreference() as unknown as Mutation;
      mutation.onSuccess({ id: 3, theme: "dark" });

      expect(setAttribute).toHaveBeenCalledWith("data-theme", "dark");
    });
  });

  it("keeps what the response leaves out, like whether the user has a password", async () => {
    vi.stubGlobal("document", { querySelector: () => null });
    const mutation = useUpdateUserPreference(mobileAuth) as unknown as Mutation;

    // The preference route's response has no hasPassword or hasOAuthAccount
    mutation.onSuccess({ id: 7, theme: "light", shareUsageAnalytics: false });

    expect(queryClient.getQueryData(["user"])).toEqual({
      ...cachedUser,
      shareUsageAnalytics: false,
    });
  });

  it("shows the new value right away, before the server answers", async () => {
    const mutation = useUpdateUserPreference(mobileAuth) as unknown as Mutation;

    await mutation.onMutate({ shareUsageAnalytics: false });

    expect(queryClient.getQueryData(["user"])).toEqual({
      ...cachedUser,
      shareUsageAnalytics: false,
    });
  });

  it("fails with the server's message", async () => {
    vi.stubGlobal("fetch", respond(401, "Permission denied."));
    const mutation = useUpdateUserPreference(mobileAuth) as unknown as Mutation;

    await expect(
      mutation.mutationFn({ shareUsageAnalytics: false })
    ).rejects.toThrow("Permission denied.");
  });
});
