import { PrismaClient } from "@prisma/client";
import { randomUUID } from "crypto";
import { expect, test } from "../../index";
import {
  completeVerification,
  credentialsLogin,
  currentUser,
  followEmailLink,
  messagesTo,
  newActor,
  oidcSignIn,
  register,
  requestEmailLink,
  uniqueEmail,
  verificationFrom,
  waitForMessage,
} from "../../support/accounts";

// Someone registers an email they don't own with their own password, then
// waits for the real owner to verify it (GHSA-6754-3359-35f4). Whatever the
// owner does, the stranger's password must never open an account the owner uses.

const attackerPassword = "AttackerPw1!";
const victimPassword = "VictimsOwnPw9";

const maybeMessage = (email: string, previous: number) =>
  waitForMessage(email, previous).catch(() => undefined);

async function preRegister(email: string) {
  const attacker = await newActor();
  expect(
    (await register(attacker, { email, password: attackerPassword })).ok()
  ).toBe(true);
  return attacker;
}

async function expectAttackerLockedOut(email: string) {
  const attacker = await newActor();
  expect(
    await credentialsLogin(attacker, email, attackerPassword)
  ).not.toBeNull();
  expect((await currentUser(attacker)).status).toBe(401);
}

test.describe("Account pre-hijacking", { tag: "@prehijack" }, () => {
  test("A magic-link sign-in doesn't verify an account someone else registered", async () => {
    const email = uniqueEmail("magic-link");
    await preRegister(email);

    const victim = await newActor();
    await requestEmailLink(victim, "email", email);

    const message = await maybeMessage(email, 0);
    const link = message && verificationFrom(message).link;
    if (link) await followEmailLink(victim, link);

    await expectAttackerLockedOut(email);
  });

  test("Typing your own password for a pre-registered email doesn't start verification", async ({
    page,
    loginPage,
  }) => {
    const email = uniqueEmail("login-funnel");
    await preRegister(email);

    await loginPage.goto();
    await loginPage.usernameInput.fill(email);
    await loginPage.passwordInput.fill(victimPassword);
    await loginPage.submitLoginButton.click();

    await expect(page.getByText("Invalid credentials.")).toBeVisible();
    await page.waitForTimeout(2000);
    expect(new URL(page.url()).pathname).toBe("/login");
    expect(messagesTo(email)).toHaveLength(0);
  });

  test("Acting on a verification email you didn't ask for doesn't hand over the account", async () => {
    const email = uniqueEmail("unsolicited");
    const attacker = await preRegister(email);
    await attacker.post("/api/v1/auth/request-verification-email", {
      data: { email },
    });

    const victim = await newActor();
    const { code, link } = verificationFrom(await waitForMessage(email, 0));
    if (link) await followEmailLink(victim, link);
    if (code)
      expect(
        await credentialsLogin(victim, email, victimPassword, code)
      ).not.toBeNull();

    await expectAttackerLockedOut(email);
  });

  test("The mobile app can't log into a pre-registered account from the email alone", async () => {
    const email = uniqueEmail("mobile-link");
    const attacker = await preRegister(email);
    await attacker.post("/api/v1/auth/request-verification-email", {
      data: { email },
    });

    const victim = await newActor();
    const { code, link } = verificationFrom(await waitForMessage(email, 0));

    const session = link
      ? await victim.post("/api/v1/auth/verify-email-token", {
          data: { token: new URL(link).searchParams.get("token"), email },
        })
      : await victim.post("/api/v1/session", {
          data: { username: email, password: victimPassword, code },
        });

    expect(session.status()).not.toBe(200);
    await expectAttackerLockedOut(email);
  });

  test("Resetting the password takes a pre-registered account back", async () => {
    const email = uniqueEmail("reset");
    await preRegister(email);

    const victim = await newActor();
    expect(
      (
        await victim.post("/api/v1/auth/forgot-password", { data: { email } })
      ).ok()
    ).toBe(true);
    const token = (await waitForMessage(email, 0)).match(
      /reset-password\?token=([0-9a-f]+)/
    )?.[1];
    expect(
      (
        await victim.post("/api/v1/auth/reset-password", {
          data: { token, password: victimPassword },
        })
      ).ok()
    ).toBe(true);

    const before = messagesTo(email).length;
    await victim.post("/api/v1/auth/request-verification-email", {
      data: { email },
    });
    expect(
      await completeVerification(
        victim,
        email,
        victimPassword,
        await waitForMessage(email, before)
      )
    ).toBeNull();

    expect((await currentUser(victim)).body.response.email).toBe(email);
    await expectAttackerLockedOut(email);
  });
});

test.describe("Invitations", { tag: "@prehijack" }, () => {
  test.skip(!process.env.DATABASE_URL, "Needs DATABASE_URL to seed invites");

  const prisma = new PrismaClient();
  test.afterAll(() => prisma.$disconnect());

  // A paying user whose subscription the invited accounts belong to
  async function parentSubscription() {
    const email = uniqueEmail("parent");
    await register(await newActor(), { email, password: attackerPassword });
    const parent = await prisma.user.update({
      where: { email },
      data: { emailVerified: new Date() },
    });

    return prisma.subscription.create({
      data: {
        userId: parent.id,
        active: true,
        provider: "STRIPE",
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 86400000),
        quantity: 5,
      },
    });
  }

  test("An invitation link logs in an invited member", async () => {
    const subscription = await parentSubscription();
    const email = uniqueEmail("invitee");
    await prisma.user.create({
      data: {
        email,
        username: `invitee${Date.now()}`,
        parentSubscriptionId: subscription.id,
      },
    });

    const invitee = await newActor();
    await requestEmailLink(await newActor(), "invite", email);
    const { link } = verificationFrom(await waitForMessage(email, 0));
    await followEmailLink(invitee, link as string);

    expect((await currentUser(invitee)).body.response.email).toBe(email);
  });

  test("An invitation link can't log into an account that already has a password", async () => {
    const subscription = await parentSubscription();
    const email = uniqueEmail("invite-password");
    await preRegister(email);
    await prisma.user.update({
      where: { email },
      data: { parentSubscriptionId: subscription.id },
    });

    const victim = await newActor();
    await requestEmailLink(await newActor(), "invite", email);

    const message = await maybeMessage(email, 0);
    const link = message && verificationFrom(message).link;
    if (link) await followEmailLink(victim, link);

    expect((await currentUser(victim)).status).toBe(401);
    await expectAttackerLockedOut(email);
  });
});

test.describe("OpenID Connect sign-in", { tag: "@prehijack" }, () => {
  test.skip(
    !process.env.E2E_OIDC_URL,
    "Needs E2E_OIDC_URL (support/oidc-provider.mjs)"
  );

  const identity = (email: string, email_verified = true) => ({
    sub: randomUUID(),
    email,
    email_verified,
    name: "OIDC User",
  });

  async function verifiedAccount(email: string) {
    const actor = await newActor();
    await register(actor, { email, password: victimPassword });
    await actor.post("/api/v1/auth/request-verification-email", {
      data: { email },
    });
    expect(
      await completeVerification(
        actor,
        email,
        victimPassword,
        await waitForMessage(email, 0)
      )
    ).toBeNull();
  }

  test("Signing in with OIDC creates a verified account", async () => {
    const email = uniqueEmail("oidc-new");
    const actor = await newActor();

    expect(await oidcSignIn(actor, identity(email))).toBeNull();
    expect((await currentUser(actor)).body.response.email).toBe(email);
  });

  test("OIDC links to an existing verified account and keeps its password", async () => {
    const email = uniqueEmail("oidc-link");
    await verifiedAccount(email);

    const actor = await newActor();
    expect(await oidcSignIn(actor, identity(email))).toBeNull();
    expect((await currentUser(actor)).body.response.email).toBe(email);
    expect(
      await credentialsLogin(await newActor(), email, victimPassword)
    ).toBeNull();
  });

  test("OIDC doesn't link when the provider hasn't verified the email", async () => {
    const email = uniqueEmail("oidc-unverified");
    await verifiedAccount(email);

    const actor = await newActor();
    expect(await oidcSignIn(actor, identity(email, false))).not.toBeNull();
    expect((await currentUser(actor)).status).toBe(401);
  });

  test("OIDC sign-in to a pre-registered email gives the account to its owner", async () => {
    const email = uniqueEmail("oidc-prehijack");
    await preRegister(email);

    const victim = await newActor();
    expect(await oidcSignIn(victim, identity(email))).toBeNull();
    expect((await currentUser(victim)).body.response?.email).toBe(email);

    // The owner can use the account right away, which needs a verified email
    expect((await victim.get("/api/v1/collections")).status()).toBe(200);

    // And if the owner later acts on a verification email, the stranger stays out
    await victim.post("/api/v1/auth/request-verification-email", {
      data: { email },
    });
    const message = await maybeMessage(email, 0);
    const link = message && verificationFrom(message).link;
    if (link) await followEmailLink(victim, link);

    await expectAttackerLockedOut(email);
  });
});
