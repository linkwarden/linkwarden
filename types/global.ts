import { Link, Tag } from "@prisma/client";

export interface LinkAndTags extends Link {
  tags: Tag[];
}

export interface NewLink {
  name: string;
  url: string;
  tags: string[];
  collectionId: {
    id: string | number;
    isNew?: boolean;
  };
}
