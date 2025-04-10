import { expect, test } from "../../index";

test.describe(
  "Login test suite",
  {
    tag: "@login",
  },
  async () => {
    test("Logging in without credentials displays an error", async ({
      loginPage,
    }) => {
      await loginPage.submitLoginButton.click();
      const toast = await loginPage.getLatestToast();
      await expect(toast.locator).toBeVisible();
      await expect(toast.locator).toHaveAttribute("data-type", "error");
    });

    test("Logging in with an erroneous password displays an error", async ({
      loginPage,
    }) => {
      await loginPage.usernameInput.fill(process.env["TEST_USERNAME"] || "");
      await loginPage.passwordInput.fill("NOT_MY_PASSWORD_DNE_ERROR");
      await loginPage.submitLoginButton.click();
      const toast = await loginPage.getLatestToast();
      await expect(toast.locator).toBeVisible();
      await expect(toast.locator).toHaveAttribute("data-type", "error");
    });

    test("Logging in without valid credentials displays an error", async ({
      loginPage,
    }) => {
      await loginPage.submitLoginButton.click();
      const toast = await loginPage.getLatestToast();
      await expect(toast.locator).toBeVisible();
      await expect(toast.locator).toHaveAttribute("data-type", "error");
    });

    test("Logging in with a valid username and password works as expected", async ({
      page,
      loginPage,
      dashboardPage,
    }) => {
      await loginPage.usernameInput.fill(process.env["TEST_USERNAME"] || "");
      await loginPage.passwordInput.fill(process.env["TEST_PASSWORD"] || "");
      await loginPage.submitLoginButton.click();
      await expect(loginPage.loginForm).not.toBeVisible();
      await expect(dashboardPage.container).toBeVisible();
    });
  }
);
