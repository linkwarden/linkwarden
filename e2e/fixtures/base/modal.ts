import { Locator, Page } from "@playwright/test";

export class BaseModal {
  page: Page;
  container: Locator;
  mobileContainer: Locator;
  closeModalButton: Locator;
  mobileModalSlider: Locator;

  constructor(page: Page) {
    this.page = page;
    this.container = page.getByTestId("modal-container");
    this.mobileContainer = page.getByTestId("mobile-modal-container");
    this.closeModalButton = this.container.getByTestId("close-modal-button");
    this.mobileModalSlider = this.mobileContainer.getByTestId(
      "mobile-modal-slider"
    );
  }

  async close() {
    if (await this.container.isVisible()) {
      await this.closeModalButton.click();
    }
    if (await this.mobileContainer.isVisible()) {
      const box = await this.mobileModalSlider.boundingBox();
      if (!box) {
        return;
      }
      const pageHeight = await this.page.evaluate(() => window.innerHeight);
      const startX = box.x + box.width / 2;
      const startY = box.y + box.height / 2;
      await this.page.mouse.move(startX, startY);
      await this.page.mouse.down();
      await this.page.mouse.move(startX, startY + pageHeight / 2);
      await this.page.mouse.up();
    }
  }

  async isOpen() {
    return (
      (await this.container.isVisible()) ||
      (await this.mobileContainer.isVisible())
    );
  }
}
