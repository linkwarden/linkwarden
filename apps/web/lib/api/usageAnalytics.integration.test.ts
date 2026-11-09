import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import { Readable } from "stream";
import crypto from "crypto";
import { encode, JWT } from "next-auth/jwt";

// Usage analytics events sent by the real API routes, against a real database
// (DATABASE_URL), with PostHog itself replaced by a mock.

const { capture, paymentCheckout } = vi.hoisted(() => ({
  capture: vi.fn(),
  paymentCheckout: vi.fn(),
}));

vi.mock("posthog-node", () => ({
  PostHog: vi.fn(function () {
    return { capture };
  }),
}));

// Keeps the routes from writing archives and folders to disk
vi.mock("@linkwarden/filesystem", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@linkwarden/filesystem")>()),
  createFolder: vi.fn(),
  createFile: vi.fn(),
}));

vi.mock("@linkwarden/lib/generatePreview", () => ({
  generatePreview: vi.fn(),
}));

vi.mock("@/lib/api/paymentCheckout", () => ({ default: paymentCheckout }));

vi.mock("next-i18next.config", () => ({
  i18n: { locales: ["en"] },
}));

const SECRET = "usage-analytics-integration-secret";
const COOKIE = "next-auth.session-token";
const IOS_USER_AGENT = "Linkwarden/42 CFNetwork/3826.500.111 Darwin/25.0.0";

let prisma: typeof import("@linkwarden/prisma").prisma;
let usersRoute: typeof import("@/pages/api/v1/users").default;
let linksRoute: typeof import("@/pages/api/v1/links").default;
let collectionsRoute: typeof import("@/pages/api/v1/collections").default;
let preferenceRoute: typeof import("@/pages/api/v1/users/[id]/preference").default;
let migrationRoute: typeof import("@/pages/api/v1/migration").default;
let paymentRoute: typeof import("@/pages/api/v1/payment").default;
let archivesRoute: typeof import("@/pages/api/v1/archives").default;
let createSession: typeof import("./controllers/session/createSession").default;

const createdUserIds: number[] = [];

type Request = {
  method?: string;
  query?: Record<string, unknown>;
  headers?: Record<string, string>;
  cookies?: Record<string, string>;
  body?: unknown;
};

// Calls a route the way Next.js would and collects the response
const call = async (handler: any, request: Request = {}, req?: any) => {
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
    Object.assign(req ?? {}, {
      method: "GET",
      query: {},
      headers: {},
      cookies: {},
      ...request,
    }),
    res
  );

  return state;
};

const createUser = async (shareUsageAnalytics = true) => {
  const suffix = `${Date.now()}_${Math.random().toString(16).slice(2)}`;
  const user = await prisma.user.create({
    data: {
      username: `usage_analytics_${suffix}`,
      email: `usage_analytics_${suffix}@example.com`,
      name: "Private Name",
      shareUsageAnalytics,
    },
  });

  createdUserIds.push(user.id);
  return user;
};

// The cookie next-auth gives a browser that signed in
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

const signedInOnPhone = async (userId: number): Promise<Request> => ({
  headers: {
    authorization: `Bearer ${
      ((await createSession(userId, "Phone")).response as { token: string })
        .token
    }`,
    "user-agent": IOS_USER_AGENT,
  },
});

const events = () => capture.mock.calls.map(([event]) => event);

// None of what users save or type may end up in an event
const expectNoUserContent = (...values: string[]) => {
  const sent = JSON.stringify(capture.mock.calls);

  for (const value of values) expect(sent).not.toContain(value);
};

describe.skipIf(!process.env.DATABASE_URL)(
  "usage analytics with a real database",
  () => {
    beforeAll(async () => {
      // Read when the routes load
      vi.stubEnv("NEXTAUTH_SECRET", SECRET);
      vi.stubEnv("NEXTAUTH_URL", "http://127.0.0.1:3000/api/v1/auth");
      vi.stubEnv("STRIPE_SECRET_KEY", "");
      vi.stubEnv("NEXT_PUBLIC_DEMO", "false");
      vi.stubEnv("NEXT_PUBLIC_DISABLE_REGISTRATION", "false");
      vi.stubEnv("NEXT_PUBLIC_EMAIL_PROVIDER", "false");
      vi.stubEnv("EMAIL_FROM", "");
      vi.stubEnv("EMAIL_SERVER", "");
      vi.stubEnv("POSTHOG_KEY", "phc_test");
      vi.stubEnv("POSTHOG_HOST", "https://eu.i.posthog.com");

      prisma = (await import("@linkwarden/prisma")).prisma;
      usersRoute = (await import("@/pages/api/v1/users")).default;
      linksRoute = (await import("@/pages/api/v1/links")).default;
      collectionsRoute = (await import("@/pages/api/v1/collections")).default;
      preferenceRoute = (await import("@/pages/api/v1/users/[id]/preference"))
        .default;
      migrationRoute = (await import("@/pages/api/v1/migration")).default;
      paymentRoute = (await import("@/pages/api/v1/payment")).default;
      archivesRoute = (await import("@/pages/api/v1/archives")).default;
      createSession = (await import("./controllers/session/createSession"))
        .default;
    });

    beforeEach(() => {
      capture.mockClear();
      paymentCheckout.mockReset();
    });

    afterAll(async () => {
      if (!prisma) return;

      await prisma.user.deleteMany({ where: { id: { in: createdUserIds } } });
      await prisma.$disconnect();
      vi.unstubAllEnvs();
    });

    describe("POST /api/v1/users", () => {
      it("records a sign up under the new account's id and nothing else about it", async () => {
        const username = `signup_${Date.now()}`;

        const signedUp = await call(usersRoute, {
          method: "POST",
          body: { name: "Jane Private", username, password: "password-123" },
        });
        expect(signedUp.status).toBe(201);
        createdUserIds.push(signedUp.body.response.id);

        expect(events()).toEqual([
          {
            distinctId: String(signedUp.body.response.id),
            event: "signed_up",
            properties: { method: "credentials", platform: "web" },
          },
        ]);
        expectNoUserContent(username, "Jane Private");
      });

      it("knows a sign up came from the mobile app", async () => {
        const signedUp = await call(usersRoute, {
          method: "POST",
          headers: { "user-agent": IOS_USER_AGENT },
          body: {
            username: `signup_phone_${Date.now()}`,
            password: "password-123",
          },
        });
        expect(signedUp.status).toBe(201);
        createdUserIds.push(signedUp.body.response.id);

        expect(events()[0].properties.platform).toBe("mobile");
      });

      it("records nothing for a sign up that failed", async () => {
        const user = await createUser();

        const taken = await call(usersRoute, {
          method: "POST",
          body: { username: user.username, password: "password-123" },
        });
        expect(taken.status).toBe(400);

        expect(capture).not.toHaveBeenCalled();
      });
    });

    describe("POST /api/v1/archives", () => {
      // The upload route answers after its handler returns, once the form
      // is parsed
      const upload = (
        session: Request,
        format: number,
        filename: string,
        mimeType: string,
        content: Buffer
      ) =>
        new Promise<{ status: number; body: any }>((resolve, reject) => {
          const boundary = `----linkwarden${crypto.randomUUID()}`;
          const body = Buffer.concat([
            Buffer.from(
              `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${filename}"\r\nContent-Type: ${mimeType}\r\n\r\n`
            ),
            content,
            Buffer.from(`\r\n--${boundary}--\r\n`),
          ]);
          const state = { status: 200, body: undefined as any };
          const res: any = {
            status(code: number) {
              state.status = code;
              return res;
            },
            setHeader: () => res,
            json(json: any) {
              state.body = json;
              resolve(state);
              return res;
            },
          };

          Promise.resolve(
            archivesRoute(
              Object.assign(Readable.from([body]), {
                method: "POST",
                query: { format: String(format) },
                cookies: session.cookies ?? {},
                headers: {
                  ...session.headers,
                  "content-type": `multipart/form-data; boundary=${boundary}`,
                  "content-length": String(body.length),
                },
              }) as any,
              res
            )
          ).catch(reject);
        });

      const pdf = Buffer.from("%PDF-1.4\nuploaded secret\n%%EOF\n");
      // A 1x1 PNG
      const png = Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
        "base64"
      );
      const html = Buffer.from(
        "<html><head><title>Uploaded secret page</title></head></html>"
      );

      it("records an uploaded file as a link of its type, but not the file", async () => {
        const user = await createUser();
        const session = await signedIn(user.id);

        expect(
          (await upload(session, 2, "secret.pdf", "application/pdf", pdf))
            .status
        ).toBe(200);
        expect(
          (await upload(session, 0, "secret.png", "image/png", png)).status
        ).toBe(200);
        expect(
          (await upload(session, 4, "secret.html", "text/html", html)).status
        ).toBe(200);

        expect(events()).toEqual(
          ["pdf", "image", "webpage"].map((type) => ({
            distinctId: String(user.id),
            event: "link_created",
            properties: { type, platform: "web" },
          }))
        );
        expectNoUserContent("secret.pdf", "uploaded secret", "Uploaded secret");
      });

      it("knows an upload came from the mobile app", async () => {
        const user = await createUser();

        const uploaded = await upload(
          await signedInOnPhone(user.id),
          2,
          "doc.pdf",
          "application/pdf",
          pdf
        );
        expect(uploaded.status).toBe(200);

        expect(events()[0].properties).toEqual({
          type: "pdf",
          platform: "mobile",
        });
      });

      it("records nothing for an upload that was rejected", async () => {
        const user = await createUser();

        const rejected = await upload(
          await signedIn(user.id),
          2,
          "not-a.pdf",
          "text/plain",
          Buffer.from("plain text")
        );
        expect(rejected.status).toBe(400);

        expect(capture).not.toHaveBeenCalled();
      });

      it("records nothing for a user who turned usage analytics off", async () => {
        const user = await createUser(false);

        const uploaded = await upload(
          await signedIn(user.id),
          2,
          "doc.pdf",
          "application/pdf",
          pdf
        );
        expect(uploaded.status).toBe(200);

        expect(capture).not.toHaveBeenCalled();
      });
    });

    describe("POST /api/v1/links", () => {
      it("records the link type, but not the link", async () => {
        const user = await createUser();

        const created = await call(linksRoute, {
          ...(await signedIn(user.id)),
          method: "POST",
          body: {
            // A private address, so the route doesn't fetch it
            url: "http://127.0.0.1:9/private-bookmark",
            name: "My private bookmark",
            description: "A note about it",
            tags: [{ name: "secret-tag" }],
          },
        });
        expect(created.status).toBe(200);

        expect(events()).toEqual([
          {
            distinctId: String(user.id),
            event: "link_created",
            properties: { type: "url", platform: "web" },
          },
        ]);
        expectNoUserContent(
          "private-bookmark",
          "My private bookmark",
          "A note about it",
          "secret-tag"
        );
      });

      it("records which app the link was added from", async () => {
        const user = await createUser();

        const created = await call(linksRoute, {
          ...(await signedInOnPhone(user.id)),
          method: "POST",
          body: { url: "http://127.0.0.1:9/from-phone" },
        });
        expect(created.status).toBe(200);

        expect(events()[0].properties).toEqual({
          type: "url",
          platform: "mobile",
        });
      });

      it("records nothing for a user who turned usage analytics off", async () => {
        const user = await createUser(false);

        const created = await call(linksRoute, {
          ...(await signedIn(user.id)),
          method: "POST",
          body: { url: "http://127.0.0.1:9/opted-out" },
        });
        expect(created.status).toBe(200);

        expect(capture).not.toHaveBeenCalled();
      });

      it("records nothing when the link couldn't be added", async () => {
        const user = await createUser();

        const rejected = await call(linksRoute, {
          ...(await signedIn(user.id)),
          method: "POST",
          body: { url: "not a url" },
        });
        expect(rejected.status).toBe(400);

        expect(capture).not.toHaveBeenCalled();
      });

      it("records nothing for a request that isn't signed in", async () => {
        const rejected = await call(linksRoute, {
          method: "POST",
          body: { url: "http://127.0.0.1:9/anonymous" },
        });
        expect(rejected.status).toBe(401);

        expect(capture).not.toHaveBeenCalled();
      });
    });

    describe("POST /api/v1/collections", () => {
      it("records whether it's a subcollection, but not its name", async () => {
        const user = await createUser();
        const session = await signedIn(user.id);

        const parent = await call(collectionsRoute, {
          ...session,
          method: "POST",
          body: { name: "Medical records" },
        });
        expect(parent.status).toBe(200);

        const child = await call(collectionsRoute, {
          ...session,
          method: "POST",
          body: { name: "Lab results", parentId: parent.body.response.id },
        });
        expect(child.status).toBe(200);

        expect(events().map((e) => [e.event, e.properties])).toEqual([
          ["collection_created", { is_subcollection: false, platform: "web" }],
          ["collection_created", { is_subcollection: true, platform: "web" }],
        ]);
        expectNoUserContent("Medical records", "Lab results");
      });

      it("records nothing for a user who turned usage analytics off", async () => {
        const user = await createUser(false);

        const created = await call(collectionsRoute, {
          ...(await signedIn(user.id)),
          method: "POST",
          body: { name: "Not counted" },
        });
        expect(created.status).toBe(200);

        expect(capture).not.toHaveBeenCalled();
      });
    });

    describe("POST /api/v1/migration", () => {
      const importRequest = (body: unknown) =>
        Readable.from([Buffer.from(JSON.stringify(body))]);

      it("records the import format, but not the imported bookmarks", async () => {
        const user = await createUser();

        const imported = await call(
          migrationRoute,
          { ...(await signedIn(user.id)), method: "POST" },
          importRequest({
            format: 1,
            data: `<!DOCTYPE NETSCAPE-Bookmark-file-1>
<DL><p>
  <DT><H3>Taxes</H3>
  <DL><p>
    <DT><A HREF="https://example.com/imported-secret">Imported secret</A>
  </DL><p>
</DL><p>`,
          })
        );
        expect(imported.status).toBe(200);

        expect(events()).toEqual([
          {
            distinctId: String(user.id),
            event: "bookmarks_imported",
            properties: { format: "htmlFile", platform: "web" },
          },
        ]);
        expectNoUserContent("imported-secret", "Imported secret", "Taxes");
      });

      it("records nothing for an import that failed", async () => {
        const user = await createUser();

        const rejected = await call(
          migrationRoute,
          { ...(await signedIn(user.id)), method: "POST" },
          Readable.from([Buffer.from("{not json")])
        );
        expect(rejected.status).toBe(400);

        expect(capture).not.toHaveBeenCalled();
      });
    });

    describe("GET /api/v1/payment", () => {
      beforeEach(() => {
        vi.stubEnv("STRIPE_SECRET_KEY", "sk_test_123");
        vi.stubEnv("MONTHLY_PRICE_ID", "price_monthly");
        vi.stubEnv("YEARLY_PRICE_ID", "price_yearly");
      });

      it("records the plan when a checkout starts", async () => {
        const user = await createUser();
        paymentCheckout.mockResolvedValue({
          status: 200,
          response: "https://checkout.stripe.com/c/pay/test",
        });

        const checkout = await call(paymentRoute, {
          ...(await signedIn(user.id)),
          query: { plan: "1" },
        });
        expect(checkout.status).toBe(200);

        expect(events()).toEqual([
          {
            distinctId: String(user.id),
            event: "subscription_checkout_started",
            properties: { plan: "yearly", platform: "web" },
          },
        ]);
      });

      it("records nothing when an existing subscriber is sent back to the dashboard", async () => {
        const user = await createUser();
        paymentCheckout.mockResolvedValue({
          status: 200,
          response: "/dashboard",
        });

        const checkout = await call(paymentRoute, {
          ...(await signedIn(user.id)),
          query: { plan: "0" },
        });
        expect(checkout.status).toBe(200);
        expect(checkout.body.response).toBe("/dashboard");

        expect(capture).not.toHaveBeenCalled();
      });

      it("records nothing for a user who turned usage analytics off", async () => {
        const user = await createUser(false);
        paymentCheckout.mockResolvedValue({
          status: 200,
          response: "https://checkout.stripe.com/c/pay/test",
        });

        const checkout = await call(paymentRoute, {
          ...(await signedIn(user.id)),
          query: { plan: "0" },
        });
        expect(checkout.status).toBe(200);

        expect(capture).not.toHaveBeenCalled();
      });
    });

    describe("PUT /api/v1/users/[id]/preference", () => {
      it("turns usage analytics off and back on", async () => {
        const user = await createUser();
        const session = await signedIn(user.id);

        const off = await call(preferenceRoute, {
          ...session,
          method: "PUT",
          query: { id: String(user.id) },
          body: { shareUsageAnalytics: false },
        });
        expect(off.status).toBe(200);
        expect(off.body.response.shareUsageAnalytics).toBe(false);
        expect(off.body.response.password).toBeUndefined();
        expect(
          (await prisma.user.findUnique({ where: { id: user.id } }))
            ?.shareUsageAnalytics
        ).toBe(false);

        // Links added from now on aren't counted
        await call(linksRoute, {
          ...session,
          method: "POST",
          body: { url: "http://127.0.0.1:9/after-opt-out" },
        });
        expect(capture).not.toHaveBeenCalled();

        const on = await call(preferenceRoute, {
          ...session,
          method: "PUT",
          query: { id: String(user.id) },
          body: { shareUsageAnalytics: true },
        });
        expect(on.status).toBe(200);
        expect(
          (await prisma.user.findUnique({ where: { id: user.id } }))
            ?.shareUsageAnalytics
        ).toBe(true);
      });

      it("can be changed from the mobile app", async () => {
        const user = await createUser();

        const off = await call(preferenceRoute, {
          ...(await signedInOnPhone(user.id)),
          method: "PUT",
          query: { id: String(user.id) },
          body: { shareUsageAnalytics: false },
        });
        expect(off.status).toBe(200);
        expect(
          (await prisma.user.findUnique({ where: { id: user.id } }))
            ?.shareUsageAnalytics
        ).toBe(false);
      });

      it("leaves the setting alone when another preference changes", async () => {
        const user = await createUser(false);

        const updated = await call(preferenceRoute, {
          ...(await signedIn(user.id)),
          method: "PUT",
          query: { id: String(user.id) },
          body: { theme: "light" },
        });
        expect(updated.status).toBe(200);
        expect(
          (await prisma.user.findUnique({ where: { id: user.id } }))
            ?.shareUsageAnalytics
        ).toBe(false);
      });

      it("doesn't let one user change another user's setting", async () => {
        const user = await createUser();
        const otherUser = await createUser();

        const denied = await call(preferenceRoute, {
          ...(await signedIn(user.id)),
          method: "PUT",
          query: { id: String(otherUser.id) },
          body: { shareUsageAnalytics: false },
        });
        expect(denied.status).toBe(401);
        expect(
          (await prisma.user.findUnique({ where: { id: otherUser.id } }))
            ?.shareUsageAnalytics
        ).toBe(true);
      });

      it("rejects a value that isn't true or false", async () => {
        const user = await createUser();

        const rejected = await call(preferenceRoute, {
          ...(await signedIn(user.id)),
          method: "PUT",
          query: { id: String(user.id) },
          body: { shareUsageAnalytics: "no" },
        });
        expect(rejected.status).toBe(400);
        expect(
          (await prisma.user.findUnique({ where: { id: user.id } }))
            ?.shareUsageAnalytics
        ).toBe(true);
      });
    });

    it("turns usage analytics on for new accounts", async () => {
      const user = await prisma.user.create({
        data: { username: `default_${Date.now()}` },
      });
      createdUserIds.push(user.id);

      expect(user.shareUsageAnalytics).toBe(true);
    });
  }
);
