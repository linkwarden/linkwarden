export enum Sort {
  DateNewestFirst,
  DateOldestFirst,
  NameAZ,
  NameZA,
  DescriptionAZ,
  DescriptionZA,
}

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

export type LinkIncludingShortenedCollectionAndTags = {
  id: number;
  name: string;
  url: string;
  description: string;
  type: "url" | "image" | "pdf";
  preview: string | null;
  createdAt: string;
  updatedAt: string;
  collectionId: number;
  tags: { id: number; name: string }[];
};

export enum ArchivedFormat {
  png,
  jpeg,
  pdf,
  readability,
  monolith,
}
