import { AiTaggingMethod, User } from "@prisma/client";
import {
  existingTagsPrompt,
  generateTagsPrompt,
  predefinedTagsPrompt,
} from "./prompts";
import { prisma } from "./db";
import { generateObject } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";
import { anthropic } from "@ai-sdk/anthropic";
import { createOllama } from "ollama-ai-provider";

// Function to concat /api with the base URL properly
const ensureValidURL = (base: string, path: string) =>
  `${base.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;

const getAIModel = () => {
  if (process.env.OPENAI_API_KEY && process.env.OPENAI_MODEL)
    return openai(process.env.OPENAI_MODEL);
  if (process.env.ANTHROPIC_API_KEY && process.env.ANTHROPIC_MODEL)
    return anthropic(process.env.ANTHROPIC_MODEL);
  if (process.env.NEXT_PUBLIC_OLLAMA_ENDPOINT_URL && process.env.OLLAMA_MODEL) {
    const ollama = createOllama({
      baseURL: ensureValidURL(
        process.env.NEXT_PUBLIC_OLLAMA_ENDPOINT_URL,
        "api"
      ),
    });

    return ollama(process.env.OLLAMA_MODEL, {
      structuredOutputs: true,
    });
  }

  throw new Error("No AI provider configured");
};

export default async function autoTagLink(
  user: User,
  linkId: number,
  metaDescription: string | undefined
) {
  const link = await prisma.link.findUnique({
    where: { id: linkId },
  });

  if (!link) return console.log("Link not found for auto tagging.");

  const existingTags = await prisma.tag.findMany({
    select: {
      name: true,
    },
    where: {
      ownerId: user.id,
    },
  });

  console.log("Auto tagging link: ", link.url);

  let prompt;

  let existingTagsNames: string[] = [];

  if (user.aiTaggingMethod === AiTaggingMethod.EXISTING) {
    const existingTags = await prisma.tag.findMany({
      select: {
        name: true,
        _count: {
          select: { links: true },
        },
      },
      where: {
        ownerId: user.id,
      },
      orderBy: {
        links: {
          _count: "desc",
        },
      },
      take: 50,
    });

    existingTagsNames = existingTags.map((tag) =>
      tag.name.length > 50 ? tag.name.slice(0, 47) + "..." : tag.name
    );
  }

  const promptText = metaDescription || link.textContent?.slice(0, 500) + "...";

  if (!promptText)
    return console.log("No text content to auto tag for link: ", link.url);

  if (user.aiTaggingMethod === AiTaggingMethod.GENERATE) {
    prompt = generateTagsPrompt(promptText);
  } else if (user.aiTaggingMethod === AiTaggingMethod.EXISTING) {
    prompt = existingTagsPrompt(promptText, existingTagsNames);
  } else {
    prompt = predefinedTagsPrompt(promptText, user.aiPredefinedTags);
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
    output: "array",
    schema: z.string(),
  });

  try {
    let tags = object;

    console.log("Tags generated for link: ", link.url, tags);

    if (!tags || tags.length === 0) {
      return;
    } else if (user.aiTaggingMethod === AiTaggingMethod.EXISTING) {
      tags = tags.filter((tag: string) => existingTagsNames.includes(tag));
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
