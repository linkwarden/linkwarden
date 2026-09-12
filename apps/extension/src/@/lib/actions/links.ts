import captureScreenshot from "../screenshot.ts";
import { bookmarkFormValues } from "../validators/bookmarkForm.ts";
import axios from "axios";
// import { bookmarkMetadata } from '../cache.ts';

export async function postLink(
  baseUrl: string,
  uploadImage: boolean,
  data: bookmarkFormValues,
  setState: (state: "capturing" | "uploading" | null) => void,
  apiKey: string
) {
  const url = `${baseUrl}/api/v1/links`;

  if (uploadImage) {
    setState("capturing");
    const screenshot = await captureScreenshot();
    setState("uploading");

    const link = await axios.post(url, data, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });

    const { id } = link.data.response;
    const archiveUrl = `${baseUrl}/api/v1/archives/${id}?format=0`;

    const formData = new FormData();
    formData.append("file", screenshot, "screenshot.png");

    await axios.post(archiveUrl, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
        Authorization: `Bearer ${apiKey}`,
      },
    });

    setState(null);

    return link;
  } else {
    return await axios.post(url, data, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
    });
  }
}

export async function postLinkFetch(
  baseUrl: string,
  data: bookmarkFormValues,
  apiKey: string
) {
  const url = `${baseUrl}/api/v1/links`;

  return await fetch(url, {
    method: "POST",
    body: JSON.stringify(data),
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
  });
}

export async function updateLink(
  baseUrl: string,
  id: number,
  uploadImage: boolean,
  data: bookmarkFormValues,
  setState: (state: "capturing" | "uploading" | null) => void,
  apiKey: string
) {
  if (!data.collection?.id || data.collection.ownerId == null) {
    throw new Error("Please select a collection.");
  }

  const url = `${baseUrl}/api/v1/links/${id}`;
  const body = {
    id,
    name: data.name,
    url: data.url,
    description: data.description,
    collection: {
      id: data.collection.id,
      ownerId: data.collection.ownerId,
    },
    tags: (data.tags ?? []).map((tag) => ({
      ...(typeof tag.id === "number" ? { id: tag.id } : {}),
      name: tag.name,
    })),
  };

  const link = await axios.put(url, body, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
  });

  if (uploadImage) {
    setState("capturing");
    const screenshot = await captureScreenshot();
    setState("uploading");

    const archiveUrl = `${baseUrl}/api/v1/archives/${id}?format=0`;
    const formData = new FormData();
    formData.append("file", screenshot, "screenshot.png");

    await axios.post(archiveUrl, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
        Authorization: `Bearer ${apiKey}`,
      },
    });

    setState(null);
  }

  return link;
}

export async function updateLinkFetch(
  baseUrl: string,
  id: number,
  data: bookmarkFormValues,
  apiKey: string
) {
  const url = `${baseUrl}/api/v1/links/${id}`;

  return await fetch(url, {
    method: "PUT",
    body: JSON.stringify(data),
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
  });
}

function apiRoot(baseUrl: string) {
  return baseUrl.replace(/\/+$/, "");
}

function authHeaders(apiKey: string) {
  return {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  };
}

function axiosErrorMessage(error: unknown, fallback: string) {
  if (axios.isAxiosError(error)) {
    const response = error.response?.data?.response;
    if (typeof response === "string" && response.trim()) return response;
    if (error.response?.status) {
      return `${fallback} (HTTP ${error.response.status})`;
    }
  }
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

async function deleteOnServer(
  baseUrl: string,
  ids: number[],
  apiKey: string
) {
  const root = apiRoot(baseUrl);
  const headers = authHeaders(apiKey);
  let lastError: unknown;

  for (const id of ids) {
    try {
      await axios.delete(`${root}/api/v1/links/${id}`, { headers });
    } catch (error) {
      lastError = error;
    }
  }

  // 1.5.6 / v2.5 also deletes via the collection route. Always try it so a
  // no-op or GET-converted /links/:id DELETE cannot look like success.
  try {
    await axios.delete(`${root}/api/v1/links`, {
      headers,
      data: { linkIds: ids },
    });
  } catch (error) {
    lastError = error;
  }

  return lastError;
}

export async function deleteLinks(
  baseUrl: string,
  ids: number[],
  apiKey: string,
  linkUrl?: string
) {
  const unique = [...new Set(ids)].filter((id) => Number.isInteger(id) && id > 0);
  if (unique.length === 0) {
    throw new Error("Nothing to remove");
  }

  const visibleByGet = new Set<number>();
  for (const id of unique) {
    if (await fetchLinkById(baseUrl, apiKey, id)) visibleByGet.add(id);
  }

  const lastError = await deleteOnServer(baseUrl, unique, apiKey);

  const remainingGet: number[] = [];
  for (const id of visibleByGet) {
    if (await fetchLinkById(baseUrl, apiKey, id)) remainingGet.push(id);
  }
  if (remainingGet.length > 0) {
    throw new Error(
      axiosErrorMessage(lastError, "The server did not remove the link.")
    );
  }

  const getConfirmedAllGone =
    visibleByGet.size === unique.length && remainingGet.length === 0;

  if (linkUrl && !getConfirmedAllGone) {
    const leftover = await findSavedLinks(baseUrl, apiKey, linkUrl);
    if (Array.isArray(leftover) && leftover.some((link) => unique.includes(link.id))) {
      throw new Error(
        axiosErrorMessage(lastError, "The server did not remove the link.")
      );
    }
  }
}

export async function deleteLinkFetch(
  baseUrl: string,
  id: number,
  apiKey: string
) {
  await deleteLinks(baseUrl, [id], apiKey);
  return new Response(null, { status: 200 });
}

// export async function getLinksFetch(
//   baseUrl: string,
//   apiKey: string
// ): Promise<{ response: bookmarkMetadata[] }> {
//   const url = `${baseUrl}/api/v1/links`;
//   const response = await fetch(url, {
//     headers: {
//       Authorization: `Bearer ${apiKey}`,
//     },
//   });
//   return await response.json();
// }

type SavedLink = {
  id: number;
  url?: string | null;
  name?: string | null;
  description?: string | null;
  collection?: {
    id?: number;
    ownerId?: number;
    name?: string;
  } | null;
  tags?: { id?: number; name: string }[] | null;
};

export async function fetchLinkById(
  baseUrl: string,
  apiKey: string,
  id: number
): Promise<SavedLink | null> {
  const response = await fetch(`${apiRoot(baseUrl)}/api/v1/links/${id}`, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
  });
  if (!response.ok) return null;

  const json = await response.json();
  const link = json?.response;
  const parsedId = numericId(link?.id);
  if (!link || parsedId == null) return null;
  return { ...link, id: parsedId } as SavedLink;
}

function linksFromPayload(json: unknown): SavedLink[] | null {
  if (!json || typeof json !== "object") return null;
  const payload = json as Record<string, unknown>;
  const data = payload.data as Record<string, unknown> | unknown[] | undefined;

  if (Array.isArray(data)) return [];
  if (data && Array.isArray(data.links)) return data.links as SavedLink[];
  if (Array.isArray(payload.response)) return payload.response as SavedLink[];
  if (
    payload.response &&
    typeof payload.response === "object" &&
    Array.isArray((payload.response as { links?: unknown }).links)
  ) {
    return (payload.response as { links: SavedLink[] }).links;
  }
  return null;
}

async function fetchLinkResults(
  url: string,
  apiKey: string
): Promise<SavedLink[] | null> {
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
  });
  if (!response.ok) return null;
  return linksFromPayload(await response.json());
}

function numericId(value: unknown): number | null {
  if (typeof value === "number" && Number.isInteger(value)) return value;
  if (typeof value === "string" && /^\d+$/.test(value)) return Number(value);
  return null;
}

function normalizeLink(link: SavedLink): SavedLink | null {
  const id = numericId(link.id);
  if (id == null) return null;
  return { ...link, id };
}

function canonicalizeUrl(linkUrl: string): string | null {
  const noHash = linkUrl.trim().split("#")[0];
  if (!noHash) return null;
  try {
    const parsed = new URL(noHash);
    parsed.hash = "";
    parsed.username = "";
    parsed.password = "";
    if (parsed.pathname.length > 1 && parsed.pathname.endsWith("/")) {
      parsed.pathname = parsed.pathname.slice(0, -1);
    }
    return parsed.href;
  } catch {
    return noHash.replace(/\/+$/, "") || null;
  }
}

function urlsMatchExactly(savedUrl: string, tabUrl: string): boolean {
  const saved = canonicalizeUrl(savedUrl);
  const tab = canonicalizeUrl(tabUrl);
  return !!saved && !!tab && saved === tab;
}

function urlPathnameIsEmpty(linkUrl: string): boolean {
  try {
    const pathname = new URL(linkUrl).pathname;
    return pathname === "" || pathname === "/";
  } catch {
    return true;
  }
}

async function confirmExactMatches(
  baseUrl: string,
  apiKey: string,
  links: SavedLink[],
  tabUrl: string
): Promise<SavedLink[]> {
  const matches: SavedLink[] = [];
  const seen = new Set<number>();
  let hydrates = 0;

  for (const raw of links) {
    const link = normalizeLink(raw);
    if (!link || seen.has(link.id)) continue;

    // Prisma/Meilisearch `contains` matches https://vg.no against
    // https://vg.no/otherarticle. Different paths are never "this page".
    if (link.url && !urlsMatchExactly(link.url, tabUrl)) continue;

    let resolved = link;
    const searchUrlLooksPartial = !link.url || urlPathnameIsEmpty(link.url);
    if (searchUrlLooksPartial && hydrates < 10) {
      hydrates += 1;
      const full = await fetchLinkById(baseUrl, apiKey, link.id);
      if (full) resolved = full;
    }

    if (!resolved.url || !urlsMatchExactly(resolved.url, tabUrl)) continue;
    seen.add(link.id);
    matches.push(resolved);
  }

  return matches;
}

export async function findSavedLinks(
  baseUrl: string,
  apiKey: string,
  linkUrl: string | undefined
): Promise<SavedLink[] | false | null> {
  if (!baseUrl || !apiKey || !linkUrl) {
    return false;
  }

  const queryUrl = canonicalizeUrl(linkUrl) ?? linkUrl;
  const encoded = encodeURIComponent(queryUrl);

  // 1.5.6 Prisma search treats the whole string as contains-text, so
  // `url:https://...` never matches. Send the raw URL first. Keep the
  // `url:` form and the older /links route for Meilisearch and pre-search APIs.
  const queries = [
    `${apiRoot(baseUrl)}/api/v1/search?sort=0&searchQueryString=${encoded}`,
    `${apiRoot(baseUrl)}/api/v1/search?sort=0&searchQueryString=${encodeURIComponent(`url:${queryUrl}`)}`,
    `${apiRoot(baseUrl)}/api/v1/links?sort=0&searchQueryString=${encoded}&searchByUrl=true`,
  ];

  try {
    let sawSuccess = false;
    for (const url of queries) {
      const links = await fetchLinkResults(url, apiKey);
      if (links === null) continue;
      sawSuccess = true;
      const matches = await confirmExactMatches(
        baseUrl,
        apiKey,
        links,
        linkUrl
      );
      if (matches.length) return matches;
    }
    // A domain-wide contains hit is a successful lookup of *other* pages,
    // not a failed request. Do not leave a stale checkmark.
    return sawSuccess ? false : null;
  } catch (error) {
    console.error(error);
    return null;
  }
}

export async function findSavedLink(
  baseUrl: string,
  apiKey: string,
  linkUrl: string | undefined
): Promise<SavedLink | false | null> {
  const found = await findSavedLinks(baseUrl, apiKey, linkUrl);
  if (!found) return found;
  return found[0];
}

export async function checkLinkExists(
  baseUrl: string,
  apiKey: string,
  linkUrl: string | undefined
): Promise<boolean | null> {
  const found = await findSavedLink(baseUrl, apiKey, linkUrl);
  if (found === null) return null;
  return found !== false;
}

export async function searchSavedLinks(
  baseUrl: string,
  apiKey: string,
  query: string
): Promise<SavedLink[]> {
  const trimmed = query.trim();
  const encoded = encodeURIComponent(trimmed);
  const urls = trimmed
    ? [
        `${apiRoot(baseUrl)}/api/v1/search?sort=0&searchQueryString=${encoded}`,
        `${apiRoot(baseUrl)}/api/v1/links?sort=0&searchQueryString=${encoded}`,
      ]
    : [
        `${apiRoot(baseUrl)}/api/v1/links?sort=0`,
        `${apiRoot(baseUrl)}/api/v1/search?sort=0`,
      ];
  for (const url of urls) {
    const links = await fetchLinkResults(url, apiKey);
    if (links) return links.slice(0, 6);
  }
  return [];
}
