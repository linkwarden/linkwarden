import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import bcrypt from "bcrypt";

// Repros for open issues with the password retry limit. Each one is marked
// it.fails while the issue is open: once it's fixed, turn it into a plain it().

const PASSWORD = "Corr3ct-horse";

let prisma: typeof import("@linkwarden/prisma").prisma;

const createdIds: number[] = [];

const createUser = async (label: string) => {
  const username = `${label}-${Date.now().toString(36)}${Math.random()
    .toString(36)
    .slice(2, 7)}`;
  const user = await prisma.user.create({
    data: { username, password: bcrypt.hashSync(PASSWORD, 4) },
  });
  createdIds.push(user.id);
  return user;
};

describe.skipIf(!process.env.DATABASE_URL)("password retry findings", () => {
  beforeAll(async () => {
    prisma = (await import("@linkwarden/prisma")).prisma;
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  afterAll(async () => {
    if (!prisma) return;

    await prisma.user.deleteMany({ where: { id: { in: createdIds } } });
    await prisma.$disconnect();
  });

  // Behind a round-robin load balancer, requests alternate between servers.
  // Once their clocks are more than 25 seconds apart, each one reads the
  // other's last attempt as either old enough or "from a wrong clock". Fails
  // until the limit holds with servers whose clocks are that far apart.
  it.fails(
    "keeps the limit when requests alternate between two servers whose clocks are a minute apart",
    async () => {
      const verifyByCredentials = (await import("./verifyByCredentials"))
        .default;
      const user = await createUser("skewed-servers");

      for (let i = 0; i < 15; i++)
        expect(
          (
            await verifyByCredentials({
              username: user.username!,
              password: `wrong-${i}`,
            })
          ).status
        ).toBe("invalid_credentials");

      const realNow = Date.now;
      const statuses: string[] = [];

      for (let i = 0; i < 10; i++) {
        // Every other request reaches the server whose clock runs a minute ahead
        const spy = vi
          .spyOn(Date, "now")
          .mockReturnValue(realNow() + (i % 2 ? 60_000 : 0));
        statuses.push(
          (
            await verifyByCredentials({
              username: user.username!,
              password: `guess-${i}`,
            })
          ).status
        );
        spy.mockRestore();
      }

      // These all happen within a second or two, so at most one guess should be checked
      expect(
        statuses.filter((status) => status === "invalid_credentials").length
      ).toBeLessThanOrEqual(1);
    }
  );
});
