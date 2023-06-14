import { Collection, Link, Tag, User } from "@prisma/client";

type OptionalExcluding<T, TRequired extends keyof T> = Partial<T> &
  Pick<T, TRequired>;

export interface LinkIncludingCollectionAndTags
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
  user: OptionalExcluding<User, "email" | "name">;
}

export interface CollectionIncludingMembers
  extends Omit<Collection, "id" | "createdAt"> {
  id?: number;
  createdAt?: string;
  members: Member[];
}

export interface AccountSettings extends User {
  profilePic: string;
  oldPassword?: string;
  newPassword?: string;
}

export interface PublicCollectionIncludingLinks
  extends Omit<Collection, "ownerId"> {
  ownerName?: string;
  links: Link[];
}

export enum Sort {
  NameAZ,
  NameZA,
  DescriptionAZ,
  DescriptionZA,
  DateNewestFirst,
  DateOldestFirst,
}
