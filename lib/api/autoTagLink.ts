import { AiTaggingMethod, Collection, Link, Tag, User } from "@prisma/client";
import axios from "axios";
import { generateTagsPrompt, predefinedTagsPrompt } from "./prompts";
import { prisma } from "./db";

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

  const response = await axios.post(
    process.env.NEXT_PUBLIC_OLLAMA_ENDPOINT_URL + "/api/generate",
    {
      model: process.env.OLLAMA_MODEL,
      prompt: prompt,
      stream: false,
      keep_alive: "1m",
      format: {
        type: "object",
        properties: {
          tags: {
            type: "array",
          },
        },
        required: ["tags"],
      },
      options: {
        temperature: 0.5,
        num_predict: 100,
      },
    }
  );

  try {
    let tags: string[] = JSON.parse(response.data.response).tags;

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
