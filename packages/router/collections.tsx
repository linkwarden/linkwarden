import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  CollectionIncludingMembersAndLinkCount,
  MobileAuth,
} from "@linkwarden/types";
import { useSession } from "next-auth/react";

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

const useDeleteCollection = (auth?: MobileAuth) => {
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
    onSuccess: (data, id) => {
      queryClient.setQueryData(["collections"], (oldData: any) => {
        return oldData.filter((collection: any) => collection.id !== id);
      });

      // Update dashboardData query data
      queryClient.setQueryData(["dashboardData"], (oldData: any) => {
        if (!oldData) return oldData;

        return {
          ...oldData,
          links:
            oldData.links?.filter((link: any) => link.collectionId !== id) ||
            [],
          numberOfPinnedLinks:
            oldData.links?.filter(
              (link: any) => link.collectionId !== id && link.isPinned
            ).length || 0,
        };
      });
    },
  });
};

export {
  useCollections,
  useCreateCollection,
  useUpdateCollection,
  useDeleteCollection,
};
