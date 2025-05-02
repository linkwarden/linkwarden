import { Locator, Page } from "@playwright/test";

export class BasePage {
  page: Page;
  toastMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.toastMessage = this.page.getByTestId("toast-message-container");
  }

  async getLatestToast() {
    const toast = this.toastMessage.first();
    return {
      locator: toast,
      closeButton: toast.getByTestId("close-toast-button"),
      message: toast.getByTestId("toast-message"),
    };
  }
}
