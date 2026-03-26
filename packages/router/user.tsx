import { UpdateUserPreferenceSchemaType } from "@linkwarden/lib/schemaValidation";
import {
  DashboardSection,
  Subscription,
  User,
} from "@linkwarden/prisma/client";
import { GetUserByIdResponse, MobileAuth } from "@linkwarden/types/global";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { useEffect } from "react";

const getSystemTheme = (): "dark" | "light" => {
  if (typeof window !== "undefined" && window.matchMedia) {
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }
  return "dark";
};

const applyTheme = (theme: string) => {
  const effectiveTheme = theme === "auto" ? getSystemTheme() : theme;
  document.querySelector("html")?.setAttribute("data-theme", effectiveTheme);
};

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

      if (!response.ok) throw new Error("Failed to fetch user data.");

      const data = (await response.json()).response as GetUserByIdResponse;

      if (!auth) applyTheme(data.theme);

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
      queryClient.setQueryData(["user"], (oldData: any) => {
        return { ...oldData, ...user };
      });
    },
  });
};

const useUpdateUserPreference = () => {
  const queryClient = useQueryClient();
  const { data: session } = useSession();

  return useMutation({
    mutationFn: async (preference: UpdateUserPreferenceSchemaType) => {
      const response = await fetch(
        `/api/v1/users/${(session?.user as any)?.id}/preference`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
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
      queryClient.setQueryData(["user"], data);
      applyTheme(data.theme);
    },
    onMutate: async (user) => {
      await queryClient.cancelQueries({ queryKey: ["user"] });
      queryClient.setQueryData(["user"], (oldData: any) => {
        return { ...oldData, ...user };
      });
      if (user.theme) {
        applyTheme(user.theme);
      }
    },
  });
};

const useSystemThemeListener = () => {
  const { data: user } = useUser();

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    if (user?.theme !== "auto") return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const handleChange = () => {
      applyTheme("auto");
    };

    mediaQuery.addEventListener("change", handleChange);

    return () => {
      mediaQuery.removeEventListener("change", handleChange);
    };
  }, [user?.theme]);
};

const useEffectiveTheme = (): "light" | "dark" | undefined => {
  const { data: user } = useUser();

  if (!user?.theme) return undefined;

  if (user.theme === "auto") {
    return getSystemTheme();
  }

  return user.theme as "light" | "dark";
};

export {
  useUser,
  useUpdateUser,
  useUpdateUserPreference,
  useSystemThemeListener,
  useEffectiveTheme,
  getSystemTheme,
  applyTheme,
};
