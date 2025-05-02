import { seedUser } from "@/e2e/data/user";
import { test as setup } from "../../index";

setup("Setup the default user", async () => {
  const username = process.env["TEST_USERNAME"] || "";
  const password = process.env["TEST_PASSWORD"] || "";
  await seedUser(username, password);
});
