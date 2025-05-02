import { MobileAuth } from "@linkwarden/types";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";

const useUser = (auth?: MobileAuth) => {
  let status: "authenticated" | "loading" | "unauthenticated";
  let userId: string = "";

  if (!auth) {
    const { data, status: s } = useSession();
    status = s;
    userId = (data?.user as any)?.id;
  } else {
    status = auth.status;
  }

  const url =
    (auth?.instance ? auth?.instance : "") +
    "/api/v1/users" +
    (userId ? `/${userId}` : "");

  return useQuery({
    queryKey: ["user"],
    queryFn: async () => {
      const response = await fetch(
        url,
        auth?.session
          ? {
              headers: {
                Authorization: `Bearer ${auth.session}`,
              },
            }
          : undefined
      );

      if (!response.ok) throw new Error("Failed to fetch user data.");

      const data = await response.json();

      return data.response;
    },
    enabled: !auth
      ? !!userId && status === "authenticated"
      : status === "authenticated",
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
