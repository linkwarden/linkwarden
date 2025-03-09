import {
  useQuery,
  useMutation,
  useQueryClient,
  UseQueryResult,
} from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { Highlight } from "@prisma/client";
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

const useUpdateHighlight = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (highlight: Highlight) => {
      const response = await fetch(`/api/v1/highlights/${highlight.id}`, {
        body: JSON.stringify(highlight),
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
      queryClient.setQueryData(["highlights"], (oldData: any) =>
        oldData.map((highlight: Highlight) =>
          highlight.id === data.id ? data : highlight
        )
      );
    },
  });
};

const usePostHighlight = () => {
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
    onSuccess: (data: Highlight[]) => {
      queryClient.setQueryData(["highlights"], (oldData: Highlight[] = []) => {
        const updatedHighlights = oldData.map((highlight) => {
          const updatedHighlight = data.find((t) => t.id === highlight.id);
          return updatedHighlight
            ? { ...highlight, ...updatedHighlight }
            : highlight;
        });

        const newHighlights = data.filter(
          (t) => !oldData.some((highlight) => highlight.id === t.id)
        );

        return [...updatedHighlights, ...newHighlights];
      });
    },
  });
};

const useRemoveHighlight = () => {
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
    onSuccess: (data, variables) => {
      queryClient.setQueryData(["highlights"], (oldData: any) =>
        oldData.filter((highlight: Highlight) => highlight.id !== variables)
      );
    },
  });
};

export {
  useGetLinkHighlights,
  useUpdateHighlight,
  usePostHighlight,
  useRemoveHighlight,
};
