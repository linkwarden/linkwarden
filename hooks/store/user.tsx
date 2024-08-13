import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { useTranslation } from "next-i18next";
import { useSession } from "next-auth/react";

const useUser = () => {
  const { data } = useSession();

  const userId = data?.user.id;

  return useQuery({
    queryKey: ["user"],
    queryFn: async () => {
      const response = await fetch(`/api/v1/users/${userId}`);
      if (!response.ok) throw new Error("Failed to fetch user data.");

      const data = await response.json();

      return data.response;
    },
    enabled: !!userId,
    placeholderData: {},
  });
};

const useUpdateUser = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (user: any) => {
      const load = toast.loading(t("applying_settings"));

      const response = await fetch(`/api/v1/users/${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(user),
      });

      const data = await response.json();

      toast.dismiss(load);

      if (!response.ok) throw new Error(data.response);

      return data;
    },
    onSuccess: (data) => {
      toast.success(t("settings_applied"));
      queryClient.setQueryData(["user"], data.response);
    },
    onMutate: async (user) => {
      await queryClient.cancelQueries({ queryKey: ["user"] });
      queryClient.setQueryData(["user"], (oldData: any) => {
        return { ...oldData, ...user };
      });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
};

export { useUser, useUpdateUser };
