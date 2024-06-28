import { expect, test } from "../../index";

test.describe(
  "Registration test suite",
  {
    tag: "@registration",
  },
  async () => {
    test("Registration page is accessible from login page", async ({
      loginPage,
      registrationPage,
    }) => {
      await loginPage.goto();
      await loginPage.registerLink.click();
      await expect(registrationPage.registrationForm).toBeVisible();
    });

    test("Login page is accessible from registration page", async ({
      loginPage,
      registrationPage,
    }) => {
      await registrationPage.goto();
      await registrationPage.loginLink.click();
      await expect(loginPage.loginForm).toBeVisible();
    });

    test("Ensure filling out all the fields is required and registration works after errors", async ({
      loginPage,
      registrationPage,
    }) => {
      await registrationPage.goto();
      await test.step("An empty form gives an error", async () => {
        await registrationPage.registerButton.click();
        const toast = await registrationPage.getLatestToast();
        await expect(toast.locator).toHaveAttribute("data-type", "error");
        await toast.closeButton.click();
        await toast.locator.waitFor({ state: "hidden" });
      });
      await test.step("Filling in only the display name gives an error", async () => {
        await registrationPage.displayNameInput.fill("Display name");
        await registrationPage.registerButton.click();
        const toast = await registrationPage.getLatestToast();
        await expect(toast.locator).toHaveAttribute("data-type", "error");
        await toast.closeButton.click();
        await toast.locator.waitFor({ state: "hidden" });
      });
      await test.step("Filling in only the display name and username gives and error", async () => {
        await registrationPage.usernameInput.fill("testing-username-123");
        await registrationPage.registerButton.click();
        const toast = await registrationPage.getLatestToast();
        await expect(toast.locator).toHaveAttribute("data-type", "error");
        await toast.closeButton.click();
        await toast.locator.waitFor({ state: "hidden" });
      });
      await test.step("Filling in only the display name, username, and password gives and error", async () => {
        await registrationPage.passwordInput.fill("pP24^%$boau");
        await registrationPage.registerButton.click();
        const toast = await registrationPage.getLatestToast();
        await expect(toast.locator).toHaveAttribute("data-type", "error");
        await toast.closeButton.click();
        await toast.locator.waitFor({ state: "hidden" });
      });
      await test.step("Ensure after filling in the form correctly, it still let's the user register", async () => {
        await registrationPage.passwordConfirmInput.fill("pP24^%$boau");
        await registrationPage.registerButton.click();
        await expect(loginPage.loginForm).toBeVisible();
        const toast = await registrationPage.getLatestToast();
        await expect(toast.locator).toHaveAttribute("data-type", "success");
      });
    });

    test("After successful registration user can successfully login", async ({
      dashboardPage,
      loginPage,
      registrationPage,
    }) => {
      await test.step("Register the user", async () => {
        await registrationPage.goto();
        await registrationPage.displayNameInput.fill("Test name");
        await registrationPage.usernameInput.fill("new-registration-username");
        await registrationPage.passwordInput.fill("Pp4seword@1");
        await registrationPage.passwordConfirmInput.fill("Pp4seword@1");
        await registrationPage.registerButton.click();
        await expect(loginPage.loginForm).toBeVisible();
        const toast = await registrationPage.getLatestToast();
        await expect(toast.locator).toHaveAttribute("data-type", "success");
      });
      await test.step("Login the user", async () => {
        await loginPage.usernameInput.fill("new-registration-username");
        await loginPage.passwordInput.fill("Pp4seword@1");
        await loginPage.submitLoginButton.click();
        await expect(dashboardPage.container).toBeVisible();
      });
    });

    test("Ensure mismatching passwords gives an error", async ({
      registrationPage,
    }) => {
      await registrationPage.goto();
      await registrationPage.displayNameInput.fill("Test name");
      await registrationPage.usernameInput.fill("new-test-username");
      await registrationPage.passwordInput.fill("Pp4seword@1");
      await registrationPage.passwordConfirmInput.fill("Pp4seword@1333");
      await registrationPage.registerButton.click();
      const toast = await registrationPage.getLatestToast();
      await expect(toast.locator).toHaveAttribute("data-type", "error");
    });
  }
);
