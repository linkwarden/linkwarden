import { Tag } from "@linkwarden/prisma/client";

export const isArchivalTag = (tag: any | Tag) =>
  typeof tag.archiveAsScreenshot === "boolean" ||
  typeof tag.archiveAsMonolith === "boolean" ||
  typeof tag.archiveAsPDF === "boolean" ||
  typeof tag.archiveAsReadable === "boolean" ||
  typeof tag.archiveAsWaybackMachine === "boolean" ||
  typeof tag.aiTag === "boolean";
