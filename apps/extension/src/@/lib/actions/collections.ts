import axios from 'axios';

interface ResponseCollections {
  color: string;
  createdAt: string;
  description: string;
  id: number;
  isPublic: boolean;
  members: never[]; // Assuming members can be of any type, adjust as necessary
  name: string;
  ownerId: number;
  parent: null | {
    id: number;
    name: string;
  };
  parentId: null | number; // Assuming parentId can be null or a number
  updatedAt: string;
}

function buildFullPath(
  collection: ResponseCollections,
  collectionsMap: Map<number, ResponseCollections>
): string {
  const paths: string[] = [collection.name];
  let currentParent = collection.parent;

  while (currentParent) {
    paths.unshift(currentParent.name);
    const parentCollection = collectionsMap.get(currentParent.id);
    currentParent = parentCollection?.parent || null;
  }

  return paths.join(' > ');
}

export async function getCollections(baseUrl: string, apiKey: string) {
  const url = `${baseUrl}/api/v1/collections`;

  const response = await axios.get<{ response: ResponseCollections[] }>(url, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
  });

  // Create a map for quick lookups
  const collectionsMap = new Map(
    response.data.response.map((collection) => [collection.id, collection])
  );

  // Format the collection names with full parent structure
  const formattedCollections = response.data.response.map((collection) => ({
    ...collection,
    pathname: buildFullPath(collection, collectionsMap),
  }));

  return {
    ...response,
    data: {
      response: formattedCollections,
    },
  };
}
