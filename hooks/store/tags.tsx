import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { useTranslation } from "next-i18next";
import { TagIncludingLinkCount } from "@/types/global";

const useTags = () => {
  return useQuery({
    queryKey: ["tags"],
    queryFn: async () => {
      const response = await fetch("/api/v1/tags");
      if (!response.ok) throw new Error("Failed to fetch tags.");

      const data = await response.json();
      return data.response;
    },
    initialData: [],
  });
};

const useUpdateTag = () => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: async (tag: TagIncludingLinkCount) => {
      const load = toast.loading(t("applying_changes"));

      const response = await fetch(`/api/v1/tags/${tag.id}`, {
        body: JSON.stringify(tag),
        headers: {
          "Content-Type": "application/json",
        },
        method: "PUT",
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.response);

      toast.dismiss(load);

      return data.response;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["tags"], (oldData: any) =>
        oldData.map((tag: TagIncludingLinkCount) =>
          tag.id === data.id ? data : tag
        )
      );
      toast.success(t("tag_renamed"));
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
};

const useRemoveTag = () => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: async (tagId: number) => {
      const load = toast.loading(t("applying_changes"));

      const response = await fetch(`/api/v1/tags/${tagId}`, {
        method: "DELETE",
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.response);

      toast.dismiss(load);

      return data.response;
    },
    onSuccess: (data, variables) => {
      queryClient.setQueryData(["tags"], (oldData: any) =>
        oldData.filter((tag: TagIncludingLinkCount) => tag.id !== variables)
      );
      toast.success(t("tag_deleted"));
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
};

export { useTags, useUpdateTag, useRemoveTag };
