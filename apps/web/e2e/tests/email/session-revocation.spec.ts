import { Page } from "@playwright/test";
import { randomUUID } from "crypto";
import { expect, test } from "../../index";
import {
  completeVerification,
  credentialsLogin,
  currentUser,
  messagesTo,
  newActor,
  register,
  uniqueEmail,
  waitForMessage,
} from "../../support/accounts";

// Read before anything loads Prisma, which fills it in from packages/prisma/.env
const DATABASE_URL = process.env.DATABASE_URL;

const password = "OldPassw0rd!";
const newPassword = "NewPassw0rd!";

// A verified password account, signed in on the web by verifying it
async function verifiedAccount(email: string) {
  const web = await newActor();
  await register(web, { email, password });
  await web.post("/api/v1/auth/request-verification-email", {
    data: { email },
  });
  expect(
    await completeVerification(
      web,
      email,
      password,
      await waitForMessage(email, 0)
    )
  ).toBeNull();

  return web;
}

async function oidcSignInInBrowser(
  page: Page,
  identity: { sub: string; email: string; email_verified: boolean }
) {
  await fetch(`${process.env.E2E_OIDC_URL}/__identity`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(identity),
  });

  await page.goto("/login");
  await page.getByRole("button", { name: "OIDC" }).click();
  await expect(page.getByTestId("dashboard-wrapper")).toBeVisible({
    timeout: 30000,
  });
}

async function savePassword(
  page: Page,
  passwords: { oldPassword?: string; newPassword: string }
) {
  // The form only submits once the account has loaded
  const accountLoaded = page.waitForResponse(
    (res) => /\/api\/v1\/users\/\d+$/.test(res.url()) && res.ok()
  );
  await page.goto("/settings/password");
  await accountLoaded;

  const inputs = page.locator('input[type="password"]');
  if (passwords.oldPassword) {
    await inputs.nth(0).fill(passwords.oldPassword);
    await inputs.nth(1).fill(passwords.newPassword);
  } else {
    await expect(inputs).toHaveCount(1);
    await inputs.first().fill(passwords.newPassword);
  }
  await page.getByRole("button", { name: "Save Changes" }).click();
  await expect(page.getByText("Settings Applied!")).toBeVisible();
}

test.describe("Session revocation", { tag: "@sessions" }, () => {
  test("Resetting the password signs out every session and access token", async () => {
    const email = uniqueEmail("reset-revokes");
    const web = await verifiedAccount(email);
    expect((await currentUser(web)).status).toBe(200);

    const app = await newActor();
    const session = await app.post("/api/v1/session", {
      data: { username: email, password },
    });
    expect(session.ok()).toBe(true);
    const appSession = (await session.json()).response.token;

    const created = await web.post("/api/v1/tokens", {
      data: { name: "e2e-key", expires: 4 },
    });
    expect(created.ok()).toBe(true);
    const apiKey = (await created.json()).response.secretKey;

    const before = messagesTo(email).length;
    const owner = await newActor();
    expect(
      (
        await owner.post("/api/v1/auth/forgot-password", { data: { email } })
      ).ok()
    ).toBe(true);
    const token = (await waitForMessage(email, before)).match(
      /reset-password\?token=([0-9a-f]+)/
    )?.[1];
    expect(
      (
        await owner.post("/api/v1/auth/reset-password", {
          data: { token, password: newPassword },
        })
      ).ok()
    ).toBe(true);

    expect((await currentUser(web)).status).toBe(401);
    for (const bearer of [appSession, apiKey]) {
      const me = await app.get("/api/v1/users/me", {
        headers: { Authorization: `Bearer ${bearer}` },
      });
      expect(me.status()).toBe(401);
    }

    // The new password works on the web and in the app
    expect(
      await credentialsLogin(await newActor(), email, newPassword)
    ).toBeNull();
    const newSession = await app.post("/api/v1/session", {
      data: { username: email, password: newPassword },
    });
    expect(newSession.ok()).toBe(true);
  });
});

test.describe("Big SSO sessions", { tag: "@sessions" }, () => {
  test.skip(
    !process.env.E2E_OIDC_URL || !DATABASE_URL,
    "Needs E2E_OIDC_URL (support/oidc-provider.mjs) and DATABASE_URL"
  );

  // Azure AD stores the profile photo as a data URL, which goes into the
  // session and can make it too big for one cookie, so next-auth splits it
  test("Changing the password keeps the browser signed in when its session cookie is in chunks", async ({
    page,
  }) => {
    const email = uniqueEmail("chunked-session");
    const identity = { sub: randomUUID(), email, email_verified: true };
    await oidcSignInInBrowser(page, identity);

    const { PrismaClient } = await import("@prisma/client");
    const prisma = new PrismaClient({ datasourceUrl: DATABASE_URL });
    await prisma.user.update({
      where: { email },
      data: { image: `data:image/jpeg;base64, ${"A".repeat(3000)}` },
    });
    await prisma.$disconnect();

    await page.context().clearCookies();
    await oidcSignInInBrowser(page, identity);
    expect((await page.context().cookies()).map((c) => c.name)).toContain(
      "next-auth.session-token.0"
    );

    await savePassword(page, { newPassword: password });
    await savePassword(page, { oldPassword: password, newPassword });

    expect((await page.request.get("/api/v1/users/me")).status()).toBe(200);
    await page.reload();
    await expect(
      page.getByRole("button", { name: "Save Changes" })
    ).toBeVisible({ timeout: 15000 });
    await expect(page).toHaveURL(/\/settings\/password/);
  });
});
