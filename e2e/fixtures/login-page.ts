import { Locator, Page } from "@playwright/test";
import { BasePage } from "./base/page";

export class LoginPage extends BasePage {
  submitLoginButton: Locator;
  loginForm: Locator;
  registerLink: Locator;
  passwordInput: Locator;
  usernameInput: Locator;

  constructor(page: Page) {
    super(page);

    this.submitLoginButton = page.getByTestId("submit-login-button");

    this.loginForm = page.getByTestId("login-form");

    this.registerLink = page.getByTestId("register-link");

    this.passwordInput = page.getByTestId("password-input");
    this.usernameInput = page.getByTestId("username-input");
  }

  async goto() {
    await this.page.goto("/login");
  }
}
