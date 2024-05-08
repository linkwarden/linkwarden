import { Client } from "pg";

async function getDatabaseClient() {
  testEnvChecks();
  const env = getEnv();
  const client = new Client(env.superuser);
  await client.connect();
  return client;
}

function getEnv() {
  return {
    host: process.env.TEST_POSTGRES_HOST || "localhost",
    port: process.env.TEST_POSTGRES_HOST
      ? Number(process.env.TEST_POSTGRES_HOST)
      : 5432,
    user: process.env.TEST_POSTGRES_USER || "test_linkwarden_user",
    testDatabase: process.env.TEST_POSTGRES_DATABASE || "test_linkwarden_db",
    testDatabaseTemplate:
      process.env.TEST_POSTGRES_DATABASE_TEMPLATE || "test_linkwarden_db_template",
    productionDatabase: process.env.PRODUCTION_POSTGRES_DATABASE || "linkwarden",
    superuser: {
      host: process.env.PGHOST || "localhost",
      port: process.env.PGPORT ? Number(process.env.PGPORT) : 5432,
      user: process.env.PGUSER || "postgres",
      password: process.env.PGPASSWORD || "password",
      database: process.env.PGDATABASE || "postgres",
    },
  };
}

function testEnvChecks() {
  const env = getEnv();
  if (!env.testDatabase.startsWith("test_")) {
    const msg =
      "Please make sure your test environment database name starts with test_";
    console.error(msg);
    throw new Error(msg);
  }
  if (env.testDatabase === env.productionDatabase) {
    const msg =
      "Please make sure your test environment database and production environment database names are not equal";
    console.error(msg);
    throw new Error(msg);
  }
}

async function createTemplateDatabase(client: Client) {
  const { user, testDatabase, testDatabaseTemplate } = getEnv();
  try {
    // close current connections
    await client.query(`
      ALTER DATABASE ${testDatabase} WITH ALLOW_CONNECTIONS false;
      SELECT pg_terminate_backend(pid) FROM pg_stat_activity
        WHERE datname='${testDatabase}';
    `);
    await client.query(`
      CREATE DATABASE ${testDatabaseTemplate} WITH
        OWNER=${user}
        TEMPLATE=${testDatabase}
        IS_TEMPLATE=true;
    `);
  } catch (e: any) {
    if (e.code === "42P04") {
      return;
    }
    throw e;
  }
}

async function createTestDatabase(client: Client) {
  const { user, testDatabase, testDatabaseTemplate } = getEnv();
  const deleteDatabase = `${testDatabase}_del`;
  // drop connections and alter database name
  await client.query(`
    SELECT pg_terminate_backend(pid)
      FROM pg_stat_activity
      WHERE datname='${testDatabase}';
    ALTER DATABASE ${testDatabase}
      RENAME TO ${deleteDatabase};
  `);
  await client.query(`
    CREATE DATABASE ${testDatabase}
      WITH OWNER ${user}
      TEMPLATE=${testDatabaseTemplate};
  `);
  await client.query(`DROP DATABASE ${deleteDatabase}`);
}

export async function resetDatabase() {
  const client = await getDatabaseClient();
  await createTemplateDatabase(client);
  await createTestDatabase(client);
  await client.end();
}

export async function dropTemplate() {
  const client = await getDatabaseClient();
  const env = getEnv();
  try {
    await client.query(
      `ALTER DATABASE ${env.testDatabaseTemplate} is_template false`
    );
    await client.query(`DROP DATABASE ${env.testDatabaseTemplate}`);
  } catch (e) {}
  await client.end();
}