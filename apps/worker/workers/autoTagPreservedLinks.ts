import { delay } from "@linkwarden/lib/utils";
import { prisma } from "@linkwarden/prisma";
import { LinkWithCollectionOwnerAndTags } from "@linkwarden/types/global";
import autoTagLink from "../lib/autoTagLink";
import getLinkBatchFairly from "../lib/getLinkBatchFairly";

const AUTO_TAG_TAKE_COUNT = Number(process.env.ARCHIVE_TAKE_COUNT || "") || 5;

// A link that keeps failing would otherwise be picked again on every round and
// starve the batch, so we give up on it after this many tries.
const MAX_AUTO_TAG_ATTEMPTS = 3;

const failedAttempts = new Map<number, number>();

const markAsTagged = (linkId: number) =>
  prisma.link
    .update({
      where: { id: linkId },
      data: { aiTagged: true },
    })
    .catch((error) => {
      console.error(
        "\x1b[34m%s\x1b[0m",
        `Error marking link ${linkId} as auto-tagged:`,
        error
      );
    });

const hasAiTaggingProvider = () =>
  Boolean(
    process.env.NEXT_PUBLIC_OLLAMA_ENDPOINT_URL ||
      process.env.OPENAI_API_KEY ||
      process.env.AZURE_API_KEY ||
      process.env.ANTHROPIC_API_KEY ||
      process.env.OPENROUTER_API_KEY ||
      process.env.PERPLEXITY_API_KEY
  );

export async function autoTagPreservedLinks(interval = 10) {
  if (!hasAiTaggingProvider()) return;

  console.log("\x1b[34m%s\x1b[0m", "Starting link auto-tagging...");

  while (true) {
    const links = await getLinkBatchFairly({
      maxBatchLinks: AUTO_TAG_TAKE_COUNT,
      mode: "tags",
    });

    if (links.length === 0) {
      await delay(interval);
      continue;
    }

    const autoTagPromises = links.map(
      async (link: LinkWithCollectionOwnerAndTags) => {
        try {
          console.log(
            "\x1b[34m%s\x1b[0m",
            `Auto-tagging link ${link.url} for user ${link.collection.ownerId}.`
          );

          const result = await autoTagLink(link.collection.owner, link.id);

          // Nothing to tag, so mark it as done to keep it out of the next batch.
          if (result === "skipped") await markAsTagged(link.id);

          failedAttempts.delete(link.id);

          console.log(
            "\x1b[34m%s\x1b[0m",
            `${
              result === "skipped" ? "Skipped" : "Succeeded"
            } auto-tagging link ${link.url} for user ${link.collection.ownerId}.`
          );
        } catch (error: any) {
          const attempts = (failedAttempts.get(link.id) ?? 0) + 1;
          failedAttempts.set(link.id, attempts);

          console.error(
            "\x1b[34m%s\x1b[0m",
            `Error auto-tagging link ${link.url} for user ${link.collection.ownerId} (attempt ${attempts} of ${MAX_AUTO_TAG_ATTEMPTS}):`,
            error
          );

          if (attempts >= MAX_AUTO_TAG_ATTEMPTS) {
            console.error(
              "\x1b[34m%s\x1b[0m",
              `Giving up on link ${link.id} after ${attempts} failed attempts, marking it as auto-tagged.`
            );

            failedAttempts.delete(link.id);
            await markAsTagged(link.id);
          }
        }
      }
    );

    await Promise.allSettled(autoTagPromises);
    await delay(interval);
  }
}
