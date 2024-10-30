import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";

const useUser = () => {
  const { data, status } = useSession();

  const userId = data?.user.id;

  return useQuery({
    queryKey: ["user"],
    queryFn: async () => {
      const response = await fetch(`/api/v1/users/${userId}`);
      if (!response.ok) throw new Error("Failed to fetch user data.");

      const data = await response.json();

      return data.response;
    },
    enabled: !!userId && status === "authenticated",
    placeholderData: {},
  });
};

const useUpdateUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (user: any) => {
      const response = await fetch(`/api/v1/users/${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(user),
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.response);

      return data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["user"], data.response);
    },
    onMutate: async (user) => {
      await queryClient.cancelQueries({ queryKey: ["user"] });
      queryClient.setQueryData(["user"], (oldData: any) => {
        return { ...oldData, ...user };
      });
    },
  });
};

export { useUser, useUpdateUser };
