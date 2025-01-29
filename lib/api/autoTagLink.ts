import { AiTaggingMethod, User } from "@prisma/client";
import { generateTagsPrompt, predefinedTagsPrompt } from "./prompts";
import { prisma } from "./db";
import { generateObject } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";
import { anthropic } from "@ai-sdk/anthropic";
import { createOllama } from "ollama-ai-provider";

const getAIModel = () => {
  if (process.env.OPENAI_API_KEY && process.env.OPENAI_MODEL) return openai(process.env.OPENAI_MODEL);
  if (process.env.ANTHROPIC_API_KEY && process.env.ANTHROPIC_MODEL) return anthropic(process.env.ANTHROPIC_MODEL);
  if (process.env.NEXT_PUBLIC_OLLAMA_ENDPOINT_URL && process.env.OLLAMA_MODEL) {
    const ollama = createOllama({
      baseURL: process.env.NEXT_PUBLIC_OLLAMA_ENDPOINT_URL,
    });

    return ollama(process.env.OLLAMA_MODEL)
  }

  throw new Error("No AI provider configured");
}

export default async function autoTagLink(user: User, linkId: number) {
  const link = await prisma.link.findUnique({
    where: { id: linkId },
  });

  if (!link) return console.log("Link not found for auto tagging.");

  console.log("Auto tagging link: ", link.url);

  let prompt;

  const textContent = link.textContent?.slice(0, 500) + "...";

  if (!link.textContent)
    return console.log("No text content to auto tag for link: ", link.url);

  if (user.aiTaggingMethod === AiTaggingMethod.GENERATE) {
    prompt = generateTagsPrompt(textContent);
  } else {
    prompt = predefinedTagsPrompt(textContent, user.aiPredefinedTags);
  }

  if (
    user.aiTaggingMethod === AiTaggingMethod.PREDEFINED &&
    user.aiPredefinedTags.length === 0
  ) {
    return console.log("No predefined tags to auto tag for link: ", link.url);
  }

  const { object } = await generateObject({
    model: getAIModel(),
    prompt: prompt,
    output: 'array',
    schema: z.string()
  })

  try {
    let tags: string[] = object || [];

    console.log("Tags generated for link: ", link.url, tags);

    if (!tags || tags.length === 0) {
      return;
    } else if (user.aiTaggingMethod === AiTaggingMethod.PREDEFINED) {
      tags = tags.filter((tag: string) => user.aiPredefinedTags.includes(tag));
    }

    if (tags.length > 5) {
      tags = tags.slice(0, 5);
    }

    await prisma.link.update({
      where: { id: linkId },
      data: {
        tags: {
          connectOrCreate: tags.map((tag: string) => ({
            where: {
              name_ownerId: {
                name: tag.trim().slice(0, 100),
                ownerId: user.id,
              },
            },
            create: {
              name: tag.trim().slice(0, 100),
              owner: {
                connect: {
                  id: user.id,
                },
              },
            },
          })),
        },
        aiTagged: true,
      },
    });

    console.log("Link auto tagged successfully.");
  } catch (err) {
    console.log("Error auto tagging link: ", link.url);
    console.log("Error: ", err);
  }
}
