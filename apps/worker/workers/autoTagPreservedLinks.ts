import { delay } from "@linkwarden/lib/utils";
import { prisma } from "@linkwarden/prisma";
import { LinkWithCollectionOwnerAndTags } from "@linkwarden/types/global";
import autoTagLink from "../lib/autoTagLink";
import getLinkBatchFairly from "../lib/getLinkBatchFairly";

const AUTO_TAG_TAKE_COUNT = Number(process.env.ARCHIVE_TAKE_COUNT || "") || 5;

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

  console.log("\x1b[34m%s\x1b[0m", "Starting preserved link auto-tagging...");

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

          await autoTagLink(link.collection.owner, link.id);

          console.log(
            "\x1b[34m%s\x1b[0m",
            `Succeeded auto-tagging link ${link.url} for user ${link.collection.ownerId}.`
          );
        } catch (error: any) {
          console.error(
            "\x1b[34m%s\x1b[0m",
            `Error auto-tagging link ${link.url} for user ${link.collection.ownerId}:`,
            error
          );
        } finally {
          await prisma.link
            .update({
              where: { id: link.id },
              data: { aiTagged: true },
            })
            .catch((error) => {
              console.error(
                "\x1b[34m%s\x1b[0m",
                `Error marking link ${link.id} as auto-tagged:`,
                error
              );
            });
        }
      }
    );

    await Promise.allSettled(autoTagPromises);
    await delay(interval);
  }
}
