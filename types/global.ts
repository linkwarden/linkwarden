import { Collection, Link, Tag } from "@prisma/client";

export interface ExtendedLink extends Link {
  tags: Tag[];
  collection: Collection;
}

export interface NewLink {
  name: string;
  url: string;
  tags: string[];
  collection: {
    id: string | number;
    isNew?: boolean;
  };
}
