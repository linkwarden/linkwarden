import { Readability } from "@mozilla/readability";
import { JSDOM } from "jsdom";
import DOMPurify from "dompurify";
import { prisma } from "@linkwarden/prisma";
import { createFile } from "@linkwarden/filesystem";
import { Link } from "@linkwarden/prisma/client";

const handleReadability = async (
  content: string,
  link: Link,
  keepContent?: boolean
) => {
  const TEXT_CONTENT_LIMIT = Number(process.env.TEXT_CONTENT_LIMIT);

  const window = new JSDOM("").window;
  const purify = DOMPurify(window);
  const cleanedUpContent = purify.sanitize(content);
  const dom = new JSDOM(cleanedUpContent, { url: link.url || "" });

  const article = new Readability(dom.window.document).parse();
  const articleText = article?.textContent
    ?.replace(/ +(?= )/g, "") // strip out multiple spaces
    .replace(/(\r\n|\n|\r)/gm, " ") // strip out line breaks
    .slice(0, TEXT_CONTENT_LIMIT ? TEXT_CONTENT_LIMIT : undefined); // limit characters if TEXT_CONTENT_LIMIT is defined

  if (articleText && articleText !== "") {
    const collectionId = (
      await prisma.link.findUnique({
        where: { id: link.id },
        select: { collectionId: true },
      })
    )?.collectionId;

    if (article && keepContent) {
      article.content = cleanedUpContent;
    }

    const data = JSON.stringify(article);

    if (
      Buffer.byteLength(data, "utf8") >
      1024 * 1024 * Number(process.env.READABILITY_MAX_BUFFER || 100)
    )
      return console.error(
        "Error archiving as Readability: Buffer size exceeded"
      );

    await createFile({
      data,
      filePath: `archives/${collectionId}/${link.id}_readability.json`,
    });

    await prisma.link.update({
      where: { id: link.id },
      data: {
        readable: `archives/${collectionId}/${link.id}_readability.json`,
        textContent: articleText,
      },
    });
  }
};

export default handleReadability;
