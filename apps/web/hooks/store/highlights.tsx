import {
  useQuery,
  useMutation,
  useQueryClient,
  UseQueryResult,
} from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { Highlight } from "@linkwarden/prisma/client";
import { PostHighlightSchemaType } from "@/lib/shared/schemaValidation";

const useGetLinkHighlights = (
  linkId: number
): UseQueryResult<Highlight[], Error> => {
  const { status } = useSession();

  return useQuery({
    queryKey: ["highlights", linkId],
    queryFn: async () => {
      const response = await fetch(`/api/v1/links/${linkId}/highlights`);
      if (!response.ok) throw new Error("Failed to fetch highlights.");

      const data = await response.json();
      return data.response;
    },
    enabled: status === "authenticated",
  });
};

const usePostHighlight = (linkId: number) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (highlight: PostHighlightSchemaType) => {
      const response = await fetch("/api/v1/highlights", {
        body: JSON.stringify({ ...highlight }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.response);

      return data.response;
    },
    onSuccess: (data: Highlight) => {
      queryClient.setQueryData(
        ["highlights", linkId],
        (oldData: Highlight[]) => {
          const index = oldData.findIndex((h) => h?.id === data?.id);
          if (index !== -1) {
            const newData = [...oldData];
            newData[index] = data;
            return newData;
          } else {
            return [...oldData, data];
          }
        }
      );
    },
  });
};

const useRemoveHighlight = (linkId: number) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (highlightId: number) => {
      const response = await fetch(`/api/v1/highlights/${highlightId}`, {
        method: "DELETE",
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.response);

      return data.response;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["highlights", linkId], (oldData: any) =>
        oldData.filter((highlight: Highlight) => highlight.id !== data)
      );
    },
  });
};

export { useGetLinkHighlights, usePostHighlight, useRemoveHighlight };
