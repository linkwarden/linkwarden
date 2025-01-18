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
  DateNewestFirst = 0,
  DateOldestFirst = 1,
  NameAZ = 2,
  NameZA = 3,
  DescriptionAZ = 4,
  DescriptionZA = 5,
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
  linkwarden = 0,
  htmlFile = 1,
  wallabag = 2,
  omnivore = 3,
}

export enum Plan {
  monthly = 0,
  yearly = 1,
}

export type DeleteUserBody = {
  password: string;
  cancellation_details?: {
    comment?: string;
    feedback?: Stripe.SubscriptionCancelParams.CancellationDetails.Feedback;
  };
};

export enum ArchivedFormat {
  png = 0,
  jpeg = 1,
  pdf = 2,
  readability = 3,
  monolith = 4,
}

export enum LinkType {
  url = 0,
  pdf = 1,
  image = 2,
  monolith = 3,
}

export enum TokenExpiry {
  sevenDays = 0,
  oneMonth = 1,
  twoMonths = 2,
  threeMonths = 3,
  never = 4,
}
