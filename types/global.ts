// Copyright (C) 2022-present Daniel31x13 <daniel31x13@gmail.com>
// This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, version 3.
// This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
// You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.

import { Collection, Link, Tag, User } from "@prisma/client";

type OptionalExcluding<T, TRequired extends keyof T> = Partial<T> &
  Pick<T, TRequired>;

export interface ExtendedLink extends Link {
  tags: Tag[];
  collection: Collection;
}

export interface NewLink {
  name: string;
  url: string;
  tags: Tag[];
  collection: {
    id: number | undefined;
    name: string | undefined;
    ownerId: number | undefined;
  };
}

export interface NewCollection {
  name: string;
  description: string;
  members: {
    name: string;
    email: string;
    canCreate: boolean;
    canUpdate: boolean;
    canDelete: boolean;
  }[];
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
  createdAt?: Date;
  members: Member[];
}

export type SearchSettings = {
  query: string;
  filter: {
    name: boolean;
    url: boolean;
    title: boolean;
    collection: boolean;
    tags: boolean;
  };
};

export interface AccountSettings extends User {
  profilePic: string | null;
  oldPassword?: string;
  newPassword?: string;
}
