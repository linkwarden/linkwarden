import { Readability } from "@mozilla/readability";
import { JSDOM } from "jsdom";
import DOMPurify from "dompurify";
import { prisma } from "../db";
import createFile from "../storage/createFile";
import { Link } from "@prisma/client";

const handleReadablility = async (
  content: string,
  link: Link,
  keepContent?: boolean
) => {
  console.log("articleText", content);

  const window = new JSDOM("").window;
  const purify = DOMPurify(window);
  const cleanedUpContent = purify.sanitize(content);
  const dom = new JSDOM(
    cleanedUpContent,
    link?.url ? { url: link.url || "" } : undefined
  );

  let article = new Readability(dom.window.document).parse();
  const articleText = article?.textContent
    .replace(/ +(?= )/g, "") // strip out multiple spaces
    .replace(/(\r\n|\n|\r)/gm, " ") // strip out line breaks
    .slice(0, 2047);

  if ((articleText && articleText !== "") || link.type === "readable") {
    if (!article) {
      article = {
        title: "",
        byline: null,
        dir: null,
        lang: null,
        content: "<p></p>",
        textContent: "",
        length: 1,
        excerpt: "",
        siteName: null,
      } as any;
    }

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
      1024 * 1024 * Number(process.env.READABILITY_MAX_BUFFER || 1)
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

export default handleReadablility;
