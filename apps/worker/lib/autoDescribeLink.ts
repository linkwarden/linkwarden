import { User } from "@linkwarden/prisma/client";
import { prisma } from "@linkwarden/prisma";
import { generateObject } from "ai";
import { z } from "zod";
import { generateDescriptionPrompt } from "./prompts";
import { getAIModel } from "./autoTagLink"; // dont see a need to reinvent the wheel
import { JSDOM } from "jsdom";
import { Readability } from "@mozilla/readability";


export default async function autoDescribeLink(
  user: User,
  linkId: number,
  metaDescription: string | undefined
) {
  const link = await prisma.link.findUnique({
    where: { id: linkId },
  });

  if (!link) {
    console.log(`[AutoDescribe] Link ${linkId} not found.`);
    return;
  }

  // bail if...
  if (link.description) return; // has a description
  if (link.aiDescribed) return;  // processed before
  if (user.aiDescriptionMethod !== "GENERATE") return; // off in prefs

  const rawContent = link.textContent;
  let cleanContent: string | undefined = metaDescription;

  if (rawContent) {
    try {
      const doc = new JSDOM(rawContent, { url: link.url });
      const reader = new Readability(doc.window.document);
      const article = reader.parse();

      // if mozilla finds good content use else raw > solve for low powered pc taking 5+m on complex pages
      // lower powered machines likely benefit from env var BROWSER_TIMEOUT=10
      if (article && article.textContent.trim().length > (metaDescription?.length || 0)) {
        cleanContent = article.textContent;
      }
    } catch (e) {
      console.log(`[AutoDescribe] Readability failed for link ${linkId}, falling back to raw text.`);
      cleanContent = rawContent; // ...else raw text
    }
  }


  const charCount = user.aiCharacterCount || 75;
  const prompt = generateDescriptionPrompt(cleanContent.slice(0, 8000), charCount); // slice to reasonable length

  try {
    const { object: description } = await generateObject({
      model: getAIModel("description"),
      prompt: prompt,
      schema: z.string(),
    });

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
        aiDescribed: true, // Copy ai tag code > flag as processed
      },
    });
  } catch (err) {
    console.log(`[AutoDescribe] Error describing link: ${link.url}`);
    console.log("Error: ", err);
  }
}
