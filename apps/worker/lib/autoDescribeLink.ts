import { performance } from "perf_hooks";
import { User } from "@linkwarden/prisma/client";
import { prisma } from "@linkwarden/prisma";
import { generateObject } from "ai";
import { z } from "zod";
import { generateDescriptionPrompt } from "./prompts";
import { getAIModel } from "./autoTagLink"; // dont see a need to reinvent the wheel
import { JSDOM } from "jsdom";
import { Readability } from "@mozilla/readability";
import { formatDuration } from "../../web/lib/utils";

export default async function autoDescribeLink(
  user: User,
  linkId: number,
  metaDescription: string | undefined
) {
  const link = await prisma.link.findUnique({
    where: { id: linkId },
  });

  if (!link || !link.url) {
    console.log(`[AutoDescribe] Link ${linkId} not found or has no URL.`);
    return;
  }

  // bail if...
  if (link.description) return; // has a description
  if (link.aiDescribed) return;  // processed before
  if (user.aiDescriptionMethod === "DISABLED") return; // off in prefs

  const rawContent = link.textContent;
  let cleanContent: string | undefined = metaDescription;

  if (!rawContent) return;

  let contentToProcess = "";
  // User selects how many first chars to summarize > fallback to db default (3000)
  // lower powered machines likely benefit from env var BROWSER_TIMEOUT=10 if using raw
  let sliceLimit = user.aiAnalyzeFirstChars || 3000;

  if (user.aiDescriptionMethod === "GENERATE_FAST") {
    try {
      const doc = new JSDOM(rawContent, { url: link.url });
      const reader = new Readability(doc.window.document);
      const article = reader.parse();
      
      if (article && article.textContent) {
        contentToProcess = article.textContent;
      } else {
        contentToProcess = rawContent;
      }    
    } catch (e) {
      console.log(`[AutoDescribe] Readability failed for link ${linkId}, falling back to raw text.`);
      contentToProcess = rawContent; // ...else raw text
    }
  } else { // setting GENERATE_FULL
    contentToProcess = rawContent;
    sliceLimit = 25000;
  }


  const charCount = user.aiCharacterCount || 75;
  const prompt = generateDescriptionPrompt(contentToProcess.slice(0, sliceLimit), charCount); // slice to set length

  try {
    const { model, modelName } = getAIModel("description");
    const startTime = performance.now();

    const result = await generateObject({
      model: model,
      prompt: prompt,
      schema: z.string(),
    });

    const endTime = performance.now();

    if (process.env.AI_STATS === "true") {
      const durationInMs = endTime - startTime;
      const durationInNano = durationInMs * 1_000_000;
      const formattedTime = formatDuration(durationInNano);
      // Use the dynamic modelName in the log
      console.log(
        `[AI Info] ${modelName} took ${formattedTime} to process the link for the description.`
      );
    }

    const description = result.object;

    if (!description || description.trim().length === 0) {
      console.log(`[AutoDescribe] AI returned an empty description for link: ${link.url}`);
      return;
    }

    const finalDescription = description.trim().substring(0, charCount);

    console.log(`[AutoDescribe] Description for link: ${link.url} => "${finalDescription}"`);

    // all good > update db
    await prisma.link.update({
      where: { id: linkId },
      data: {
        description: finalDescription,
        aiDescribed: true, // Mirror ai tag logic > flag as processed
      },
    });
  } catch (err) {
    console.log(`[AutoDescribe] Error describing link: ${link.url}`);
    console.log("Error: ", err);
  }
}
