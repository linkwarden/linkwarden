import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import crypto from "crypto";
import { encode, JWT } from "next-auth/jwt";

// Inviting a member, which needs billing and email, against a real database
// (DATABASE_URL), with PostHog itself replaced by a mock. Kept apart from
// usageAnalytics.integration.test.ts because the routes read these settings
// when they load.

const { capture } = vi.hoisted(() => ({ capture: vi.fn() }));

vi.mock("posthog-node", () => ({
  PostHog: vi.fn(function () {
    return { capture };
  }),
}));

vi.mock("next-i18next.config", () => ({
  i18n: { locales: ["en"] },
}));

const SECRET = "usage-analytics-invites-secret";
const COOKIE = "next-auth.session-token";

let prisma: typeof import("@linkwarden/prisma").prisma;
let usersRoute: typeof import("@/pages/api/v1/users").default;

const createdUserIds: number[] = [];

const call = async (handler: any, request: Record<string, unknown>) => {
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

const signedIn = async (userId: number) => ({
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

// A member who pays with Stripe and can add seats
const createSubscriber = async (shareUsageAnalytics = true) => {
  const suffix = `${Date.now()}_${Math.random().toString(16).slice(2)}`;
  const user = await prisma.user.create({
    data: {
      username: `inviter_${suffix}`,
      email: `inviter_${suffix}@example.com`,
      emailVerified: new Date(),
      name: "Inviter Private",
      shareUsageAnalytics,
      subscriptions: {
        create: {
          active: true,
          provider: "STRIPE",
          stripeSubscriptionId: `sub_${suffix}`,
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 30 * 86400000),
          quantity: 3,
        },
      },
    },
  });

  createdUserIds.push(user.id);
  return user;
};

const invite = async (inviterId: number) => {
  const email = `invitee_${Date.now()}_${Math.random()
    .toString(16)
    .slice(2)}@example.com`;

  const invited = await call(usersRoute, {
    ...(await signedIn(inviterId)),
    method: "POST",
    body: { email, invite: true },
  });
  if (invited.body?.response?.id) createdUserIds.push(invited.body.response.id);

  return { invited, email };
};

describe.skipIf(!process.env.DATABASE_URL)(
  "usage analytics for invites with a real database",
  () => {
    beforeAll(async () => {
      vi.stubEnv("NEXTAUTH_SECRET", SECRET);
      vi.stubEnv("NEXTAUTH_URL", "http://127.0.0.1:3000/api/v1/auth");
      vi.stubEnv("STRIPE_SECRET_KEY", "sk_test_invites");
      vi.stubEnv("EMAIL_FROM", "noreply@example.com");
      vi.stubEnv("EMAIL_SERVER", "smtp://127.0.0.1:9");
      vi.stubEnv("NEXT_PUBLIC_EMAIL_PROVIDER", "true");
      vi.stubEnv("NEXT_PUBLIC_DISABLE_REGISTRATION", "false");
      vi.stubEnv("NEXT_PUBLIC_DEMO", "false");
      vi.stubEnv("NEXT_PUBLIC_POSTHOG_KEY", "phc_test");
      vi.stubEnv("NEXT_PUBLIC_POSTHOG_HOST", "https://eu.i.posthog.com");

      prisma = (await import("@linkwarden/prisma")).prisma;
      usersRoute = (await import("@/pages/api/v1/users")).default;
    });

    beforeEach(() => {
      capture.mockClear();
    });

    afterAll(async () => {
      if (!prisma) return;

      await prisma.user.deleteMany({ where: { id: { in: createdUserIds } } });
      await prisma.$disconnect();
      vi.unstubAllEnvs();
    });

    it("records nothing for an invite that was refused", async () => {
      const inviter = await createSubscriber();
      await prisma.subscription.update({
        where: { userId: inviter.id },
        data: { provider: "APPLE" },
      });

      const { invited } = await invite(inviter.id);
      expect(invited.status).toBe(400);

      expect(capture).not.toHaveBeenCalled();
    });
  }
);
