import { AiTaggingMethod, User } from "@linkwarden/prisma/client";
import {
  existingTagsPrompt,
  generateTagsPrompt,
  predefinedTagsPrompt,
} from "./prompts";
import { prisma } from "@linkwarden/prisma";
import { generateObject, LanguageModelV1 } from "ai";
import {
  createOpenAICompatible,
  OpenAICompatibleProviderSettings,
} from "@ai-sdk/openai-compatible";
import { azure } from "@ai-sdk/azure";
import { z } from "zod";
import { anthropic } from "@ai-sdk/anthropic";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { createOllama } from "ollama-ai-provider";
import { titleCase } from "@linkwarden/lib";

// Function to concat /api with the base URL properly
const ensureValidURL = (base: string, path: string) =>
  `${base.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;

export const getAIModel = (
  modelType: "tagging" | "description"
): LanguageModelV1 => {
  // OpenAI, Azure, etc. untouched
  if (process.env.OPENAI_API_KEY && process.env.OPENAI_MODEL) {
    let config: OpenAICompatibleProviderSettings = {
      baseURL:
        process.env.CUSTOM_OPENAI_BASE_URL || "https://api.openai.com/v1",
      name: process.env.CUSTOM_OPENAI_NAME || "openai",
      apiKey: process.env.OPENAI_API_KEY,
    };
    const openaiCompatibleModel = createOpenAICompatible(config);
    return openaiCompatibleModel(process.env.OPENAI_MODEL);
  }
  if (
    process.env.AZURE_API_KEY &&
    process.env.AZURE_RESOURCE_NAME &&
    process.env.AZURE_MODEL
  )
    return azure(process.env.AZURE_MODEL);
  if (process.env.ANTHROPIC_API_KEY && process.env.ANTHROPIC_MODEL)
    return anthropic(process.env.ANTHROPIC_MODEL);

  // User controlled timeout and increased timeout by default for batch description processing
  if (process.env.NEXT_PUBLIC_OLLAMA_ENDPOINT_URL && process.env.OLLAMA_MODEL) {
    const browserTimeout = Number(process.env.BROWSER_TIMEOUT) || 0;

    const getTimeout = () => {
      // fixed timeout for tagging
      if (modelType === "tagging") {
        return 3 * 60 * 1000; // more than enough
      }
      
      // console descriptions: batch can be slow esp on slower hardware
      const defaultDescriptionTimeout = 15;
      const finalTimeout = Math.max(defaultDescriptionTimeout, browserTimeout);

      if (browserTimeout > 0 && browserTimeout > defaultDescriptionTimeout) {
        // process single link user configured
        console.log(
          `[AI Config] Processing description. Timeout increased to user-defined ${finalTimeout} minutes.`
        );
      } else {
        // process batch or single default timeout
        console.log(
          `[AI Config] Processing description. Using default ${finalTimeout} minute timeout.`
        );
      }
      return finalTimeout * 60 * 1000;
    };

    const modelToUse =
      modelType === "description" && process.env.OLLAMA_DESCRIPTION_MODEL
        ? process.env.OLLAMA_DESCRIPTION_MODEL
        : process.env.OLLAMA_MODEL;

    const ollama = createOllama({
      baseURL: ensureValidURL(
        process.env.NEXT_PUBLIC_OLLAMA_ENDPOINT_URL,
        "api"
      ),
      fetchOptions: {
        timeout: getTimeout(),
      },
    });
    return ollama(modelToUse, {
      structuredOutputs: true,
    });
  }

  // OpenRouter untouched
  if (process.env.OPENROUTER_API_KEY && process.env.OPENROUTER_MODEL) {
    const openrouter = createOpenRouter({
      apiKey: process.env.OPENROUTER_API_KEY,
    });
    return openrouter(process.env.OPENROUTER_MODEL) as LanguageModelV1;
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

  const description =
    metaDescription ||
    (link.textContent ? link.textContent?.slice(0, 500) + "..." : undefined);

  if (!description) return;

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

  if (user.aiTaggingMethod === AiTaggingMethod.GENERATE) {
    prompt = generateTagsPrompt(description);
  } else if (user.aiTaggingMethod === AiTaggingMethod.EXISTING) {
    prompt = existingTagsPrompt(description, existingTagsNames);
  } else {
    prompt = predefinedTagsPrompt(description, user.aiPredefinedTags);
  }

  if (
    user.aiTaggingMethod === AiTaggingMethod.PREDEFINED &&
    user.aiPredefinedTags.length === 0
  ) {
    return console.log("No predefined tags to auto tag for link: ", link.url);
  }

  const { object } = await generateObject({
    model: getAIModel("tagging"),
    prompt: prompt,
    output: "array",
    schema: z.string(),
  });

  try {
    let tags = object;

    if (!tags || tags.length === 0) {
      return;
    } else if (user.aiTaggingMethod === AiTaggingMethod.EXISTING) {
      tags = tags.filter((tag: string) => existingTagsNames.includes(tag));
    } else if (user.aiTaggingMethod === AiTaggingMethod.PREDEFINED) {
      tags = tags.filter((tag: string) => user.aiPredefinedTags.includes(tag));
    } else if (user.aiTaggingMethod === AiTaggingMethod.GENERATE) {
      tags = tags.map((tag: string) =>
        tag.length > 3 ? titleCase(tag.toLowerCase()) : tag
      );
    }

    console.log("Tags for link:", link.url, "=>", tags);

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
                name: tag.trim().slice(0, 50),
                ownerId: user.id,
              },
            },
            create: {
              name: tag.trim().slice(0, 50),
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
  } catch (err) {
    console.log("Error auto tagging link: ", link.url);
    console.log("Error: ", err);
  }
}
