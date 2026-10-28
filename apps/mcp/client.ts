import type {
  ApiEnvelope,
  Collection,
  Highlight,
  Link,
  LinkwardenConfig,
  SearchLinksParams,
  SearchLinksResponse,
} from "./types.js";

export class LinkwardenClient {
  constructor(private readonly config: LinkwardenConfig) {}

  private get baseUrl() {
    return this.config.baseUrl.replace(/\/+$/, "");
  }

  private async request<T>(path: string): Promise<T> {
    const res = await fetch(`${this.baseUrl}/api/v1${path}`, {
      headers: {
        Authorization: `Bearer ${this.config.token}`,
      },
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Linkwarden API error (${res.status}): ${body}`);
    }

    return (await res.json()) as T;
  }

  async getCollections(): Promise<Collection[]> {
    const { response } =
      await this.request<ApiEnvelope<Collection[]>>("/collections");
    return response;
  }

  async searchLinks(
    params: SearchLinksParams = {}
  ): Promise<SearchLinksResponse["data"]> {
    const query = new URLSearchParams();
    if (params.searchQueryString)
      query.set("searchQueryString", params.searchQueryString);
    if (params.collectionId !== undefined)
      query.set("collectionId", String(params.collectionId));
    if (params.tagId !== undefined) query.set("tagId", String(params.tagId));
    if (params.pinnedOnly) query.set("pinnedOnly", "true");
    if (params.cursor !== undefined) query.set("cursor", String(params.cursor));

    const { data } = await this.request<SearchLinksResponse>(
      `/search?${query.toString()}`
    );
    return data;
  }

  async getLink(linkId: number): Promise<Link> {
    const { response } = await this.request<ApiEnvelope<Link>>(
      `/links/${linkId}`
    );
    return response;
  }

  async getLinkHighlights(linkId: number): Promise<Highlight[]> {
    const { response } = await this.request<ApiEnvelope<Highlight[]>>(
      `/links/${linkId}/highlights`
    );
    return response;
  }
}
