import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CollectionIncludingMembersAndLinkCount } from "@/types/global";
import { useSession } from "next-auth/react";

const useCollections = () => {
  const { status } = useSession();

  return useQuery({
    queryKey: ["collections"],
    queryFn: async (): Promise<CollectionIncludingMembersAndLinkCount[]> => {
      const response = await fetch("/api/v1/collections");
      const data = await response.json();
      return data.response;
    },
    enabled: status === "authenticated",
  });
};

const useCreateCollection = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (body: any) => {
      const response = await fetch("/api/v1/collections", {
        body: JSON.stringify(body),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      });

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

const useDeleteCollection = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/v1/collections/${id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.response);

      return data.response;
    },
    onSuccess: (data) => {
      return queryClient.setQueryData(["collections"], (oldData: any) => {
        return oldData.filter((collection: any) => collection.id !== data.id);
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
