import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { useTranslation } from "next-i18next";
import { AccessToken } from "@prisma/client";

const useTokens = () => {
  return useQuery({
    queryKey: ["tokens"],
    queryFn: async () => {
      const response = await fetch("/api/v1/tokens");

      if (!response.ok) throw new Error("Failed to fetch tokens.");

      const data = await response.json();
      return data.response as AccessToken[];
    },
  });
};

const useAddToken = () => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: async (body: Partial<AccessToken>) => {
      const load = toast.loading(t("creating_token"));

      const response = await fetch("/api/v1/tokens", {
        body: JSON.stringify(body),
        method: "POST",
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.response);

      toast.dismiss(load);

      return data.response;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["tokens"], (oldData: AccessToken[]) => [
        ...oldData,
        data.token,
      ]);
      toast.success(t("token_added"));
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
};

const useRevokeToken = () => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: async (tokenId: number) => {
      const load = toast.loading(t("deleting"));

      const response = await fetch(`/api/v1/tokens/${tokenId}`, {
        method: "DELETE",
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.response);

      toast.dismiss(load);

      return data.response;
    },
    onSuccess: (data, variables) => {
      queryClient.setQueryData(["tokens"], (oldData: AccessToken[]) =>
        oldData.filter((token: Partial<AccessToken>) => token.id !== variables)
      );
      toast.success(t("token_revoked"));
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
};

export { useTokens, useAddToken, useRevokeToken };
