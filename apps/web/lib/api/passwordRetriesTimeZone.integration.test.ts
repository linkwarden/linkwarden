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

// Self-hosted databases often run in the server's local time zone. Attempt
// times are compared with the app's clock, so they have to read back the same
// whatever the database's TimeZone setting is.

const TIME_ZONE = "Pacific/Kiritimati"; // UTC+14
const PASSWORD = "Corr3ct-horse";

let prisma: typeof import("@linkwarden/prisma").prisma;
let verifyByCredentials: typeof import("./verifyByCredentials").default;

const createdIds: number[] = [];

describe.skipIf(!process.env.DATABASE_URL)(
  "password retries with a database in another time zone",
  () => {
    beforeAll(async () => {
      // Read when @linkwarden/prisma loads
      const url = process.env.DATABASE_URL!;
      vi.stubEnv(
        "DATABASE_URL",
        `${url}${url.includes("?") ? "&" : "?"}options=${encodeURIComponent(
          `-c TimeZone=${TIME_ZONE}`
        )}`
      );

      prisma = (await import("@linkwarden/prisma")).prisma;
      verifyByCredentials = (await import("./verifyByCredentials")).default;
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    afterAll(async () => {
      if (!prisma) return;

      await prisma.user.deleteMany({ where: { id: { in: createdIds } } });
      await prisma.$disconnect();
      vi.unstubAllEnvs();
    });

    it("waits 25 seconds after the last attempt, not 25 seconds plus the offset", async () => {
      const [{ timezone }] = await prisma.$queryRaw<
        { timezone: string }[]
      >`SELECT current_setting('TimeZone') AS timezone`;
      expect(timezone).toBe(TIME_ZONE);

      const username = `timezone-${Date.now().toString(36)}${Math.random()
        .toString(36)
        .slice(2, 7)}`;
      const user = await prisma.user.create({
        data: { username, password: bcrypt.hashSync(PASSWORD, 4) },
      });
      createdIds.push(user.id);

      for (let i = 0; i < 15; i++)
        expect(
          (await verifyByCredentials({ username, password: `wrong-${i}` }))
            .status
        ).toBe("invalid_credentials");

      const { passwordRetryAt } = await prisma.user.findUniqueOrThrow({
        where: { id: user.id },
        select: { passwordRetryAt: true },
      });
      expect(Math.abs(Date.now() - passwordRetryAt!.getTime())).toBeLessThan(
        10_000
      );

      expect(
        await verifyByCredentials({ username, password: PASSWORD })
      ).toMatchObject({ status: "too_many_attempts", retryAfter: 25 });

      // 26 seconds later by the app's clock
      const later = Date.now() + 26_000;
      vi.spyOn(Date, "now").mockReturnValue(later);
      expect(
        (await verifyByCredentials({ username, password: PASSWORD })).status
      ).toBe("success");
    });
  }
);
