import { test as baseTest } from "@playwright/test";
import { LoginPage } from "./login-page";
import { RegistrationPage } from "./registration-page";
import { DashboardPage } from "./base/dashboard-page";

export const test = baseTest.extend<{
  dashboardPage: DashboardPage;
  loginPage: LoginPage;
  registrationPage: RegistrationPage;
}>({
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
