export class LinkwardenClient {
    config;
    constructor(config) {
        this.config = config;
    }
    get baseUrl() {
        return this.config.baseUrl.replace(/\/+$/, "");
    }
    async request(path, options) {
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
        const data = await res.json();
        return data.response;
    }
    async getCollections() {
        return this.request("/collections");
    }
    async getLinks(collectionId) {
        const params = collectionId ? `?collectionId=${collectionId}` : "";
        return this.request(`/links${params}`);
    }
    async getHighlightsByLink(linkId) {
        return this.request(`/links/${linkId}/highlights`);
    }
    async getAllHighlights() {
        const links = await this.getLinks();
        const allHighlights = [];
        for (const link of links) {
            try {
                const highlights = await this.getHighlightsByLink(link.id);
                allHighlights.push(...highlights);
            }
            catch {
                // skip links with no highlights
            }
        }
        return allHighlights;
    }
    async searchHighlights(query) {
        const links = await this.getLinks();
        const results = [];
        for (const link of links) {
            try {
                const highlights = await this.getHighlightsByLink(link.id);
                const matching = highlights.filter((h) => h.text.toLowerCase().includes(query.toLowerCase()) ||
                    (h.comment && h.comment.toLowerCase().includes(query.toLowerCase())));
                for (const h of matching) {
                    results.push({ ...h, link });
                }
            }
            catch {
                // skip errors
            }
        }
        return results;
    }
    async getLink(linkId) {
        try {
            return await this.request(`/links/${linkId}`);
        }
        catch {
            return null;
        }
    }
    async getLinkByUrl(url) {
        const links = await this.getLinks();
        return links.find((l) => l.url === url) || null;
    }
}
