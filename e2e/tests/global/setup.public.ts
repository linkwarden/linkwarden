import { seedUser } from "@/e2e/data/user";
import { test as setup } from "../../index";

setup("Setup the default user", async () => {
  await seedUser();
});
