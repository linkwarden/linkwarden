import { UpdateUserPreferenceSchemaType } from "@linkwarden/lib/schemaValidation";
import { resolveTheme } from "@linkwarden/lib/utils";
import { Subscription, User } from "@linkwarden/prisma/client";
import { GetUserByIdResponse, MobileAuth } from "@linkwarden/types/global";
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

  const url = auth
    ? auth?.instance + "/api/v1/users/me"
    : "/api/v1/users/" + userId;

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

      if (!response.ok)
        throw Object.assign(new Error("Failed to fetch user data."), {
          status: response.status,
        });

      const data = (await response.json()).response as GetUserByIdResponse;

      if (!auth)
        document
          .querySelector("html")
          ?.setAttribute("data-theme", resolveTheme(data.theme) || "dark");

      return data;
    },
    enabled: !auth
      ? !!userId && status === "authenticated"
      : status === "authenticated",
    placeholderData: {} as GetUserByIdResponse,
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
      const safeUser = { ...user };
      delete safeUser.password;
      delete safeUser.oldPassword;
      delete safeUser.newPassword;

      queryClient.setQueryData(["user"], (oldData: any) => {
        return { ...oldData, ...safeUser };
      });
    },
  });
};

const useUpdateUserPreference = (auth?: MobileAuth) => {
  const queryClient = useQueryClient();
  const { data: session } = auth ? { data: null } : useSession();

  return useMutation({
    mutationFn: async (preference: UpdateUserPreferenceSchemaType) => {
      const userId = auth
        ? queryClient.getQueryData<GetUserByIdResponse>(["user"])?.id
        : (session?.user as any)?.id;

      const response = await fetch(
        (auth ? auth.instance : "") + `/api/v1/users/${userId}/preference`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            ...(auth?.session
              ? { Authorization: `Bearer ${auth.session}` }
              : {}),
          },
          body: JSON.stringify(preference),
        }
      );

      const data = await response.json();

      if (!response.ok) throw new Error(data.response);

      return data.response as Omit<User, "password"> &
        Partial<{ subscription: Subscription }> & {
          parentSubscription: {
            active: boolean | undefined;
            user: {
              email: string | null | undefined;
            };
          };
        };
    },
    onSuccess: (data) => {
      // Merged, since this response leaves out fields like hasPassword
      queryClient.setQueryData(["user"], (oldData: any) => ({
        ...oldData,
        ...data,
      }));

      if (!auth)
        document
          .querySelector("html")
          ?.setAttribute("data-theme", resolveTheme(data.theme) || "dark");
    },
    onMutate: async (user) => {
      await queryClient.cancelQueries({ queryKey: ["user"] });

      const previousShareUsageAnalytics = queryClient.getQueryData<any>([
        "user",
      ])?.shareUsageAnalytics;

      queryClient.setQueryData(["user"], (oldData: any) => {
        return { ...oldData, ...user };
      });

      return { previousShareUsageAnalytics };
    },
    // A failed save of "Share usage analytics" shows the value the server
    // still has, so the setting never looks off while the account still
    // shares. Other preferences, like the theme, keep the new value for the
    // session, which is all a read-only demo instance can do.
    onError: (error, user, context) => {
      if (user.shareUsageAnalytics === undefined) return;

      queryClient.setQueryData(["user"], (oldData: any) => ({
        ...oldData,
        shareUsageAnalytics: context?.previousShareUsageAnalytics,
      }));
    },
  });
};

// Another user's public profile, e.g. the owner of a collection shared with you.
const usePublicUser = (id?: number) => {
  return useQuery({
    queryKey: ["publicUser", id],
    queryFn: async (): Promise<
      Pick<User, "id" | "name" | "username" | "image">
    > => {
      const response = await fetch(`/api/v1/public/users/${id}`);

      const data = await response.json();

      if (!response.ok) throw new Error(data.response);

      return data.response;
    },
    enabled: !!id,
    staleTime: Infinity,
  });
};

export { useUser, useUpdateUser, useUpdateUserPreference, usePublicUser };
