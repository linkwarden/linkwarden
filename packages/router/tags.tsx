import {
  useQuery,
  useMutation,
  useQueryClient,
  UseQueryResult,
} from "@tanstack/react-query";
import { MobileAuth, TagIncludingLinkCount } from "@linkwarden/types";
import { useSession } from "next-auth/react";
import { Tag } from "@linkwarden/prisma/client";
import { ArchivalTagOption } from "@linkwarden/types/inputSelect";
import { TagBulkDeletionSchemaType } from "@linkwarden/lib/schemaValidation";

const useTags = (auth?: MobileAuth): UseQueryResult<Tag[], Error> => {
  let status: "loading" | "authenticated" | "unauthenticated";

  if (!auth) {
    const session = useSession();
    status = session.status;
  } else {
    status = auth?.status;
  }

  return useQuery({
    queryKey: ["tags"],
    queryFn: async () => {
      const response = await fetch(
        (auth?.instance ? auth?.instance : "") + "/api/v1/tags",
        auth?.session
          ? {
              headers: {
                Authorization: `Bearer ${auth.session}`,
              },
            }
          : undefined
      );
      if (!response.ok) throw new Error("Failed to fetch tags.");

      const data = await response.json();
      return data.response;
    },
    enabled: status === "authenticated",
  });
};

const useUpdateTag = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (tag: TagIncludingLinkCount) => {
      const response = await fetch(`/api/v1/tags/${tag.id}`, {
        body: JSON.stringify(tag),
        headers: {
          "Content-Type": "application/json",
        },
        method: "PUT",
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.response);

      return data.response;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["tags"], (oldData: any) =>
        oldData.map((tag: TagIncludingLinkCount) =>
          tag.id === data.id ? data : tag
        )
      );
    },
  });
};

const useUpsertTags = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (tags: ArchivalTagOption[]) => {
      const response = await fetch("/api/v1/tags", {
        body: JSON.stringify({ tags }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.response);

      return data.response;
    },
    onSuccess: (data: TagIncludingLinkCount[]) => {
      queryClient.setQueryData(
        ["tags"],
        (oldData: TagIncludingLinkCount[] = []) => {
          const updatedTags = oldData.map((tag) => {
            const updatedTag = data.find((t) => t.id === tag.id);
            return updatedTag ? { ...tag, ...updatedTag } : tag;
          });

          const newTags = data.filter(
            (t) => !oldData.some((tag) => tag.id === t.id)
          );

          return [...updatedTags, ...newTags];
        }
      );
    },
  });
};

const useRemoveTag = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (tagId: number) => {
      const response = await fetch(`/api/v1/tags/${tagId}`, {
        method: "DELETE",
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.response);

      return data.response;
    },
    onSuccess: (data, variables) => {
      queryClient.setQueryData(["tags"], (oldData: any) =>
        oldData.filter((tag: TagIncludingLinkCount) => tag.id !== variables)
      );
    },
  });
};

const useBulkTagDeletion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (body: TagBulkDeletionSchemaType) => {
      const response = await fetch(`/api/v1/tags/bulk-delete`, {
        body: JSON.stringify(body),
        headers: {
          "Content-Type": "application/json",
        },
        method: "DELETE",
      });

      const responseData = await response.json();
      if (!response.ok) throw new Error(responseData.response);

      return responseData.response;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["tags"] });
      queryClient.invalidateQueries({ queryKey: ["links"] });
    },
  });
};

export {
  useTags,
  useUpdateTag,
  useUpsertTags,
  useRemoveTag,
  useBulkTagDeletion,
};
