import { Collection, Link, Tag } from "@prisma/client";

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
