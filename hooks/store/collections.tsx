import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CollectionIncludingMembersAndLinkCount } from "@/types/global";
import { useTranslation } from "next-i18next";
import toast from "react-hot-toast";

const useCollections = () => {
  return useQuery({
    queryKey: ["collections"],
    queryFn: async (): Promise<CollectionIncludingMembersAndLinkCount[]> => {
      const response = await fetch("/api/v1/collections");
      const data = await response.json();
      return data.response;
    },
  });
};

const useCreateCollection = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (body: any) => {
      const load = toast.loading(t("creating"));

      const response = await fetch("/api/v1/collections", {
        body: JSON.stringify(body),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      });

      toast.dismiss(load);

      const data = await response.json();

      if (!response.ok) throw new Error(data.response);

      return data.response;
    },
    onSuccess: (data) => {
      toast.success(t("created"));
      return queryClient.setQueryData(["collections"], (oldData: any) => {
        return [...oldData, data];
      });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
};

const useUpdateCollection = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (body: any) => {
      const load = toast.loading(t("updating_collection"));

      const response = await fetch(`/api/v1/collections/${body.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      toast.dismiss(load);

      const data = await response.json();

      if (!response.ok) throw new Error(data.response);

      return data.response;
    },
    onSuccess: (data) => {
      {
        toast.success(t("updated"));
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
    onError: (error) => {
      toast.error(error.message);
    },
  });
};

const useDeleteCollection = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const load = toast.loading(t("deleting_collection"));

      const response = await fetch(`/api/v1/collections/${id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });

      toast.dismiss(load);

      const data = await response.json();

      if (!response.ok) throw new Error(data.response);

      return data.response;
    },
    onSuccess: (data) => {
      toast.success(t("deleted"));
      return queryClient.setQueryData(["collections"], (oldData: any) => {
        return oldData.filter((collection: any) => collection.id !== data.id);
      });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
};

export {
  useCollections,
  useCreateCollection,
  useUpdateCollection,
  useDeleteCollection,
};
