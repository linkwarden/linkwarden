import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { Readable } from "stream";
import crypto from "crypto";
import { encode, JWT } from "next-auth/jwt";

// A self-hosted instance has no PostHog key or host. Every route that records
// usage analytics on Linkwarden Cloud runs here against a real database
// (DATABASE_URL) with the real posthog-node, which must never be set up.

const { PostHog, fetch } = vi.hoisted(() => ({
  PostHog: vi.fn(),
  fetch: vi.fn(),
}));

vi.mock("posthog-node", async (importOriginal) => {
  const actual = await importOriginal<typeof import("posthog-node")>();

  return {
    ...actual,
    PostHog: PostHog.mockImplementation(function (...args: any[]) {
      return new (actual.PostHog as any)(...args);
    }),
  };
});

// Keeps the routes from writing archives to disk
vi.mock("@linkwarden/filesystem", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@linkwarden/filesystem")>()),
  createFolder: vi.fn(),
  createFile: vi.fn(),
}));

vi.mock("next-i18next.config", () => ({
  i18n: { locales: ["en"] },
}));

const SECRET = "usage-analytics-self-hosted-secret";
const COOKIE = "next-auth.session-token";
const IOS_USER_AGENT = "Linkwarden/42 CFNetwork/3826.500.111 Darwin/25.0.0";

let prisma: typeof import("@linkwarden/prisma").prisma;
let usersRoute: typeof import("@/pages/api/v1/users").default;
let linksRoute: typeof import("@/pages/api/v1/links").default;
let collectionsRoute: typeof import("@/pages/api/v1/collections").default;
let preferenceRoute: typeof import("@/pages/api/v1/users/[id]/preference").default;
let migrationRoute: typeof import("@/pages/api/v1/migration").default;
let archivesRoute: typeof import("@/pages/api/v1/archives").default;
let configRoute: typeof import("@/pages/api/v1/config").default;

const createdUserIds: number[] = [];

type Request = {
  method?: string;
  query?: Record<string, unknown>;
  headers?: Record<string, string>;
  cookies?: Record<string, string>;
  body?: unknown;
};

// Calls a route the way Next.js would and waits for its response, which the
// upload route sends after the handler returns
const call = (handler: any, request: Request = {}, req?: any) =>
  new Promise<{ status: number; body: any }>((resolve, reject) => {
    const state = { status: 200, body: undefined as any };

    const res: any = {
      status(code: number) {
        state.status = code;
        return res;
      },
      setHeader: () => res,
      json(body: any) {
        state.body = body;
        resolve(state);
        return res;
      },
      end: () => {
        resolve(state);
        return res;
      },
    };

    Promise.resolve(
      handler(
        Object.assign(req ?? {}, {
          method: "GET",
          query: {},
          headers: {},
          cookies: {},
          ...request,
        }),
        res
      )
    ).catch(reject);
  });

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

const multipart = (filename: string, mimeType: string, content: Buffer) => {
  const boundary = `----linkwarden${crypto.randomUUID()}`;
  const body = Buffer.concat([
    Buffer.from(
      `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${filename}"\r\nContent-Type: ${mimeType}\r\n\r\n`
    ),
    content,
    Buffer.from(`\r\n--${boundary}--\r\n`),
  ]);

  return {
    headers: {
      "content-type": `multipart/form-data; boundary=${boundary}`,
      "content-length": String(body.length),
    },
    stream: Readable.from([body]),
  };
};

describe.skipIf(!process.env.DATABASE_URL)(
  "usage analytics on a self-hosted instance",
  () => {
    beforeAll(async () => {
      vi.stubEnv("NEXTAUTH_SECRET", SECRET);
      vi.stubEnv("NEXTAUTH_URL", "http://127.0.0.1:3000/api/v1/auth");
      vi.stubEnv("STRIPE_SECRET_KEY", "");
      vi.stubEnv("NEXT_PUBLIC_DEMO", "false");
      vi.stubEnv("NEXT_PUBLIC_DISABLE_REGISTRATION", "false");
      vi.stubEnv("NEXT_PUBLIC_EMAIL_PROVIDER", "false");
      vi.stubEnv("EMAIL_FROM", "");
      vi.stubEnv("EMAIL_SERVER", "");
      vi.stubEnv("NEXT_PUBLIC_POSTHOG_KEY", "");
      vi.stubEnv("NEXT_PUBLIC_POSTHOG_HOST", "");

      // Anything posthog-node sent would go through fetch
      vi.stubGlobal("fetch", fetch);

      prisma = (await import("@linkwarden/prisma")).prisma;
      usersRoute = (await import("@/pages/api/v1/users")).default;
      linksRoute = (await import("@/pages/api/v1/links")).default;
      collectionsRoute = (await import("@/pages/api/v1/collections")).default;
      preferenceRoute = (await import("@/pages/api/v1/users/[id]/preference"))
        .default;
      migrationRoute = (await import("@/pages/api/v1/migration")).default;
      archivesRoute = (await import("@/pages/api/v1/archives")).default;
      configRoute = (await import("@/pages/api/v1/config")).default;
    });

    afterAll(async () => {
      if (!prisma) return;

      await prisma.user.deleteMany({ where: { id: { in: createdUserIds } } });
      await prisma.$disconnect();
      vi.unstubAllEnvs();
      vi.unstubAllGlobals();
    });

    it("never sets up PostHog or sends anything, whatever the user does", async () => {
      const username = `selfhosted_${Date.now()}`;

      const signedUp = await call(usersRoute, {
        method: "POST",
        headers: { "user-agent": IOS_USER_AGENT },
        body: { name: "Self Hoster", username, password: "password-123" },
      });
      expect(signedUp.status).toBe(201);
      const userId = signedUp.body.response.id;
      createdUserIds.push(userId);
      expect(signedUp.body.response.shareUsageAnalytics).toBe(true);

      const session = await signedIn(userId);

      const collection = await call(collectionsRoute, {
        ...session,
        method: "POST",
        body: { name: "Self-hosted collection" },
      });
      expect(collection.status).toBe(200);

      const link = await call(linksRoute, {
        ...session,
        method: "POST",
        body: {
          url: "http://localhost/self-hosted",
          collection: { id: collection.body.response.id },
        },
      });
      expect(link.status).toBe(200);

      const imported = await call(
        migrationRoute,
        { ...session, method: "POST" },
        Readable.from([
          Buffer.from(
            JSON.stringify({
              format: 1,
              data: `<!DOCTYPE NETSCAPE-Bookmark-file-1>\n<DL><p>\n<DT><A HREF="https://example.com/a">A</A>\n</DL><p>`,
            })
          ),
        ])
      );
      expect(imported.status).toBe(200);

      const pdf = multipart(
        "doc.pdf",
        "application/pdf",
        Buffer.from("%PDF-1.4\nself-hosted\n%%EOF\n")
      );
      const uploaded = await call(
        archivesRoute,
        {
          ...session,
          method: "POST",
          query: { format: "2" },
          headers: pdf.headers,
        },
        pdf.stream
      );
      expect(uploaded.status).toBe(200);

      // The setting can still be changed, it just has no effect here
      const preference = await call(preferenceRoute, {
        ...session,
        method: "PUT",
        query: { id: String(userId) },
        body: { shareUsageAnalytics: false },
      });
      expect(preference.status).toBe(200);
      expect(preference.body.response.shareUsageAnalytics).toBe(false);

      expect(PostHog).not.toHaveBeenCalled();
      expect(fetch).not.toHaveBeenCalled();
    });

    it("tells the apps there's nothing to set up", async () => {
      const config = await call(configRoute);

      expect(config.body.response).toMatchObject({
        POSTHOG_KEY: null,
        POSTHOG_HOST: null,
      });
    });
  }
);
