import { PrismaClient } from "@prisma/client";
import { createHash, randomBytes } from "crypto";
import { expect, test } from "../../index";
import {
  completeVerification,
  credentialsLogin,
  currentUser,
  followEmailLink,
  newActor,
  register,
  requestEmailLink,
  uniqueEmail,
  verificationFrom,
  waitForMessage,
} from "../../support/accounts";

const password = "E2ePassw0rd!";

// Instances upgraded from v2.16 or older can still hold email-link tokens,
// stored the NextAuth way (a hash of the token and NEXTAUTH_SECRET), and people
// can still have emails with links to /auth/verify or /api/v1/auth/callback/email,
// which no longer exist.
test.describe(
  "Email links from before the upgrade",
  { tag: "@email-upgrade" },
  () => {
    test.skip(
      !process.env.DATABASE_URL || !process.env.NEXTAUTH_SECRET,
      "Needs DATABASE_URL and the server's NEXTAUTH_SECRET to store old tokens"
    );

    const prisma = new PrismaClient();
    test.afterAll(() => prisma.$disconnect());

    // Returns the query string an old email link carried
    async function oldEmailLink(email: string) {
      const token = randomBytes(32).toString("hex");

      await prisma.verificationToken.create({
        data: {
          identifier: email,
          token: createHash("sha256")
            .update(`${token}${process.env.NEXTAUTH_SECRET}`)
            .digest("hex"),
          expires: new Date(Date.now() + 20 * 60 * 1000),
        },
      });

      return `token=${token}&email=${encodeURIComponent(email)}`;
    }

    test("An old verification link fails cleanly, and logging in sends a code instead", async () => {
      const actor = await newActor();
      const email = uniqueEmail("old-link");
      await register(actor, { email, password });
      const query = await oldEmailLink(email);

      for (const url of [
        `/auth/verify?${query}`,
        `/api/v1/auth/callback/email?${query}`,
      ]) {
        const response = await actor.get(url);
        expect(response.status(), url).toBeLessThan(500);
      }
      expect((await currentUser(actor)).status).toBe(401);

      expect(await credentialsLogin(actor, email, password)).toBe(
        "Email not verified."
      );
      expect(
        await completeVerification(
          actor,
          email,
          password,
          await waitForMessage(email, 0)
        )
      ).toBeNull();
    });

    test("An old token can't open an unverified password account through the invite callback", async () => {
      const email = uniqueEmail("old-token");
      await register(await newActor(), { email, password });
      const query = await oldEmailLink(email);

      const actor = await newActor();
      await actor.get(`/api/v1/auth/callback/invite?${query}`);

      expect((await currentUser(actor)).status).toBe(401);
      expect(
        (await prisma.user.findUnique({ where: { email } }))?.emailVerified
      ).toBeNull();
    });

    test("An invitation sent before the upgrade stops working, and a resent one works", async () => {
      const parentEmail = uniqueEmail("old-invite-parent");
      await register(await newActor(), { email: parentEmail, password });
      const parent = await prisma.user.update({
        where: { email: parentEmail },
        data: { emailVerified: new Date() },
      });
      const subscription = await prisma.subscription.create({
        data: {
          userId: parent.id,
          active: true,
          provider: "STRIPE",
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 30 * 86400000),
          quantity: 5,
        },
      });

      const email = uniqueEmail("old-invitee");
      await prisma.user.create({
        data: {
          email,
          username: `oldinvitee${Date.now()}`,
          parentSubscriptionId: subscription.id,
        },
      });

      // Invitations used to link to the email provider's callback
      const invitee = await newActor();
      const old = await invitee.get(
        `/api/v1/auth/callback/email?${await oldEmailLink(email)}`
      );
      expect(old.status()).toBeLessThan(500);
      expect((await currentUser(invitee)).status).toBe(401);

      await requestEmailLink(await newActor(), "invite", email);
      const { link } = verificationFrom(await waitForMessage(email, 0));
      await followEmailLink(invitee, link as string);

      expect((await currentUser(invitee)).body.response.email).toBe(email);
    });
  }
);
