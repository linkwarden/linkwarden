import {
  useQuery,
  useMutation,
  useQueryClient,
  UseQueryResult,
} from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { Highlight } from "@linkwarden/prisma/client";
import { PostHighlightSchemaType } from "@linkwarden/lib/schemaValidation";
import { MobileAuth } from "@linkwarden/types/global";

const useGetLinkHighlights = (
  linkId: number,
  auth?: MobileAuth
): UseQueryResult<Highlight[], Error> => {
  let status: "loading" | "authenticated" | "unauthenticated";

  if (!auth) {
    const session = useSession();
    status = session.status;
  } else {
    status = auth.status;
  }

  return useQuery({
    queryKey: ["highlights", linkId],
    queryFn: async () => {
      const response = await fetch(
        (auth?.instance ? auth.instance : "") +
          `/api/v1/links/${linkId}/highlights`,
        auth?.session
          ? {
              headers: {
                Authorization: `Bearer ${auth.session}`,
              },
            }
          : undefined
      );
      if (!response.ok) throw new Error("Failed to fetch highlights.");

      const data = await response.json();
      return data.response as Highlight[];
    },
    enabled: status === "authenticated" && !!linkId,
  });
};

const usePostHighlight = (linkId: number, auth?: MobileAuth) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (highlight: PostHighlightSchemaType) => {
      const response = await fetch(
        (auth?.instance ? auth.instance : "") + "/api/v1/highlights",
        {
          body: JSON.stringify({ ...highlight }),
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

      return data.response as Highlight;
    },
    onSuccess: (data: Highlight) => {
      queryClient.setQueryData(
        ["highlights", data.linkId || linkId],
        (oldData: Highlight[] = []) => {
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

const useRemoveHighlight = (linkId: number, auth?: MobileAuth) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (highlightId: number) => {
      const response = await fetch(
        (auth?.instance ? auth.instance : "") +
          `/api/v1/highlights/${highlightId}`,
        {
          method: "DELETE",
          headers: {
            ...(auth?.session
              ? { Authorization: `Bearer ${auth.session}` }
              : {}),
          },
        }
      );

      const data = await response.json();
      if (!response.ok) throw new Error(data.response);

      return { highlightId: data.response as number, linkId };
    },
    onSuccess: ({ highlightId, linkId }) => {
      queryClient.setQueryData(
        ["highlights", linkId],
        (oldData: Highlight[] = []) =>
          oldData.filter((highlight) => highlight.id !== highlightId)
      );
    },
  });
};

export { useGetLinkHighlights, usePostHighlight, useRemoveHighlight };
