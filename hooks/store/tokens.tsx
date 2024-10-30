import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AccessToken } from "@prisma/client";
import { useSession } from "next-auth/react";

const useTokens = () => {
  const { status } = useSession();

  return useQuery({
    queryKey: ["tokens"],
    queryFn: async () => {
      const response = await fetch("/api/v1/tokens");

      if (!response.ok) throw new Error("Failed to fetch tokens.");

      const data = await response.json();
      return data.response as AccessToken[];
    },
    enabled: status === "authenticated",
  });
};

const useAddToken = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (body: Partial<AccessToken>) => {
      const response = await fetch("/api/v1/tokens", {
        body: JSON.stringify(body),
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.response);

      return data.response;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["tokens"], (oldData: AccessToken[]) => [
        ...oldData,
        data.token,
      ]);
    },
  });
};

const useRevokeToken = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (tokenId: number) => {
      const response = await fetch(`/api/v1/tokens/${tokenId}`, {
        method: "DELETE",
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.response);

      return data.response;
    },
    onSuccess: (data, variables) => {
      queryClient.setQueryData(["tokens"], (oldData: AccessToken[]) =>
        oldData.filter((token: Partial<AccessToken>) => token.id !== variables)
      );
    },
  });
};

export { useTokens, useAddToken, useRevokeToken };
