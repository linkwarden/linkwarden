import { Collection, Link, Tag, User } from "@prisma/client";
import Stripe from "stripe";

type OptionalExcluding<T, TRequired extends keyof T> = Partial<T> &
  Pick<T, TRequired>;

export interface LinkIncludingShortenedCollectionAndTags
  extends Omit<
    Link,
    | "id"
    | "createdAt"
    | "collectionId"
    | "updatedAt"
    | "lastPreserved"
    | "importDate"
  > {
  id?: number;
  createdAt?: string;
  importDate?: string;
  collectionId?: number;
  tags: Tag[];
  pinnedBy?: {
    id: number;
  }[];
  updatedAt?: string;
  collection: OptionalExcluding<Collection, "name" | "ownerId">;
}

export interface Member {
  collectionId?: number;
  userId: number;
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  user: OptionalExcluding<User, "email" | "username" | "name" | "id">;
}

export interface CollectionIncludingMembersAndLinkCount
  extends Omit<Collection, "id" | "createdAt" | "ownerId" | "updatedAt"> {
  id?: number;
  ownerId?: number;
  createdAt?: string;
  updatedAt?: string;
  _count?: { links: number };
  members: Member[];
}

export interface TagIncludingLinkCount extends Tag {
  _count?: { links: number };
}

export interface AccountSettings extends User {
  newPassword?: string;
  oldPassword?: string;
  whitelistedUsers: string[];
  subscription?: {
    active?: boolean;
  };
}

interface LinksIncludingTags extends Link {
  tags: Tag[];
}

export interface PublicCollectionIncludingLinks extends Collection {
  links: LinksIncludingTags[];
}

export enum ViewMode {
  Card = "card",
  List = "list",
  Masonry = "masonry",
}

export enum Sort {
  DateNewestFirst,
  DateOldestFirst,
  NameAZ,
  NameZA,
  DescriptionAZ,
  DescriptionZA,
}

export type Order = { [key: string]: "asc" | "desc" };

export type LinkRequestQuery = {
  sort?: Sort;
  cursor?: number;
  collectionId?: number;
  tagId?: number;
  pinnedOnly?: boolean;
  searchQueryString?: string;
  searchByName?: boolean;
  searchByUrl?: boolean;
  searchByDescription?: boolean;
  searchByTextContent?: boolean;
  searchByTags?: boolean;
};

export type PublicLinkRequestQuery = {
  cursor?: number;
  collectionId: number;
};

interface CollectionIncludingLinks extends Collection {
  links: LinksIncludingTags[];
}

export interface Backup extends Omit<User, "password" | "id"> {
  collections: CollectionIncludingLinks[];
  pinnedLinks: LinksIncludingTags[];
}

export type MigrationRequest = {
  format: MigrationFormat;
  data: string;
};

export enum MigrationFormat {
  linkwarden,
  htmlFile,
  wallabag,
  omnivore,
}

export enum Plan {
  monthly,
  yearly,
}

export type DeleteUserBody = {
  password: string;
  cancellation_details?: {
    comment?: string;
    feedback?: Stripe.SubscriptionCancelParams.CancellationDetails.Feedback;
  };
};

export enum ArchivedFormat {
  png,
  jpeg,
  pdf,
  readability,
  monolith,
}

export enum LinkType {
  url,
  pdf,
  image,
  monolith,
}

export enum TokenExpiry {
  sevenDays,
  oneMonth,
  twoMonths,
  threeMonths,
  never,
}
