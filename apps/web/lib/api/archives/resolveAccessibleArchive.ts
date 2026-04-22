import { prisma } from "@linkwarden/prisma";
import { ArchivedFormat } from "@linkwarden/types/global";
import getSuffixFromFormat from "@/lib/shared/getSuffixFromFormat";

type ResolveAccessibleArchiveParams = {
  linkId: number;
  format: number;
  isPreview?: boolean;
  userId?: number;
};

type ResolveAccessibleArchiveSuccess = {
  filePath: string;
  collectionId: number;
  linkId: number;
  format: ArchivedFormat;
  isPreview: boolean;
};

type ResolveAccessibleArchiveResult =
  | {
      status: 200;
      response: ResolveAccessibleArchiveSuccess;
    }
  | {
      status: 401;
      response: string;
    };

async function getAccessibleCollection(linkId: number, userId?: number) {
  return prisma.collection.findFirst({
    where: {
      links: {
        some: {
          id: linkId,
        },
      },
      OR: [
        { ownerId: userId || -1 },
        { members: { some: { userId: userId || -1 } } },
        { isPublic: true },
      ],
    },
  });
}

export default async function resolveAccessibleArchive({
  linkId,
  format,
  isPreview = false,
  userId,
}: ResolveAccessibleArchiveParams): Promise<ResolveAccessibleArchiveResult> {
  const suffix = getSuffixFromFormat(format);

  if (!linkId || !suffix) {
    return {
      status: 401,
      response: "Invalid parameters.",
    };
  }

  const collection = await getAccessibleCollection(linkId, userId);
  if (!collection) {
    return {
      status: 401,
      response: "You don't have access to this collection.",
    };
  }

  const filePath = isPreview
    ? `archives/preview/${collection.id}/${linkId}.jpeg`
    : `archives/${collection.id}/${linkId + suffix}`;

  return {
    status: 200,
    response: {
      filePath,
      collectionId: collection.id,
      linkId,
      format: format as ArchivedFormat,
      isPreview,
    },
  };
}
