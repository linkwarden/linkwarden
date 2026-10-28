export type LinkwardenConfig = {
  baseUrl: string;
  token: string;
};

export type ApiEnvelope<T> = {
  response: T;
};

export type Tag = {
  id: number;
  name: string;
};

export type Collection = {
  id: number;
  name: string;
  description: string;
  isPublic: boolean;
  parentId: number | null;
};

export type Link = {
  id: number;
  name: string;
  url: string | null;
  description: string;
  type: string;
  collectionId: number;
  collection?: Collection;
  tags?: Tag[];
  textContent?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type SearchLinksResponse = {
  data: {
    links: Link[];
    nextCursor: number | null;
  };
  success: boolean;
  message: string;
};

export type Highlight = {
  id: number;
  color: string;
  comment: string | null;
  linkId: number;
  startOffset: number;
  endOffset: number;
  text: string;
  createdAt: string;
  updatedAt: string;
};

export type SearchLinksParams = {
  searchQueryString?: string;
  collectionId?: number;
  tagId?: number;
  pinnedOnly?: boolean;
  cursor?: number;
};
