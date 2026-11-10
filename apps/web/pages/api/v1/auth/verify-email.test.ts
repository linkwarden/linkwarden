import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import handler from "./verify-email";
import { prisma } from "@linkwarden/prisma";
import transporter from "@linkwarden/lib/transporter";
import sendChangeEmailVerificationRequest from "@/lib/api/sendChangeEmailVerificationRequest";

// A small in-memory stand-in for the tables this flow touches, so the tests
// can follow a token from the request that issues it to the one that uses it.
const db = vi.hoisted(() => ({
  users: [] as any[],
  tokens: [] as any[],
}));

vi.mock("@linkwarden/prisma", () => {
  const matches = (row: any, where: any = {}) =>
    Object.entries(where).every(([key, value]: [string, any]) =>
      value?.gt ? row[key] > value.gt : row[key] === value
    );

  const prisma: any = {
    user: {
      findFirst: vi.fn(
        async ({ where }: any) =>
          db.users.find((u) => matches(u, where)) || null
      ),
      update: vi.fn(async ({ where, data }: any) => {
        const user = db.users.find((u) => matches(u, where));
        if (!user) throw new Error("Record to update not found.");
        return Object.assign(user, data);
      }),
    },
    account: {
      deleteMany: vi.fn(async () => ({ count: 0 })),
    },
    verificationToken: {
      create: vi.fn(async ({ data }: any) => {
        db.tokens.push({ ...data });
        return data;
      }),
      findFirst: vi.fn(
        async ({ where }: any) =>
          db.tokens.find((t) => matches(t, where)) || null
      ),
      delete: vi.fn(async ({ where }: any) => {
        const token = db.tokens.find((t) => matches(t, where));
        if (!token) throw new Error("Record to delete does not exist.");
        db.tokens = db.tokens.filter((t) => t !== token);
        return token;
      }),
      deleteMany: vi.fn(async ({ where }: any) => {
        const count = db.tokens.filter((t) => matches(t, where)).length;
        db.tokens = db.tokens.filter((t) => !matches(t, where));
        return { count };
      }),
    },
  };
  prisma.$transaction = vi.fn((fn: any) => fn(prisma));

  return { prisma };
});

vi.mock("@linkwarden/lib/transporter", () => ({
  default: { sendMail: vi.fn() },
}));

vi.mock("@/lib/api/billing/updateStripeCustomerEmail", () => ({
  default: vi.fn(),
}));

vi.mock("fs", async (importOriginal) => ({
  ...(await importOriginal<typeof import("fs")>()),
  readFileSync: vi.fn(() => "{{{url}}}"),
}));

const createMockResponse = () => {
  const state = {
    statusCode: 200,
    jsonBody: undefined as any,
  };

  const res = {
    status(code: number) {
      state.statusCode = code;
      return res;
    },
    json(body: any) {
      state.jsonBody = body;
      return res;
    },
  };

  return { res: res as any, state };
};

const verify = async (token: string) => {
  const { res, state } = createMockResponse();
  await handler({ method: "POST", query: { token } } as any, res);
  return state;
};

// Returns the token from the most recent email change message sent to `to`.
const tokenSentTo = (to: string) => {
  const mail = vi
    .mocked(transporter.sendMail)
    .mock.calls.map(([mail]) => mail as any)
    .findLast((mail) => mail.to === to);

  return new URL(mail.html).searchParams.get("token") as string;
};

const owner = "owner@example.com";
const controlled = "controlled@example.com";
const victim = "victim@example.com";

describe("/api/v1/auth/verify-email", () => {
  beforeEach(() => {
    vi.stubEnv("BASE_URL", "http://localhost:3000");
    vi.stubEnv("STRIPE_SECRET_KEY", "");
    vi.stubEnv("NEXT_PUBLIC_DEMO", "");

    db.users = [
      {
        id: 1,
        email: owner,
        emailVerified: new Date(),
        unverifiedNewEmail: null,
      },
    ];
    db.tokens = [];
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.clearAllMocks();
  });

  it("changes the email to the address the token was sent to", async () => {
    await sendChangeEmailVerificationRequest(owner, controlled, "User");

    const state = await verify(tokenSentTo(controlled));

    expect(state.statusCode).toBe(200);
    expect(db.users[0].email).toBe(controlled);
    expect(db.users[0].unverifiedNewEmail).toBeNull();
    expect(db.tokens).toHaveLength(0);
  });

  it("changes the email of an account stored with capitals", async () => {
    // Older accounts can have their email stored with capitals
    db.users[0].email = "Owner@Example.com";

    await sendChangeEmailVerificationRequest(
      "Owner@Example.com",
      controlled,
      "User"
    );

    const state = await verify(tokenSentTo(controlled));

    expect(state.statusCode).toBe(200);
    expect(db.users[0].email).toBe(controlled);
    expect(db.users[0].unverifiedNewEmail).toBeNull();
    expect(db.tokens).toHaveLength(0);
  });

  it("rejects an unknown token", async () => {
    await sendChangeEmailVerificationRequest(owner, controlled, "User");

    const state = await verify("not-a-real-token");

    expect(state.statusCode).toBe(400);
    expect(db.users[0].email).toBe(owner);
  });

  it("rejects an expired token", async () => {
    await sendChangeEmailVerificationRequest(owner, controlled, "User");
    db.tokens[0].expires = new Date(Date.now() - 1000);

    const state = await verify(tokenSentTo(controlled));

    expect(state.statusCode).toBe(400);
    expect(db.users[0].email).toBe(owner);
  });

  it("rejects the change when the new email is already in use", async () => {
    await sendChangeEmailVerificationRequest(owner, controlled, "User");
    db.users.push({ id: 2, email: controlled });

    const state = await verify(tokenSentTo(controlled));

    expect(state.statusCode).toBe(400);
    expect(db.users[0].email).toBe(owner);
  });

  it("does not let a token sent to one address verify a later address", async () => {
    await sendChangeEmailVerificationRequest(owner, controlled, "User");
    const firstToken = tokenSentTo(controlled);
    await sendChangeEmailVerificationRequest(owner, victim, "User");

    const state = await verify(firstToken);

    expect(state.statusCode).toBe(400);
    expect(db.users[0].email).toBe(owner);
    expect(db.users[0].unverifiedNewEmail).toBe(victim);
  });

  it("still accepts the token from the latest request", async () => {
    await sendChangeEmailVerificationRequest(owner, controlled, "User");
    await sendChangeEmailVerificationRequest(owner, victim, "User");

    const state = await verify(tokenSentTo(victim));

    expect(state.statusCode).toBe(200);
    expect(db.users[0].email).toBe(victim);
  });

  it("rejects a token replaced by a newer request while it is being used", async () => {
    await sendChangeEmailVerificationRequest(owner, controlled, "User");
    const firstToken = tokenSentTo(controlled);

    // A second request lands after the token is looked up but before the
    // pending email is read.
    vi.mocked(prisma.user.findFirst).mockImplementationOnce((async (
      args: any
    ) => {
      await sendChangeEmailVerificationRequest(owner, victim, "User");
      return db.users.find((u) => u.email === args.where.email);
    }) as any);

    const state = await verify(firstToken);

    expect(state.statusCode).toBe(400);
    expect(db.users[0].email).toBe(owner);
  });
});
