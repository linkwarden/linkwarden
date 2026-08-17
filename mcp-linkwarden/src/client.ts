import { LinkwardenConfig, Highlight, Link, Collection, ApiResponse } from "./types.js";

export class LinkwardenClient {
  private config: LinkwardenConfig;

  constructor(config: LinkwardenConfig) {
    this.config = config;
  }

  private get baseUrl() {
    return this.config.baseUrl.replace(/\/+$/, "");
  }

  private async request<T>(path: string, options?: RequestInit): Promise<T> {
    const url = `${this.baseUrl}/api/v1${path}`;
    const res = await fetch(url, {
      ...options,
      headers: {
        "Authorization": `Bearer ${this.config.apiToken}`,
        "Content-Type": "application/json",
        ...options?.headers,
      },
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Linkwarden API error (${res.status}): ${text}`);
    }

    const data: ApiResponse<T> = await res.json();
    return data.response;
  }

  async getCollections(): Promise<Collection[]> {
    return this.request<Collection[]>("/collections");
  }

  async getLinks(collectionId?: number): Promise<Link[]> {
    const params = collectionId ? `?collectionId=${collectionId}` : "";
    return this.request<Link[]>(`/links${params}`);
  }

  async getHighlightsByLink(linkId: number): Promise<Highlight[]> {
    return this.request<Highlight[]>(`/links/${linkId}/highlights`);
  }

  async getAllHighlights(): Promise<Highlight[]> {
    const links = await this.getLinks();
    const allHighlights: Highlight[] = [];
    for (const link of links) {
      try {
        const highlights = await this.getHighlightsByLink(link.id);
        allHighlights.push(...highlights);
      } catch {
        // skip links with no highlights
      }
    }
    return allHighlights;
  }

  async searchHighlights(query: string): Promise<(Highlight & { link?: Link })[]> {
    const links = await this.getLinks();
    const results: (Highlight & { link?: Link })[] = [];

    for (const link of links) {
      try {
        const highlights = await this.getHighlightsByLink(link.id);
        const matching = highlights.filter(
          (h) =>
            h.text.toLowerCase().includes(query.toLowerCase()) ||
            (h.comment && h.comment.toLowerCase().includes(query.toLowerCase()))
        );
        for (const h of matching) {
          results.push({ ...h, link });
        }
      } catch {
        // skip errors
      }
    }

    return results;
  }

  async getLink(linkId: number): Promise<Link | null> {
    try {
      return await this.request<Link>(`/links/${linkId}`);
    } catch {
      return null;
    }
  }

  async getLinkByUrl(url: string): Promise<Link | null> {
    const links = await this.getLinks();
    return links.find((l) => l.url === url) || null;
  }
}
