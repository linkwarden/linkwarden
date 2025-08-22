import { Job } from 'bullmq';
import { prisma } from '@linkwarden/prisma';
import { logger } from '../lib/logger';
import { autodescriptionQueue } from '../queues';

interface BulkDescribeJobData {
  userId: number;
}

export default async function (job: Job<BulkDescribeJobData>) {
  const { userId } = job.data;
  logger.info(`[BulkDescribe] Starting bulk description job for user ${userId}.`);

  // Find all links for cur user needing a description
  const linksToProcess = await prisma.link.findMany({
    where: {
      createdBy: {
        id: userId,
      },
      description: {
        equals: '', // User has not manually set descript
      },
      aiDescribed: false,
    },
    select: {
      id: true,
    },
  });

  if (linksToProcess.length === 0) {
    logger.info(`[BulkDescribe] No links found to process for user ${userId}.`);
  } else {
    logger.info(`[BulkDescribe] Found ${linksToProcess.length} links. Adding to the queue...`);
    // Add each link to queue
    for (const link of linksToProcess) {
      await autodescriptionQueue.add('autodescription', { linkId: link.id });
    }
  }

  // Reset user setting to false preventing from running again
  await prisma.user.update({
    where: { id: userId },
    data: { aiDescribeExistingLinks: false },
  });

  logger.info(`[BulkDescribe] Bulk job complete for user ${userId}.`);
}
