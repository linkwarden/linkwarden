import axios from 'axios';

export interface ResponseTags {
  id: number;
  name: string;
  ownerId: number;
  createdAt: string;
  updatedAt: string;
  _count: {
    links: number;
  };
}

type ConfigResponse = {
  response: {
    INSTANCE_VERSION?: string | null;
  };
};

type LegacyTagsResponse = {
  response:
    | ResponseTags[]
    | { tags: ResponseTags[]; nextCursor?: number | null };
};

type PaginatedTagsResponse = {
  data: {
    tags: ResponseTags[];
    nextCursor?: number | null;
  };
};

const MIN_TAG_PAGINATION_VERSION = '2.14.0';
const MIN_TAG_SEARCH_VERSION = '2.14.1';
const TAG_SORT_NAME_ASC = 2;
const tagFeatureSupportCache = new Map<
  string,
  {
    shouldUsePagination: boolean;
    shouldUseSearch: boolean;
  }
>();

export type TagsPage = {
  tags: ResponseTags[];
  nextCursor: number | null;
};

const normalizeVersion = (version?: string | null) => {
  if (!version) return null;

  return version
    .replace(/^v/i, '')
    .split('-')[0]
    .split('.')
    .map((part) => Number(part.replace(/\D/g, '')) || 0);
};

const isAtLeastInstanceVersion = (
  version?: string | null,
  minimumVersion?: string | null
) => {
  const normalizedVersion = normalizeVersion(version);
  const normalizedMinimumVersion = normalizeVersion(minimumVersion);

  if (!normalizedVersion || !normalizedMinimumVersion) return false;

  const length = Math.max(
    normalizedVersion.length,
    normalizedMinimumVersion.length
  );

  for (let index = 0; index < length; index++) {
    const left = normalizedVersion[index] ?? 0;
    const right = normalizedMinimumVersion[index] ?? 0;

    if (left > right) return true;
    if (left < right) return false;
  }

  return true;
};

const extractTagsPayload = (
  data: LegacyTagsResponse | PaginatedTagsResponse
): { tags: ResponseTags[]; nextCursor: number | null } => {
  if (Array.isArray((data as LegacyTagsResponse).response)) {
    return {
      tags: (data as LegacyTagsResponse).response as ResponseTags[],
      nextCursor: null,
    };
  }

  if (
    (data as LegacyTagsResponse).response &&
    !Array.isArray((data as LegacyTagsResponse).response)
  ) {
    const response = (data as LegacyTagsResponse).response as {
      tags: ResponseTags[];
      nextCursor?: number | null;
    };

    return {
      tags: response.tags,
      nextCursor: response.nextCursor ?? null,
    };
  }

  const response = (data as PaginatedTagsResponse).data;

  return {
    tags: response.tags,
    nextCursor: response.nextCursor ?? null,
  };
};

const getInstanceVersion = async (baseUrl: string, apiKey: string) => {
  try {
    const response = await axios.get<ConfigResponse>(
      `${baseUrl}/api/v1/config`,
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      }
    );

    return response.data.response.INSTANCE_VERSION ?? null;
  } catch (_error) {
    return null;
  }
};

const getTagFeatureSupportCacheKey = (baseUrl: string, apiKey: string) =>
  `${baseUrl}::${apiKey}`;

const getTagFeatures = async (baseUrl: string, apiKey: string) => {
  const cacheKey = getTagFeatureSupportCacheKey(baseUrl, apiKey);
  const cachedValue = tagFeatureSupportCache.get(cacheKey);

  if (cachedValue !== undefined) return cachedValue;

  const instanceVersion = await getInstanceVersion(baseUrl, apiKey);
  const nextValue = {
    shouldUsePagination: isAtLeastInstanceVersion(
      instanceVersion,
      MIN_TAG_PAGINATION_VERSION
    ),
    shouldUseSearch: isAtLeastInstanceVersion(
      instanceVersion,
      MIN_TAG_SEARCH_VERSION
    ),
  };

  tagFeatureSupportCache.set(cacheKey, nextValue);

  return nextValue;
};

export const getShouldUseTagSearch = async (baseUrl: string, apiKey: string) =>
  (await getTagFeatures(baseUrl, apiKey)).shouldUseSearch;

export async function getTags(
  baseUrl: string,
  apiKey: string,
  cursor = 0,
  search = ''
): Promise<TagsPage> {
  const { shouldUsePagination, shouldUseSearch } = await getTagFeatures(
    baseUrl,
    apiKey
  );

  const headers = {
    Authorization: `Bearer ${apiKey}`,
  };

  const searchParams = new URLSearchParams();
  const normalizedSearch = search.trim();
  searchParams.set('sort', String(TAG_SORT_NAME_ASC));

  if (shouldUsePagination) {
    searchParams.set('cursor', String(cursor));
  }

  if (shouldUseSearch && normalizedSearch) {
    searchParams.set('search', normalizedSearch);
  }

  const initialResponse = await axios.get<
    LegacyTagsResponse | PaginatedTagsResponse
  >(`${baseUrl}/api/v1/tags?${searchParams.toString()}`, {
    headers,
  });

  const payload = extractTagsPayload(initialResponse.data);

  return {
    tags: payload.tags,
    nextCursor: shouldUsePagination ? payload.nextCursor : null,
  };
}
