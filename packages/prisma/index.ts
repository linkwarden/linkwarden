import { PrismaClient } from "@prisma/client";

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log:
      process.env.DEBUG === "true"
        ? ["query", "info", "warn", "error"]
        : ["warn", "error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

// For benchmarking | uncomment when needed
// if (process.env.NODE_ENV !== "production")
//   prisma.$on("query" as any, (e: any) => {
//     console.log("Query: " + e.query);
//     console.log("Params: " + e.params);
//     console.log("\x1b[31m", `Duration: ${e.duration}ms`, "\x1b[0m");
//   });
