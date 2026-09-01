import { getBrowser, getStorageItem, setStorageItem } from './utils.ts';
import { bookmarkFormValues } from './validators/bookmarkForm.ts';
import {
  deleteLinkFetch,
  postLinkFetch,
  updateLinkFetch,
} from './actions/links.ts';
import BookmarkTreeNode = chrome.bookmarks.BookmarkTreeNode;
import { getConfig } from './config.ts';

const browser = getBrowser();

const BOOKMARKS_METADATA_KEY = 'lw_bookmarks_metadata_cache';
// TODO: Implement caching for tabs metadata maybe?
// I want to cache the all current favorited links in the browser, and cache the ones coming from the server
// so that I can compare them and only update the ones that are different from the server to the browser and vice versa (if needed)
// I think I can do this by using the bookmark id as the key, and the value will be the link object itself (or maybe just the url?)
// I think I can also use the url as the key, and the value will be the bookmark id (or maybe just the bookmark object itself?)

export interface bookmarkMetadata extends bookmarkFormValues {
  id: number;
  collectionId: number;
  bookmarkId?: string;
}

const DEFAULTS: bookmarkMetadata[] = [];

export async function getBookmarksMetadata(): Promise<bookmarkMetadata[]> {
  const bookmarksMetadata = await getStorageItem(BOOKMARKS_METADATA_KEY);
  return bookmarksMetadata ? JSON.parse(bookmarksMetadata) : DEFAULTS;
}

export async function saveBookmarksMetadata(
  bookmarksMetadata: bookmarkMetadata[]
) {
  return await setStorageItem(
    BOOKMARKS_METADATA_KEY,
    JSON.stringify(bookmarksMetadata)
  );
}

export async function clearBookmarksMetadata() {
  return await setStorageItem(BOOKMARKS_METADATA_KEY, JSON.stringify([]));
}

export async function getBookmarkMetadataById(
  id: number
): Promise<bookmarkMetadata | undefined> {
  const bookmarksMetadata = await getBookmarksMetadata();
  return bookmarksMetadata.find(
    (bookmarkMetadata) => bookmarkMetadata.id === id
  );
}

export async function getBookmarkMetadataByBookmarkId(
  bookmarkId: string
): Promise<bookmarkMetadata | undefined> {
  const bookmarksMetadata = await getBookmarksMetadata();
  return bookmarksMetadata.find(
    (bookmarkMetadata) => bookmarkMetadata.bookmarkId === bookmarkId
  );
}

export async function getBookmarkMetadataByUrl(
  url: string
): Promise<bookmarkMetadata | undefined> {
  const bookmarksMetadata = await getBookmarksMetadata();
  return bookmarksMetadata.find(
    (bookmarkMetadata) => bookmarkMetadata.url === url
  );
}

export async function saveBookmarkMetadata(bookmarkMetadata: bookmarkMetadata) {
  const bookmarksMetadata = await getBookmarksMetadata();
  const index = bookmarksMetadata.findIndex(
    (bookmarkMetadataObject) =>
      bookmarkMetadataObject.id === bookmarkMetadata.id
  );
  if (index !== -1) {
    bookmarksMetadata[index] = bookmarkMetadata;
  } else {
    bookmarksMetadata.push(bookmarkMetadata);
  }
  return await saveBookmarksMetadata(bookmarksMetadata);
}

export async function deleteBookmarkMetadata(id: string | undefined) {
  const bookmarksMetadata = await getBookmarksMetadata();
  const index = bookmarksMetadata.findIndex(
    (bookmarkMetadata) => bookmarkMetadata.bookmarkId === id
  );
  if (index !== -1) {
    bookmarksMetadata.splice(index, 1);
  }
  return await saveBookmarksMetadata(bookmarksMetadata);
}

// It just works, don't MOVE
// export async function saveLinksInCache(baseUrl: string) {
//   try {
//     const { apiKey } = await getConfig();
//     const links = await getLinksFetch(baseUrl, apiKey);
//     const linksResponse = links.response;

//     // Create a map to track which bookmarks are still present on the server
//     const serverBookmarkMap = new Map<number, bookmarkMetadata>();
//     linksResponse.forEach(link => serverBookmarkMap.set(link.id, link));

//     // Get the current bookmarks metadata from the cache
//     const bookmarksMetadata = await getBookmarksMetadata();

//     // Update or add bookmarks based on server response
//     for (let link of linksResponse) {
//       const existingLinkIndex = bookmarksMetadata.findIndex((bookmarkMetadata) => bookmarkMetadata.id === link.id);
//       if (existingLinkIndex !== -1) {
//         // Update existing bookmark if there are changes
//         link = { ...bookmarksMetadata[existingLinkIndex], ...link };
//         bookmarksMetadata[existingLinkIndex] = link;
//       } else {
//         // Add new bookmark from the server
//         const newLocalBookmark = await createBookmarkInBrowser(link);
//         link.bookmarkId = newLocalBookmark.id;
//         bookmarksMetadata.push(link);
//       }
//     }

//     // Remove cached bookmarks that are no longer present on the server
//     const bookmarksToRemove = bookmarksMetadata.filter((bookmarkMetadata) => !serverBookmarkMap.has(bookmarkMetadata.id));
//     for (const bookmarkToRemove of bookmarksToRemove) {
//       const indexToRemove = bookmarksMetadata.indexOf(bookmarkToRemove);
//       if (indexToRemove !== -1) {
//         bookmarksMetadata.splice(indexToRemove, 1);
//         if (bookmarkToRemove.bookmarkId != null) {
//           await browser.bookmarks.remove(bookmarkToRemove.bookmarkId);
//         }
//       }
//     }

//     // Save the updated bookmarks metadata back to the cache
//     await saveBookmarksMetadata(bookmarksMetadata);

//   } catch (error) {
//     console.error(error);
//   }
// }

export async function createBookmarkInBrowser(
  bookmark: bookmarkMetadata
): Promise<BookmarkTreeNode> {
  const { url, name } = bookmark;
  return await browser.bookmarks.create({ url, title: name });
}

const getCurrentBookmarks = async () => {
  return await browser.bookmarks.getTree();
};

// Testing will remove later, idk if this would be ok to do, since they are being duplicated in the browser.
export async function syncLocalBookmarks(baseUrl: string) {
  try {
    const { apiKey } = await getConfig();
    // Retrieve all local bookmarks
    const [root] = await getCurrentBookmarks();
    const localBookmarks: bookmarkMetadata[] = [];
    if (!root.children) return;
    logBookmarks(root.children, localBookmarks);

    // Load cached bookmarks metadata
    const bookmarksMetadata = await getBookmarksMetadata();

    // Create a map of cached bookmarks by URL for easy lookup
    const cachedBookmarksMap = new Map(
      bookmarksMetadata.map((bm) => [bm.url, bm])
    );

    // Prepare arrays to hold promises for new, updated, and deleted bookmarks
    const createPromises = [];
    const updatePromises = [];
    const deletePromises = [];

    // Sync new and updated local bookmarks to the server
    for (const localBookmark of localBookmarks) {
      const cachedBookmark = cachedBookmarksMap.get(localBookmark.url);
      if (!cachedBookmark) {
        // New bookmark
        createPromises.push(postLinkFetch(baseUrl, localBookmark, apiKey));
      } else if (cachedBookmark.name !== localBookmark.name) {
        // Updated bookmark
        updatePromises.push(
          updateLinkFetch(baseUrl, cachedBookmark.id, localBookmark, apiKey)
        );
      }
      // Remove from the map to track deleted bookmarks
      cachedBookmarksMap.delete(localBookmark.url);
    }

    // Prepare delete promises for bookmarks that are no longer in the local bookmarks
    for (const [, cachedBookmark] of cachedBookmarksMap) {
      deletePromises.push(deleteLinkFetch(baseUrl, cachedBookmark.id, apiKey));
    }

    // Run all create, update, and delete operations in parallel
    await Promise.all([
      ...createPromises,
      ...updatePromises,
      ...deletePromises,
    ]);

    // Update the cached bookmarks metadata
    await saveBookmarksMetadata(localBookmarks);
  } catch (error) {
    console.error(error);
  }
}

// Helper function to collect all bookmarks recursively
function logBookmarks(
  bookmarks: BookmarkTreeNode[],
  accumulator: bookmarkMetadata[]
) {
  for (const bookmark of bookmarks) {
    if (bookmark.url) {
      accumulator.push({
        id: parseInt(bookmark.id), // Convert string id to number
        collectionId: 0, // Define how to determine collectionId
        name: bookmark.title,
        url: bookmark.url,
        description: '', // Define how to get description
        collection: { id: 0, name: '', ownerId: 0 }, // Define collection details
        tags: [], // Define how to get tags
        bookmarkId: bookmark.id,
      });
    } else if (bookmark.children) {
      logBookmarks(bookmark.children, accumulator);
    }
  }
}
