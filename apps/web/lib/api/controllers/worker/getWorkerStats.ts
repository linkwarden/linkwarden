import { MEILI_INDEX_VERSION } from "@linkwarden/lib/constants";
import { prisma } from "@linkwarden/prisma";
import { WorkerStats } from "@linkwarden/types";

export default async function getWorkerStats(userId: number) {
  const linkPending = await prisma.link.count({
    where: {
      url: { not: null },
      lastPreserved: null,
    },
  });

  const linkDone = await prisma.link.count({
    where: {
      lastPreserved: { not: null },
      OR: [
        { image: { not: "unavailable" } },
        { pdf: { not: "unavailable" } },
        { readable: { not: "unavailable" } },
        { monolith: { not: "unavailable" } },
      ],
    },
  });

  const linkFailed = await prisma.link.count({
    where: {
      url: { not: null },
      lastPreserved: { not: null },
      image: "unavailable",
      pdf: "unavailable",
      readable: "unavailable",
      monolith: "unavailable",
    },
  });

  const searchPending = await prisma.link.count({
    where: {
      OR: [
        { indexVersion: { not: MEILI_INDEX_VERSION } },
        { indexVersion: null },
      ],
    },
  });

  const searchDone = await prisma.link.count({
    where: {
      indexVersion: MEILI_INDEX_VERSION,
    },
  });

  const data: WorkerStats = {
    link: {
      pending: linkPending,
      done: linkDone,
      failed: linkFailed,
    },
    search: {
      pending: searchPending,
      done: searchDone,
    },
  };

  return {
    data,
    success: true,
    message: "Worker stats fetched successfully.",
    status: 200,
  };
}
