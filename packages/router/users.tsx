import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { useTranslation } from "next-i18next";
import { useSession } from "next-auth/react";

const useUsers = () => {
  const { status } = useSession();

  return useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      const response = await fetch("/api/v1/users");
      if (!response.ok) {
        throw new Error("Failed to fetch users.");
      }

      const data = await response.json();
      return data.response;
    },
    enabled: status === "authenticated",
  });
};

const useAddUser = () => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: async (body: any) => {
      const load = toast.loading(t("creating_account"));

      const response = await fetch("/api/v1/users", {
        method: "POST",
        body: JSON.stringify(body),
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.response);

      toast.dismiss(load);

      return data.response;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["users"], (oldData: any) => [...oldData, data]);
      toast.success(t("user_created"));
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
};

const useDeleteUser = () => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: async (userId: number) => {
      const load = toast.loading(t("deleting_user"));

      const response = await fetch(`/api/v1/users/${userId}`, {
        method: "DELETE",
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.response);

      toast.dismiss(load);

      return data.response;
    },
    onSuccess: (data, variables) => {
      queryClient.setQueryData(["users"], (oldData: any) =>
        oldData.filter((user: any) => user.id !== variables)
      );
      toast.success(t("user_deleted"));
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
};

export { useUsers, useAddUser, useDeleteUser };
