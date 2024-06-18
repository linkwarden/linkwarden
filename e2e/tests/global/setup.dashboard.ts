import { seedUser } from "@/e2e/data/user";
import { test as setup } from "../../index";
import { STORAGE_STATE } from "../../../playwright.config";

setup("Setup the default user", async ({ page, dashboardPage, loginPage }) => {
  const username = process.env["TEST_USERNAME"] || "";
  const password = process.env["TEST_PASSWORD"] || "";
  await seedUser(username, password);

  await loginPage.goto();
  await loginPage.usernameInput.fill(username);
  await loginPage.passwordInput.fill(password);
  await loginPage.submitLoginButton.click();
  await dashboardPage.container.waitFor({ state: "visible" });

  await page.context().storageState({
    path: STORAGE_STATE,
  });
});
