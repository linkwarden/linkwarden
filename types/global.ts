import { Collection, Link, Tag, User } from "@prisma/client";
import Stripe from "stripe";

type OptionalExcluding<T, TRequired extends keyof T> = Partial<T> &
  Pick<T, TRequired>;

export interface LinkIncludingShortenedCollectionAndTags
  extends Omit<
    Link,
    "id" | "createdAt" | "collectionId" | "updatedAt" | "lastPreserved"
  > {
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
  userId: number;
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  user: OptionalExcluding<User, "username" | "name" | "id">;
}

export interface CollectionIncludingMembersAndLinkCount
  extends Omit<Collection, "id" | "createdAt" | "ownerId" | "updatedAt"> {
  id?: number;
  ownerId?: number;
  createdAt?: string;
  _count?: { links: number };
  members: Member[];
}

export interface AccountSettings extends User {
  newPassword?: string;
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

export enum Sort {
  DateNewestFirst,
  DateOldestFirst,
  NameAZ,
  NameZA,
  DescriptionAZ,
  DescriptionZA,
}

export type LinkRequestQuery = {
  sort: Sort;
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
}

export type MigrationRequest = {
  format: MigrationFormat;
  data: string;
};

export enum MigrationFormat {
  linkwarden,
  htmlFile,
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
