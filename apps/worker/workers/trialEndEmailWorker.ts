import { prisma } from "@linkwarden/prisma";
import { User } from "@linkwarden/prisma/client";
import transporter from "@linkwarden/lib/transporter";
import Handlebars from "handlebars";
import { readFileSync } from "fs";
import path from "path";

const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));

const batchSize = 10;
const pauseMs = 60000;

/**
 * Runs the "trial ended" notifier in batches.
 * - Only runs if NEXT_PUBLIC_TRIAL_PERIOD_DAYS > 1
 * - Picks users whose createdAt is older than that trial window AND trialEndEmailSent=false
 * - Skips users with an active own or parent subscription
 * - Sends email via the provided transporter
 * - Marks trialEndEmailSent=true for processed users (including those with active subs)
 * - Waits for a minute between batches
 */
export async function trialEndEmailWorker() {
  const trialDays = Number(process.env.NEXT_PUBLIC_TRIAL_PERIOD_DAYS);
  if (
    !Number.isFinite(trialDays) ||
    trialDays <= 1 ||
    !process.env.STRIPE_SECRET_KEY ||
    process.env.NEXT_PUBLIC_REQUIRE_CC === "true"
  ) {
    return;
  }

  console.log("\x1b[34m%s\x1b[0m", `Starting trial-ended email worker...`);

  const cutoff = new Date(Date.now() - trialDays * 24 * 60 * 60 * 1000);
  const from = {
    name: "Linkwarden",
    address: String(process.env.EMAIL_FROM),
  };

  while (true) {
    // 1) Pick a batch of candidates
    const candidates = await prisma.user.findMany({
      where: {
        trialEndEmailSent: false,
        createdAt: { lte: cutoff, gte: new Date("2025-09-25") }, // safety upper bound to avoid processing old users
      },
      orderBy: { createdAt: "asc" },
      take: batchSize,
      include: {
        subscriptions: { select: { active: true } }, // own subscription
        parentSubscription: { select: { active: true } }, // family/parent plan
      },
    });

    if (candidates.length === 0) {
      await sleep(pauseMs);
      continue;
    }

    const processedIds: number[] = [];
    let emailsSent = 0;

    // 2) Process the batch (send emails if no active sub)
    for (const user of candidates) {
      const hasActive =
        Boolean(user.subscriptions?.active) ||
        Boolean(user.parentSubscription?.active);

      // We’ll mark users as processed at the end of this loop iteration.
      // If sending fails, we skip marking so we retry next pass.
      if (!hasActive && user.email) {
        emailsSent++;
        try {
          const emailsDir = path.resolve(process.cwd(), "templates");

          const templateFile = readFileSync(
            path.join(emailsDir, "trialEnded.html"),
            "utf8"
          );

          const emailTemplate = Handlebars.compile(templateFile);

          await transporter.sendMail({
            from,
            to: user.email,
            subject: "Your Linkwarden trial has ended",
            html: emailTemplate({
              name: user.name?.trim() ? user.name.trim() : "there",
              url: process.env.BASE_URL,
            }),
          });
        } catch (err) {
          console.error(
            `[trial-worker] Failed to send trial-ended email to user ${user.id}`,
            err
          );
          // Do not mark as processed so it can be retried on the next batch run
          await sleep(pauseMs);
          continue;
        }
      }

      // Whether we emailed or skipped (active sub, or missing email), mark processed
      processedIds.push(user.id);
    }

    // 3) Mark processed users so we don't pick them again
    if (processedIds.length) {
      await prisma.user.updateMany({
        where: { id: { in: processedIds } },
        data: { trialEndEmailSent: true },
      });
      console.log(
        "\x1b[34m%s\x1b[0m",
        `Marked off ${processedIds.length} users' trialEndEmailSent to true. Emails sent: ${emailsSent}`
      );
    }

    // 4) Pause before the next batch
    await sleep(pauseMs);
  }
}
