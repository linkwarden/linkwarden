import { test } from "@playwright/test";
import { dropTemplate, resetDatabase } from "../../data/reset";

test("Reset the database and the drop the template database", async () => {
  await resetDatabase();
  await dropTemplate();
});
