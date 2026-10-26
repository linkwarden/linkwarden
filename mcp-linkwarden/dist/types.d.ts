export interface LinkwardenConfig {
    baseUrl: string;
    apiToken: string;
}
export interface Highlight {
    id: number;
    color: string;
    comment: string | null;
    linkId: number;
    userId: number;
    startOffset: number;
    endOffset: number;
    text: string;
    createdAt: string;
    updatedAt: string;
}
export interface Link {
    id: number;
    name: string;
    url: string;
    description: string | null;
    collectionId: number;
    type: string;
    createdAt: string;
    updatedAt: string;
    tags?: Tag[];
    highlights?: Highlight[];
}
export interface Collection {
    id: number;
    name: string;
    description: string | null;
    ownerId: number;
    isPublic: boolean;
    createdAt: string;
    updatedAt: string;
}
export interface Tag {
    id: number;
    name: string;
    color: string | null;
}
export interface ApiResponse<T> {
    response: T;
}
