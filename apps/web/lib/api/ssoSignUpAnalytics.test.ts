import { beforeEach, describe, expect, it, vi } from "vitest";

// The sign up event the NextAuth route records when SSO creates an account,
// without a database or an identity provider.

const { NextAuth, captureEvent } = vi.hoisted(() => ({
  NextAuth: vi.fn(),
  captureEvent: vi.fn(),
}));

vi.mock("next-auth/next", () => ({ default: NextAuth }));
vi.mock("@/lib/api/captureEvent", () => ({ default: captureEvent }));
vi.mock("@linkwarden/prisma", () => ({ prisma: {} }));

type Events = {
  createUser: (message: { user: Record<string, unknown> }) => Promise<void>;
};

// The options the route hands NextAuth for one request
const eventsFor = async (req: Record<string, unknown>) => {
  const { default: auth } = await import("@/pages/api/v1/auth/[...nextauth]");
  await auth(req as any, {} as any);

  return NextAuth.mock.calls.at(-1)![2].events as Events;
};

beforeEach(() => {
  NextAuth.mockClear();
  captureEvent.mockClear();
});

describe("SSO sign ups", () => {
  it("records a sign up under the account SSO created, with the request's app", async () => {
    const req = {
      method: "GET",
      query: { nextauth: ["callback", "authentik"] },
      headers: { "user-agent": "Mozilla/5.0" },
      body: {},
    };
    const events = await eventsFor(req);

    const user = {
      id: 9,
      name: "Private Name",
      email: "private@example.com",
      shareUsageAnalytics: true,
    };
    await events.createUser({ user });

    expect(captureEvent).toHaveBeenCalledTimes(1);
    expect(captureEvent).toHaveBeenCalledWith({
      req,
      user,
      event: "signed_up",
      properties: { method: "sso" },
    });
  });
});
