import { LinkwardenConfig, Highlight, Link, Collection } from "./types.js";
export declare class LinkwardenClient {
    private config;
    constructor(config: LinkwardenConfig);
    private get baseUrl();
    private request;
    getCollections(): Promise<Collection[]>;
    getLinks(collectionId?: number): Promise<Link[]>;
    getHighlightsByLink(linkId: number): Promise<Highlight[]>;
    getAllHighlights(): Promise<Highlight[]>;
    searchHighlights(query: string): Promise<(Highlight & {
        link?: Link;
    })[]>;
    getLink(linkId: number): Promise<Link | null>;
    getLinkByUrl(url: string): Promise<Link | null>;
}
