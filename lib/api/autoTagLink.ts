import { AiTaggingMethod, Collection, Link, Tag, User } from "@prisma/client";
import axios from "axios";
import { generateTagsPrompt } from "./prompts";

export default async function autoTagLink(
  user: User,
  link: Link & {
    collection: Collection;
    tags: Tag[];
  },
  fallbackText: string
) {
  console.log("Auto tagging link: ", link.url);

  let prompt;

  const textContent = link.textContent || fallbackText || "";

  if (!textContent)
    return console.log("No text content to auto tag for link: ", link.url);

  if (user.aiTaggingMethod === AiTaggingMethod.GENERATE) {
    prompt = generateTagsPrompt();
  } else {
  }

  // use axios to make a request to OLLAMA API
  const response = await axios.post("http://localhost:11434/api/generate", {
    model: "phi3.5",
    prompt: prompt,
    stream: false,
  });

  console.log("Response from OLLAMA API: ", response.data);
}
