import { prisma } from "@linkwarden/prisma";
import { LinkRequestQuery, Order, Sort } from "@linkwarden/types/global";
import { meiliClient } from "@linkwarden/lib/meilisearchClient";
import {
  buildAccessFilter,
  buildMeiliSearches,
  escapeForMeilisearch,
  MAX_SEARCH_BRANCHES,
  parseSearchQuery,
  SearchBranch,
} from "../../searchQueryBuilder";
import getAccessibleCollectionIds from "@/lib/api/getAccessibleCollectionIds";
import type { MeiliSearchApiError } from "meilisearch";

// Documents also hold the collection owner's account details, so only match the
// query against the link's own fields.
const LINK_FIELDS = [
  "name",
  "url",
  "description",
  "metaDescription",
  "textContent",
  "tags",
  "collectionName",
];

// Meilisearch's default `maxTotalHits`, the most results it hands back for a search
const MEILI_MAX_HITS = 1000;

const meiliErrorCode = (err: unknown) =>
  (err as MeiliSearchApiError)?.cause?.code;

interface SearchLinksParams {
  query: LinkRequestQuery;
  userId?: number;
  publicOnly?: boolean;
}

export default async function searchLinks({
  query,
  userId,
  publicOnly,
}: SearchLinksParams) {
  const POSTGRES_IS_ENABLED =
    process.env.DATABASE_URL?.startsWith("postgresql");

  const paginationTakeCount = Number(process.env.PAGINATION_TAKE_COUNT) || 50;

  const accessibleCollectionIdsPromise = userId
    ? getAccessibleCollectionIds(userId)
    : null;
  accessibleCollectionIdsPromise?.catch(() => {});

  const resolveAccessCondition = async () => {
    if (!accessibleCollectionIdsPromise) return [];
    const { accessibleCollectionIds } = await accessibleCollectionIdsPromise;
    return [{ collectionId: { in: accessibleCollectionIds } }];
  };

  let order: Order[] = [{ id: "desc" }];
  if (query.sort === Sort.DateNewestFirst) order = [{ id: "desc" }];
  else if (query.sort === Sort.DateOldestFirst) order = [{ id: "asc" }];
  else if (query.sort === Sort.NameAZ) order = [{ name: "asc" }];
  else if (query.sort === Sort.NameZA) order = [{ name: "desc" }];
  // A link's order only places it against the others in its own collection, so the
  // custom order means something only when one collection is being listed. Anything
  // wider falls through to newest first.
  else if (query.sort === Sort.Custom && query.collectionId)
    order = [{ collectionOrder: "desc" }, { id: "desc" }];

  const tagCondition = [];
  if (query.tagId) {
    tagCondition.push({
      tags: {
        some: { id: query.tagId },
      },
    });
  }

  const collectionCondition = [];
  if (query.collectionId || publicOnly) {
    collectionCondition.push({
      collection: {
        id: query.collectionId,
        ...(publicOnly ? { isPublic: true } : {}),
      },
    });
  }

  const pinnedCondition =
    query.pinnedOnly && userId ? { pinnedBy: { some: { id: userId } } } : {};

  if (meiliClient && query.searchQueryString) {
    const meili = meiliClient;
    const nothingFound = {
      data: [],
      statusCode: 200,
      success: true,
      message: "Nothing found.",
    };

    const searches = buildMeiliSearches(
      parseSearchQuery(query.searchQueryString),
      userId
    );
    if (!searches)
      return {
        data: [],
        statusCode: 400,
        success: false,
        message: `This search has too many OR combinations. Up to ${MAX_SEARCH_BRANCHES} are allowed, and (a OR b) (c OR d) counts as 4.`,
      };

    const accessFilter = buildAccessFilter({ userId, publicOnly });

    // Narrow the search to the list it was made from in Meilisearch itself.
    // Filtering only the page it returns would leave most of that page out.
    const listFilters: string[] = [];
    if (query.tagId) {
      // Only a tag the user can see, like on its own page. Any other one is
      // answered like a missing tag, so the reply can't give away its name.
      const memberCollectionIds = accessibleCollectionIdsPromise
        ? (await accessibleCollectionIdsPromise).memberCollectionIds
        : [];
      const tag = userId
        ? await prisma.tag.findFirst({
            where: {
              id: query.tagId,
              OR: [
                { ownerId: userId },
                {
                  links: {
                    some: {
                      collectionId: { in: memberCollectionIds },
                    },
                  },
                },
              ],
            },
            select: { name: true },
          })
        : null;
      if (!tag) return nothingFound;

      // Tags are stored by name, so this can also keep links with another
      // owner's tag of the same name. The database query below drops those.
      listFilters.push(`tags = "${escapeForMeilisearch(tag.name)}"`);
    }
    if (query.pinnedOnly && userId) listFilters.push(`pinnedBy = ${userId}`);
    // Like the database query below, a link that has the tag or is pinned stays
    const listFilter =
      listFilters.length > 0
        ? listFilters.map((filter) => `(${filter})`).join(" OR ")
        : null;

    const collectionFilter = Number.isInteger(query.collectionId)
      ? `collectionId = ${query.collectionId}`
      : null;

    const search = async (
      branch: SearchBranch,
      params: {
        limit: number;
        offset: number;
        sort?: string[];
        matchingStrategy?: "all" | "frequency";
        showRankingScore?: boolean;
      }
    ) => {
      const filters = [
        accessFilter,
        ...branch.filters,
        ...(listFilter ? [listFilter] : []),
      ];
      const run = (filter: string[]) =>
        meili.index("links").search(branch.q, {
          filter,
          attributesToSearchOn: LINK_FIELDS,
          attributesToRetrieve: ["id"],
          ...params,
        });

      if (!collectionFilter) return run(filters);

      try {
        return await run([...filters, collectionFilter]);
      } catch (err) {
        // The worker makes `collectionId` filterable when it starts. Until then
        // the collection is only filtered in the database query below.
        if (meiliErrorCode(err) !== "invalid_search_filter") throw err;
        return run(filters);
      }
    };

    const searchText = async (
      branch: SearchBranch,
      page: { limit: number; offset: number; sort?: string[] }
    ) => {
      // Every word has to be in the link (with typos, and the last word as a
      // prefix), so a search isn't padded out with links matching one word of it.
      const resp = await search(branch, { ...page, matchingStrategy: "all" });

      // When no link has every word, show the closest ones instead of nothing.
      // A quoted phrase is meant exactly, so it doesn't get loosened.
      if (resp.estimatedTotalHits !== 0 || branch.exact) return resp;

      return search(branch, { ...page, matchingStrategy: "frequency" }).catch(
        (err) => {
          // Older Meilisearch versions don't know this strategy
          if (meiliErrorCode(err) === "invalid_search_matching_strategy")
            return resp;
          throw err;
        }
      );
    };

    // With OR between words, each alternative is searched on its own and the
    // matches are put together by how well they match. An alternative of
    // operators and left out words only has nothing to rank by, so its links
    // come after the others, newest first. With a `sort`, links that match
    // equally well are kept in that order instead.
    const searchAlternatives = async (sort?: string[]) => {
      const run = (matchingStrategy: "all" | "frequency") =>
        Promise.all(
          searches.map((branch) =>
            !branch.ranked
              ? search(branch, {
                  limit: MEILI_MAX_HITS,
                  offset: 0,
                  sort: sort ?? ["id:desc"],
                })
              : search(branch, {
                  limit: MEILI_MAX_HITS,
                  offset: 0,
                  showRankingScore: true,
                  matchingStrategy: branch.exact ? "all" : matchingStrategy,
                  ...(sort ? { sort } : {}),
                })
          )
        );

      let responses = await run("all");

      // Like a search without OR, a search that finds nothing gets loosened
      if (responses.every((resp) => resp.hits.length === 0)) {
        const strict = responses;
        responses = await run("frequency").catch((err) => {
          if (meiliErrorCode(err) === "invalid_search_matching_strategy")
            return strict;
          throw err;
        });
      }

      // Among links that match equally well. A name sort has no ids to go by,
      // so those keep the order Meilisearch gave each alternative.
      const tieBreak = (a: { id: number; score: number }, b: typeof a) =>
        !sort
          ? a.score < 0
            ? b.id - a.id
            : 0
          : sort[0] === "id:asc"
            ? a.id - b.id
            : sort[0] === "id:desc"
              ? b.id - a.id
              : 0;

      const ranked = responses
        .flatMap((resp, i) =>
          resp.hits.map((hit) => ({
            id: hit.id as number,
            score: searches[i].ranked ? hit._rankingScore ?? 0 : -1,
          }))
        )
        .sort((a, b) => b.score - a.score || tieBreak(a, b));

      return Array.from(new Set(ranked.map((hit) => hit.id))).slice(
        0,
        MEILI_MAX_HITS
      );
    };

    const limit = paginationTakeCount;
    const offset = query.cursor || 0;

    // A search of operators and left out words only has nothing to rank by, so
    // Meilisearch sorts it
    const onlyFilters = searches.length === 1 && !searches[0].ranked;

    // With search text, Meilisearch ranks by how well each link matches. For best
    // match that ranking is the order. For any other sort, the matches are put in
    // that order by the database, so the whole list follows it, not each page.
    const byMatch = !onlyFilters && query.sort === Sort.BestMatch;
    const sortInDatabase = !onlyFilters && !byMatch;

    // Meilisearch hands back at most MEILI_MAX_HITS links. When more match just as
    // well, this decides which ones it keeps, so they're the ones that come first
    // in the chosen order.
    const meiliSort =
      query.sort === Sort.DateOldestFirst
        ? ["id:asc"]
        : query.sort === Sort.NameAZ
          ? ["name:asc"]
          : query.sort === Sort.NameZA
            ? ["name:desc"]
            : ["id:desc"];

    let meiliIds: number[];
    if (onlyFilters) {
      const resp = await search(searches[0], {
        limit,
        offset,
        sort: meiliSort,
      });
      meiliIds = resp.hits.map((hit) => hit.id);
    } else if (searches.length === 1) {
      const resp = await searchText(
        searches[0],
        byMatch
          ? { limit, offset }
          : { limit: MEILI_MAX_HITS, offset: 0, sort: meiliSort }
      );
      meiliIds = resp.hits.map((hit) => hit.id);
    } else {
      const ranked = await searchAlternatives(byMatch ? undefined : meiliSort);
      meiliIds = byMatch ? ranked.slice(offset, offset + limit) : ranked;
    }

    if (meiliIds.length === 0) return nothingFound;

    const accessCondition = await resolveAccessCondition();

    const links = await prisma.link.findMany({
      where: {
        id: { in: meiliIds },
        AND: [
          ...accessCondition,
          ...collectionCondition,
          {
            OR: [
              ...tagCondition,
              {
                ...pinnedCondition,
              },
            ],
          },
        ],
      },
      omit: {
        textContent: true,
      },
      include: {
        tags: true,
        collection: true,
        pinnedBy: userId
          ? {
              where: { id: userId },
              select: { id: true },
            }
          : undefined,
      },
      orderBy: order,
      ...(sortInDatabase ? { skip: offset, take: limit } : {}),
    });

    if (byMatch) {
      const position = new Map(meiliIds.map((id, index) => [id, index]));
      links.sort((a, b) => position.get(a.id)! - position.get(b.id)!);
    }

    const nextCursor = sortInDatabase
      ? links.length === limit
        ? offset + limit
        : null
      : meiliIds.length === limit
        ? offset + limit
        : null;

    return {
      data: {
        links,
        nextCursor,
      },
      statusCode: 200,
      success: true,
      message: "Success",
    };
  }

  // Fallback: No Meilisearch
  // Text in double quotes, like a tag button's search, is searched for as it's
  // written inside them, the same as with Meilisearch
  const quoted = query.searchQueryString?.match(/^"((?:[^"\\]|\\[\s\S])*)"$/);
  const searchText = quoted
    ? quoted[1].replace(/\\([\s\S])/g, "$1")
    : query.searchQueryString;

  const searchConditions = [];

  if (searchText) {
    searchConditions.push({
      name: {
        contains: searchText,
        mode: POSTGRES_IS_ENABLED ? "insensitive" : undefined,
      },
    });

    searchConditions.push({
      url: {
        contains: searchText,
        mode: POSTGRES_IS_ENABLED ? "insensitive" : undefined,
      },
    });

    searchConditions.push({
      description: {
        contains: searchText,
        mode: POSTGRES_IS_ENABLED ? "insensitive" : undefined,
      },
    });

    searchConditions.push({
      tags: {
        some: {
          name: {
            contains: searchText,
            mode: POSTGRES_IS_ENABLED ? "insensitive" : undefined,
          },
        },
      },
    });
  }

  const accessCondition = await resolveAccessCondition();

  const links = await prisma.link.findMany({
    take: paginationTakeCount,
    skip: query.cursor ? 1 : undefined,
    cursor: query.cursor ? { id: query.cursor } : undefined,
    where: {
      AND: [
        ...accessCondition,
        ...collectionCondition,
        {
          OR: [
            ...tagCondition,
            {
              [searchText ? "OR" : "AND"]: [
                pinnedCondition,
                ...searchConditions,
              ],
            },
          ],
        },
      ],
    },
    omit: {
      textContent: true,
    },
    include: {
      tags: true,
      collection: true,
      pinnedBy: userId
        ? {
            where: { id: userId },
            select: { id: true },
          }
        : undefined,
    },
    orderBy: order,
  });

  return {
    data: {
      links,
      nextCursor:
        links.length === paginationTakeCount
          ? links[links.length - 1].id
          : null,
    },
    statusCode: 200,
    success: true,
    message: "Success",
  };
}
