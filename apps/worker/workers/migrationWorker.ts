import { prisma } from "@linkwarden/prisma";
import { AppMigrationStatus } from "@linkwarden/prisma/client";

export async function migrationWorker() {
  console.log("\x1b[34m%s\x1b[0m", "Checking for migrations...");

  // go through all the migrations one by one in order, first see where it needs to start
  try {
    const dbMigrations = await prisma.appMigration.findMany();

    const statusByName = new Map(dbMigrations.map((m) => [m.name, m.status]));

    // sort by id
    const ordered = [...migrations].sort((a, b) => a.id - b.id);

    // find the first migration that's not APPLIED
    const firstIdx = ordered.findIndex(
      (m) => statusByName.get(m.name) !== AppMigrationStatus.APPLIED
    );

    if (firstIdx === -1) {
      // console.log("\x1b[32m%s\x1b[0m", "No pending migrations."); // Uncomment later
      return;
    }

    for (let i = firstIdx; i < ordered.length; i++) {
      const m = ordered[i];
      const status = statusByName.get(m.name);

      if (status === AppMigrationStatus.APPLIED) continue;

      console.log("\x1b[34m%s\x1b[0m", `Applying ${m.name}...`);

      await prisma.appMigration.upsert({
        where: { name: m.name },
        create: { name: m.name, status: AppMigrationStatus.PENDING },
        update: { status: AppMigrationStatus.PENDING, finishedAt: null },
      });

      try {
        await m.run();

        await prisma.appMigration.update({
          where: { name: m.name },
          data: { status: AppMigrationStatus.APPLIED, finishedAt: new Date() },
        });

        statusByName.set(m.name, AppMigrationStatus.APPLIED);
        console.log("\x1b[32m%s\x1b[0m", `Applied ${m.name}`);
      } catch (err) {
        await prisma.appMigration.update({
          where: { name: m.name },
          data: { status: AppMigrationStatus.FAILED, finishedAt: new Date() },
        });

        console.error("\x1b[31m%s\x1b[0m", `FAILED ${m.name}`);
        throw err;
      }
    }

    console.log("\x1b[32m%s\x1b[0m", "All migrations applied.");
  } catch (e) {
    throw e;
  }
}

type AppMigrationDef = {
  id: number;
  name: string;
  run: () => Promise<void>;
};

const migrations: AppMigrationDef[] = [
  // {
  //   id: 1,
  //   name: "0001_first_migration",
  //   run: async () => {},
  // },
  // to create a new `AppMigrationDef`, make sure to have the `id` and the `name` field to be unique (incremental id)
];
