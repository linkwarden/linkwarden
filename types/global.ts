import { Collection, Link, Tag, User } from "@prisma/client";

type OptionalExcluding<T, TRequired extends keyof T> = Partial<T> &
  Pick<T, TRequired>;

export interface LinkIncludingShortenedCollectionAndTags
  extends Omit<Link, "id" | "createdAt" | "collectionId"> {
  id?: number;
  createdAt?: string;
  collectionId?: number;
  tags: Tag[];
  pinnedBy?: {
    id: number;
  }[];
  collection: OptionalExcluding<Collection, "name" | "ownerId">;
}

export interface Member {
  collectionId?: number;
  userId?: number;
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  user: OptionalExcluding<User, "username" | "name">;
}

export interface CollectionIncludingMembersAndLinkCount
  extends Omit<Collection, "id" | "createdAt" | "ownerId"> {
  id?: number;
  ownerId?: number;
  createdAt?: string;
  _count?: { links: number };
  members: Member[];
}

export interface AccountSettings extends User {
  profilePic: string;
  oldPassword?: string;
  newPassword?: string;
}

interface LinksIncludingTags extends Link {
  tags: Tag[];
}

export interface PublicCollectionIncludingLinks extends Collection {
  links: LinksIncludingTags[];
}

export enum Sort {
  DateNewestFirst,
  DateOldestFirst,
  NameAZ,
  NameZA,
  DescriptionAZ,
  DescriptionZA,
}

export type LinkSearchFilter = {
  name: boolean;
  url: boolean;
  description: boolean;
  tags: boolean;
};

export type LinkRequestQuery = {
  cursor?: number;
  collectionId?: number;
  tagId?: number;
  sort: Sort;
  searchFilter?: LinkSearchFilter;
  searchQuery?: string;
  pinnedOnly?: boolean;
};

export type PublicLinkRequestQuery = {
  cursor?: number;
  collectionId: number;
};
