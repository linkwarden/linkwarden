import formidable from "formidable";
import { NextApiRequest } from "next";
import fs from "fs";

export default async function parseSharedLink(req: NextApiRequest): Promise<
  | {
      title: string;
      link: string;
      error: null;
    }
  | {
      title: null;
      link: null;
      error: Error;
    }
> {
  const form = formidable({});
  let fields;
  let files;
  try {
    [fields, files] = await form.parse(req);
  } catch (err) {
    return {
      title: null,
      link: null,
      error: err as Error,
    };
  }
  // read content of the title file
  let title = "",
    link = "";
  if (files.title) title = fs.readFileSync(files.title[0].filepath, "utf-8");
  if (files.text) link = fs.readFileSync(files.text[0].filepath, "utf-8");
  return {
    title,
    link,
    error: null,
  };
}
