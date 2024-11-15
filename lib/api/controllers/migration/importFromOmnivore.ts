import { prisma } from "@/lib/api/db";
import createFolder from "@/lib/api/storage/createFolder";
import { JSDOM } from "jsdom";
import { parse, Node, Element, TextNode } from "himalaya";
import { hasPassedLimit } from "../../verifyCapacity";

export default async function importFromOmnivore(
  userId: number,
  rawData: string
) {
  console.log("Received data:\n" + rawData);
}
