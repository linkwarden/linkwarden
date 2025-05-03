import { Locator, Page } from "@playwright/test";
import { BasePage } from "./base/page";

export class RegistrationPage extends BasePage {
  registerButton: Locator;
  registrationForm: Locator;

  loginLink: Locator;

  displayNameInput: Locator;
  passwordConfirmInput: Locator;
  passwordInput: Locator;
  usernameInput: Locator;

  constructor(page: Page) {
    super(page);

    this.registerButton = page.getByTestId("register-button");
    this.registrationForm = page.getByTestId("registration-form");

    this.loginLink = page.getByTestId("login-link");

    this.displayNameInput = page.getByTestId("display-name-input");
    this.passwordConfirmInput = page.getByTestId("password-confirm-input");
    this.passwordInput = page.getByTestId("password-input");
    this.usernameInput = page.getByTestId("username-input");
  }
}
