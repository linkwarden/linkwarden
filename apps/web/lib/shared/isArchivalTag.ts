import { Tag } from "@prisma/client";
import { ArchivalTagOption } from "../../components/InputSelect/types";

const isArchivalTag = (tag: ArchivalTagOption | Tag) =>
  typeof tag.archiveAsScreenshot === "boolean" ||
  typeof tag.archiveAsMonolith === "boolean" ||
  typeof tag.archiveAsPDF === "boolean" ||
  typeof tag.archiveAsReadable === "boolean" ||
  typeof tag.archiveAsWaybackMachine === "boolean" ||
  typeof tag.aiTag === "boolean";

export default isArchivalTag;
