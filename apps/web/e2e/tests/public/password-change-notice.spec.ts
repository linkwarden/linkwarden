import { Locator } from "@playwright/test";
import { expect, test } from "../../index";
import { createUser } from "@/e2e/data/api";

const changeNotice =
  "Changing your password signs you out on every other device and revokes all your access tokens, including the ones used by integrations like Floccus or the browser extension. You'll stay signed in here.";
const resetNotice =
  "Resetting your password signs you out on every device and revokes all your access tokens, including the ones used by integrations like Floccus or the browser extension.";

// The notice has to be read before the change is made, so it sits above the button
async function expectAbove(notice: Locator, button: Locator) {
  await expect(notice).toBeVisible();
  await expect(button).toBeVisible();
  const noticeBox = (await notice.boundingBox())!;
  const buttonBox = (await button.boundingBox())!;
  expect(noticeBox.y + noticeBox.height).toBeLessThanOrEqual(buttonBox.y);
}

test.describe("Password change notice", () => {
  test("Changing the password says which sessions and tokens it ends before saving", async ({
    page,
    request,
  }) => {
    const user = await createUser(request, "notice");

    await page.goto("/login");
    await page.getByTestId("username-input").fill(user.username);
    await page.getByTestId("password-input").fill("password");
    await page.getByTestId("submit-login-button").click();
    await expect(page.getByTestId("dashboard-wrapper")).toBeVisible();

    await page.goto("/settings/password");
    await expect(page.locator('input[type="password"]')).toHaveCount(2);
    await expectAbove(
      page.getByText(changeNotice, { exact: true }),
      page.getByRole("button", { name: "Save Changes" })
    );
  });

  test("Resetting the password says it ends every session and token before resetting", async ({
    page,
  }) => {
    await page.goto("/auth/reset-password?token=not-checked-until-submitted");

    await expectAbove(
      page.getByText(resetNotice, { exact: true }),
      page.getByRole("button", { name: "Update Password" })
    );
  });
});
