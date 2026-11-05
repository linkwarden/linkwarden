import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import http from "node:http";
import type { AddressInfo, Socket } from "node:net";
import { gunzipSync } from "node:zlib";
import crypto from "crypto";
import { encode, JWT } from "next-auth/jwt";

// The real posthog-node client, pointed at a local server. Only the batching
// and retry timings are shortened.
const { clients, paymentCheckout } = vi.hoisted(() => ({
  clients: [] as { flush: () => Promise<void> }[],
  paymentCheckout: vi.fn(),
}));

vi.mock("posthog-node", async (importOriginal) => {
  const actual = await importOriginal<typeof import("posthog-node")>();

  class QuickPostHog extends actual.PostHog {
    constructor(key: string, options: Record<string, unknown>) {
      super(key, {
        ...options,
        flushAt: 1,
        flushInterval: 0,
        fetchRetryCount: 1,
        fetchRetryDelay: 10,
        requestTimeout: 300,
      });
      clients.push(this);
    }
  }

  return { ...actual, PostHog: QuickPostHog };
});

vi.mock("@linkwarden/filesystem", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@linkwarden/filesystem")>()),
  createFolder: vi.fn(),
}));

vi.mock("@/lib/api/paymentCheckout", () => ({ default: paymentCheckout }));

vi.mock("next-i18next.config", () => ({
  i18n: { locales: ["en"] },
}));

const SECRET = "usage-analytics-resilience-secret";
const COOKIE = "next-auth.session-token";

type Mode = "ok" | "error" | "hang";
let mode: Mode = "ok";
let batches: any[] = [];
const sockets = new Set<Socket>();

const posthog = http.createServer((req, res) => {
  const chunks: Uint8Array[] = [];
  req.on("data", (chunk) => chunks.push(chunk));
  req.on("end", () => {
    const raw = Buffer.concat(chunks);
    try {
      batches.push(
        JSON.parse(
          (raw[0] === 0x1f ? gunzipSync(new Uint8Array(raw)) : raw).toString(
            "utf8"
          )
        )
      );
    } catch {}

    if (mode === "hang") return;
    res.writeHead(mode === "error" ? 500 : 200, {
      "content-type": "application/json",
    });
    res.end(mode === "error" ? '{"error":"down"}' : '{"status":1}');
  });
});
posthog.on("connection", (socket) => {
  sockets.add(socket);
  socket.on("close", () => sockets.delete(socket));
});

let prisma: typeof import("@linkwarden/prisma").prisma;
const createdUserIds: number[] = [];

type Request = {
  method?: string;
  query?: Record<string, unknown>;
  headers?: Record<string, string>;
  cookies?: Record<string, string>;
  body?: unknown;
};

const call = async (handler: any, request: Request = {}) => {
  const state = { status: 200, body: undefined as any };

  const res: any = {
    status(code: number) {
      state.status = code;
      return res;
    },
    setHeader: () => res,
    json(body: any) {
      state.body = body;
      return res;
    },
    end: () => res,
  };

  await handler(
    { method: "GET", query: {}, headers: {}, cookies: {}, ...request },
    res
  );

  return state;
};

const timed = async (run: () => Promise<{ status: number; body: any }>) => {
  const started = performance.now();
  const result = await run();
  return { ...result, ms: performance.now() - started };
};

const createUser = async (data: Record<string, unknown> = {}) => {
  const suffix = `${Date.now()}_${Math.random().toString(16).slice(2)}`;
  const user = await prisma.user.create({
    data: {
      username: `analytics_resilience_${suffix}`,
      email: `analytics_resilience_${suffix}@example.com`,
      ...data,
    },
  });

  createdUserIds.push(user.id);
  return user;
};

const signedIn = async (userId: number): Promise<Request> => ({
  cookies: {
    [COOKIE]: await encode({
      token: {
        id: userId,
        sub: userId,
        sessionId: crypto.randomUUID(),
        sessionVersion: 0,
      } as JWT,
      secret: SECRET,
    }),
  },
});

const settle = async () => {
  await Promise.all(clients.map((client) => client.flush().catch(() => {})));
  await new Promise((resolve) => setTimeout(resolve, 50));
};

// Retried requests from an earlier test can still arrive, so tests only look
// at the events of the accounts they create
const eventsFor = (...userIds: number[]) =>
  batches
    .flatMap((batch) => batch.batch ?? [])
    .filter((e: any) => userIds.map(String).includes(e.distinct_id));

const eventNamesFor = (...userIds: number[]) =>
  eventsFor(...userIds).map((e: any) => e.event);

describe.skipIf(!process.env.DATABASE_URL)(
  "usage analytics edge cases with a real database",
  () => {
    const unhandled: unknown[] = [];
    const onUnhandled = (reason: unknown) => unhandled.push(reason);

    beforeAll(async () => {
      await new Promise<void>((resolve) =>
        posthog.listen(0, "127.0.0.1", () => resolve())
      );
      process.on("unhandledRejection", onUnhandled);

      vi.stubEnv("NEXTAUTH_SECRET", SECRET);
      vi.stubEnv("NEXTAUTH_URL", "http://127.0.0.1:3000/api/v1/auth");
      vi.stubEnv("NEXT_PUBLIC_DEMO", "false");
      vi.stubEnv("NEXT_PUBLIC_DISABLE_REGISTRATION", "false");
      vi.stubEnv("NEXT_PUBLIC_EMAIL_PROVIDER", "false");
      vi.stubEnv("EMAIL_FROM", "");
      vi.stubEnv("EMAIL_SERVER", "");
      vi.stubEnv("POSTHOG_KEY", "phc_resilience");
      vi.stubEnv(
        "POSTHOG_HOST",
        `http://127.0.0.1:${(posthog.address() as AddressInfo).port}`
      );

      prisma = (await import("@linkwarden/prisma")).prisma;
    });

    beforeEach(() => {
      batches = [];
      unhandled.length = 0;
      mode = "ok";
      vi.spyOn(console, "error").mockImplementation(() => {});
    });

    afterAll(async () => {
      process.off("unhandledRejection", onUnhandled);
      sockets.forEach((socket) => socket.destroy());
      await new Promise((resolve) => posthog.close(resolve));

      if (prisma) {
        await prisma.user.deleteMany({
          where: { id: { in: createdUserIds } },
        });
        await prisma.$disconnect();
      }
      vi.unstubAllEnvs();
      vi.restoreAllMocks();
    });

    describe("on an instance without billing", () => {
      let usersRoute: any;
      let linksRoute: any;
      let collectionsRoute: any;

      beforeAll(async () => {
        vi.resetModules();
        vi.stubEnv("STRIPE_SECRET_KEY", "");
        usersRoute = (await import("@/pages/api/v1/users")).default;
        linksRoute = (await import("@/pages/api/v1/links")).default;
        collectionsRoute = (await import("@/pages/api/v1/collections"))
          .default;
      });

      it.each<Mode>(["hang", "error"])(
        "still signs people up and saves links and collections when PostHog requests %s",
        async (failure) => {
          mode = failure;
          const username = `resilience_${failure}_${Date.now()}`;

          const signedUp = await timed(() =>
            call(usersRoute, {
              method: "POST",
              body: { username, password: "password-123" },
            })
          );
          expect(signedUp.status).toBe(201);
          createdUserIds.push(signedUp.body.response.id);

          const session = await signedIn(signedUp.body.response.id);

          const collection = await timed(() =>
            call(collectionsRoute, {
              ...session,
              method: "POST",
              body: { name: "Kept when PostHog is down" },
            })
          );
          expect(collection.status).toBe(200);

          const link = await timed(() =>
            call(linksRoute, {
              ...session,
              method: "POST",
              body: {
                url: "http://127.0.0.1:9/kept-when-posthog-is-down",
                collection: { id: collection.body.response.id },
              },
            })
          );
          expect(link.status).toBe(200);

          expect(
            await prisma.link.count({
              where: { id: link.body.response.id },
            })
          ).toBe(1);

          for (const { ms } of [signedUp, collection, link])
            expect(ms).toBeLessThan(2000);

          await settle();
          await new Promise((resolve) => setTimeout(resolve, 400));

          expect(eventNamesFor(signedUp.body.response.id)).toEqual(
            expect.arrayContaining([
              "signed_up",
              "collection_created",
              "link_created",
            ])
          );
          expect(unhandled).toEqual([]);
        }
      );

      it("records no sign up for an account the admin creates", async () => {
        const admin = await createUser();
        vi.stubEnv("NEXT_PUBLIC_ADMIN", String(admin.id));

        const created = await call(usersRoute, {
          ...(await signedIn(admin.id)),
          method: "POST",
          body: {
            username: `made_by_admin_${Date.now()}`,
            password: "password-123",
          },
        });
        expect(created.status).toBe(201);
        createdUserIds.push(created.body.response.id);

        await settle();
        expect(eventsFor(admin.id, created.body.response.id)).toEqual([]);

        vi.stubEnv("NEXT_PUBLIC_ADMIN", "");
      });
    });

    describe("on an instance with billing and email, when a subscriber invites a member", () => {
      let usersRoute: any;

      beforeAll(async () => {
        vi.resetModules();
        vi.stubEnv("STRIPE_SECRET_KEY", "sk_test_not_used");
        vi.stubEnv("EMAIL_FROM", "no-reply@example.com");
        vi.stubEnv("EMAIL_SERVER", "smtp://127.0.0.1:9");
        vi.stubEnv("NEXT_PUBLIC_ADMIN", "2147483647");
        usersRoute = (await import("@/pages/api/v1/users")).default;
      });

      afterAll(() => {
        vi.stubEnv("STRIPE_SECRET_KEY", "");
        vi.stubEnv("EMAIL_FROM", "");
        vi.stubEnv("EMAIL_SERVER", "");
        vi.stubEnv("NEXT_PUBLIC_ADMIN", "");
      });

      it("records the invite for the member who sent it and no sign up for the new account", async () => {
        const owner = await createUser({
          subscriptions: {
            create: {
              active: true,
              provider: "STRIPE",
              stripeSubscriptionId: `sub_${Date.now()}`,
              currentPeriodStart: new Date(),
              currentPeriodEnd: new Date(Date.now() + 30 * 86400000),
              quantity: 5,
            },
          },
        });
        const invitedEmail = `invited_${Date.now()}@example.com`;

        const invited = await call(usersRoute, {
          ...(await signedIn(owner.id)),
          method: "POST",
          body: { email: invitedEmail, invite: true },
        });
        expect(invited.status).toBe(201);
        createdUserIds.push(invited.body.response.id);

        await settle();
        expect(eventNamesFor(owner.id)).toEqual(["member_invited"]);
        expect(eventsFor(invited.body.response.id)).toEqual([]);
        expect(JSON.stringify(batches)).not.toContain(invitedEmail);
      });

      it("records nothing for an invite from an account that turned usage analytics off", async () => {
        const owner = await createUser({
          shareUsageAnalytics: false,
          subscriptions: {
            create: {
              active: true,
              provider: "STRIPE",
              stripeSubscriptionId: `sub_off_${Date.now()}`,
              currentPeriodStart: new Date(),
              currentPeriodEnd: new Date(Date.now() + 30 * 86400000),
              quantity: 5,
            },
          },
        });

        const invited = await call(usersRoute, {
          ...(await signedIn(owner.id)),
          method: "POST",
          body: { email: `invited_off_${Date.now()}@example.com`, invite: true },
        });
        expect(invited.status).toBe(201);
        createdUserIds.push(invited.body.response.id);

        await settle();
        expect(eventsFor(owner.id, invited.body.response.id)).toEqual([]);
      });
    });

    describe("on an instance with billing, for an account whose trial ended", () => {
      let preferenceRoute: any;
      let meRoute: any;
      let paymentRoute: any;

      beforeAll(async () => {
        vi.resetModules();
        vi.stubEnv("STRIPE_SECRET_KEY", "sk_test_not_used");
        vi.stubEnv("MONTHLY_PRICE_ID", "price_monthly");
        vi.stubEnv("YEARLY_PRICE_ID", "price_yearly");
        vi.stubEnv("NEXT_PUBLIC_TRIAL_PERIOD_DAYS", "14");
        vi.stubEnv("NEXT_PUBLIC_REQUIRE_CC", "false");
        preferenceRoute = (
          await import("@/pages/api/v1/users/[id]/preference")
        ).default;
        meRoute = (await import("@/pages/api/v1/users/me")).default;
        paymentRoute = (await import("@/pages/api/v1/payment")).default;
      });

      const trialEnded = () =>
        createUser({ createdAt: new Date(Date.now() - 30 * 86400000) });

      it("counts the account, which shares usage analytics by default", async () => {
        const user = await trialEnded();
        const session = await signedIn(user.id);

        const me = await call(meRoute, session);
        expect(me.status).toBe(200);
        expect(me.body.response.shareUsageAnalytics).toBe(true);

        paymentCheckout.mockResolvedValue({
          status: 200,
          response: "https://checkout.stripe.com/c/pay/test",
        });
        const checkout = await call(paymentRoute, {
          ...session,
          query: { plan: "0" },
        });
        expect(checkout.status).toBe(200);

        await settle();
        expect(eventNamesFor(user.id)).toContain("subscription_checkout_started");
      });

      // The preference route requires an active subscription, so an account
      // that can't use the app yet has no way to stop being counted.
      it.fails(
        "lets the account turn usage analytics off",
        async () => {
          const user = await trialEnded();

          const off = await call(preferenceRoute, {
            ...(await signedIn(user.id)),
            method: "PUT",
            query: { id: String(user.id) },
            body: { shareUsageAnalytics: false },
          });

          expect(off.status).toBe(200);
          expect(
            (await prisma.user.findUnique({ where: { id: user.id } }))
              ?.shareUsageAnalytics
          ).toBe(false);
        }
      );
    });
  }
);
