import { test as baseTest } from "@playwright/test";
import { LoginPage } from "./login-page";
import { RegistrationPage } from "./registration-page";
import { DashboardPage } from "./base/dashboard-page";
import { resetDatabase } from "../data/reset";
import axios, { AxiosError } from "axios";
import { signIn } from "next-auth/react";
import { seedUser } from "../data/user";

export const test = baseTest.extend<{
  resetDatabaseFixture: void;
  dashboardPage: DashboardPage;
  loginPage: LoginPage;
  registrationPage: RegistrationPage;
}>({
  resetDatabaseFixture: [
    async function ({ loginPage }, use) {
      await resetDatabase();
      await seedUser();

      await loginPage.goto();
      await loginPage.page.reload();
      await loginPage.usernameInput.fill("test-fake");
      await loginPage.passwordInput.fill("password-fake");
      await loginPage.submitLoginButton.click();
      await (
        await loginPage.getLatestToast()
      ).locator.waitFor({ state: "visible" });
      await loginPage.page.reload();
      try {
        // await axios.get("")
        await signIn("credentials", {
          username: process.env["TEST_USERNAME"] || "test",
          password: process.env["TEST_PASSWORD"] || "password",
          redirect: false,
        });
        //await axios.get("http://localhost:3000/login");
      } catch (e) {
        // console.log("error", e);
      }
      // await page.waitForTimeout(1000);

      await use();
    },
    { auto: true, timeout: 10000 },
  ],
  page: async ({ page }, use) => {
    await page.goto("/");
    use(page);
  },
  dashboardPage: async ({ page }, use) => {
    const dashboardPage = new DashboardPage(page);
    await use(dashboardPage);
  },
  loginPage: async ({ page }, use) => {
    const loginPage = new LoginPage(page);
    await use(loginPage);
  },
  registrationPage: async ({ page }, use) => {
    const registrationPage = new RegistrationPage(page);
    await use(registrationPage);
  },
});
