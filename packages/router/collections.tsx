import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  CollectionIncludingMembersAndLinkCount,
  MobileAuth,
} from "@linkwarden/types/global";
import { useSession } from "next-auth/react";
import type toaster from "react-hot-toast";
import { TFunction } from "next-i18next";

const getCollectionSubtreeIds = (collections: any[] = [], rootId: number) => {
  const byParent = new Map<number, number[]>();

  for (const collection of collections) {
    if (collection?.id == null || collection?.parentId == null) continue;
    const siblings = byParent.get(collection.parentId) ?? [];
    siblings.push(collection.id);
    byParent.set(collection.parentId, siblings);
  }

  const visited = new Set<number>([rootId]);
  const stack = [rootId];

  while (stack.length) {
    const currentId = stack.pop() as number;
    const children = byParent.get(currentId) ?? [];

    for (const childId of children) {
      if (visited.has(childId)) continue;
      visited.add(childId);
      stack.push(childId);
    }
  }

  return Array.from(visited);
};

const removeCollectionsFromDashboard = (
  oldData: any,
  collectionIds: number[]
) => {
  if (!oldData) return oldData;

  const deletedCollectionIds = new Set(collectionIds);
  const nextLinks =
    oldData.links?.filter(
      (link: any) => !deletedCollectionIds.has(link.collectionId)
    ) || [];

  const nextCollectionLinks = oldData.collectionLinks
    ? Object.fromEntries(
        Object.entries(oldData.collectionLinks)
          .filter(
            ([collectionId]) => !deletedCollectionIds.has(Number(collectionId))
          )
          .map(([collectionId, links]) => [
            collectionId,
            (links as any[]).filter(
              (link) => !deletedCollectionIds.has(link.collectionId)
            ),
          ])
      )
    : oldData.collectionLinks;

  return {
    ...oldData,
    links: nextLinks,
    collectionLinks: nextCollectionLinks,
    numberOfPinnedLinks:
      nextLinks.filter(
        (link: any) =>
          link.isPinned || (link.pinnedBy && link.pinnedBy.length > 0)
      ).length || 0,
  };
};

const useCollections = (auth?: MobileAuth) => {
  let status: "loading" | "authenticated" | "unauthenticated";

  if (!auth) {
    const session = useSession();
    status = session.status;
  } else {
    status = auth?.status;
  }

  return useQuery({
    queryKey: ["collections"],
    queryFn: async (): Promise<CollectionIncludingMembersAndLinkCount[]> => {
      const response = await fetch(
        (auth?.instance ? auth?.instance : "") + "/api/v1/collections",
        auth?.session
          ? {
              headers: {
                Authorization: `Bearer ${auth.session}`,
              },
            }
          : undefined
      );
      const data = await response.json();

      if (Array.isArray(data.response)) return data.response;
      else return [];
    },
    enabled: status === "authenticated",
  });
};

const useCreateCollection = (auth?: MobileAuth) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (body: any) => {
      const response = await fetch(
        (auth?.instance ? auth?.instance : "") + "/api/v1/collections",
        {
          body: JSON.stringify(body),
          headers: {
            "Content-Type": "application/json",
            ...(auth?.session
              ? { Authorization: `Bearer ${auth.session}` }
              : {}),
          },
          method: "POST",
        }
      );

      const data = await response.json();

      if (!response.ok) throw new Error(data.response);

      return data.response;
    },
    onSuccess: (data) => {
      return queryClient.setQueryData(["collections"], (oldData: any) => {
        return [...oldData, data];
      });
    },
  });
};

const useUpdateCollection = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (body: any) => {
      const response = await fetch(`/api/v1/collections/${body.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.response);

      return data.response;
    },
    onSuccess: (data) => {
      {
        return queryClient.setQueryData(["collections"], (oldData: any) => {
          return oldData.map((collection: any) =>
            collection.id === data.id ? data : collection
          );
        });
      }
    },
    // onMutate: async (data) => {
    //   await queryClient.cancelQueries({ queryKey: ["collections"] });
    //   queryClient.setQueryData(["collections"], (oldData: any) => {
    //     return oldData.map((collection: any) =>
    //         collection.id === data.id ? data : collection
    //       )
    //   });
    // },
  });
};

const useDeleteCollection = ({
  auth,
  Alert,
  toast,
  t,
}: {
  auth?: MobileAuth;
  Alert?: any;
  toast?: typeof toaster;
  t?: TFunction;
}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(
        (auth?.instance ? auth?.instance : "") + `/api/v1/collections/${id}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            ...(auth?.session
              ? { Authorization: `Bearer ${auth.session}` }
              : {}),
          },
        }
      );

      const data = await response.json();

      if (!response.ok) throw new Error(data.response);

      return data.response;
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["collections"] });
      await queryClient.cancelQueries({ queryKey: ["dashboardData"] });

      const previousCollections =
        (queryClient.getQueryData(["collections"]) as any[]) ?? [];
      const previousDashboard = queryClient.getQueryData(["dashboardData"]);
      const user = queryClient.getQueryData(["user"]) as any;
      const targetCollection = previousCollections.find(
        (collection: any) => collection.id === id
      );
      const isOwner = Boolean(
        targetCollection?.ownerId != null &&
          user?.id != null &&
          targetCollection.ownerId === user.id
      );
      const collectionIdsToRemove = isOwner
        ? getCollectionSubtreeIds(previousCollections, id)
        : [id];
      const deletedCollectionIds = new Set(collectionIdsToRemove);

      queryClient.setQueryData(["collections"], (oldData: any) => {
        return oldData?.filter(
          (collection: any) => !deletedCollectionIds.has(collection.id)
        );
      });

      queryClient.setQueryData(["dashboardData"], (oldData: any) => {
        return removeCollectionsFromDashboard(oldData, collectionIdsToRemove);
      });

      return { previousCollections, previousDashboard, collectionIdsToRemove };
    },
    onError: (error, _variables, context) => {
      if (toast && t) toast.error(t(error.message));
      else if (Alert)
        Alert.alert("Error", "There was an error deleting the collection.");

      if (!context) return;

      queryClient.setQueryData(["collections"], context.previousCollections);
      queryClient.setQueryData(["dashboardData"], context.previousDashboard);
    },
    onSuccess: (data, id, context) => {
      const collectionIdsToRemove = context?.collectionIdsToRemove ?? [id];
      const deletedCollectionIds = new Set(collectionIdsToRemove);

      queryClient.setQueryData(["collections"], (oldData: any) => {
        return oldData?.filter(
          (collection: any) => !deletedCollectionIds.has(collection.id)
        );
      });

      queryClient.setQueryData(["dashboardData"], (oldData: any) => {
        return removeCollectionsFromDashboard(oldData, collectionIdsToRemove);
      });

      queryClient.invalidateQueries({ queryKey: ["tags"] });
      queryClient.invalidateQueries({ queryKey: ["links"] });
    },
  });
};

export {
  useCollections,
  useCreateCollection,
  useUpdateCollection,
  useDeleteCollection,
};
