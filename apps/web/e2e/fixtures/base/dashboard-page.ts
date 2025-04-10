import { Locator, Page } from "playwright";
import { BasePage } from "./page";

export class DashboardPage extends BasePage {
  container: Locator;
  constructor(page: Page) {
    super(page);
    this.container = this.page.getByTestId("dashboard-wrapper");
  }
}
