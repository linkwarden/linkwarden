import { create } from "zustand";
import * as SecureStore from "expo-secure-store";
import { router } from "expo-router";
import { MobileAuth } from "@linkwarden/types";
import { Alert } from "react-native";
import * as FileSystem from "expo-file-system";
import { queryClient } from "@/lib/queryClient";
import { mmkvPersister } from "@/lib/queryPersister";
import { clearCache } from "@/lib/cache";

const CACHE_DIR = FileSystem.documentDirectory + "archivedData/";

type AuthStore = {
  auth: MobileAuth;
  signIn: (
    username: string,
    password: string,
    instance: string,
    token?: string
  ) => Promise<void>;
  signOut: () => Promise<void>;
  setAuth: () => Promise<void>;
};

const useAuthStore = create<AuthStore>((set) => ({
  auth: {
    instance: "",
    session: null,
    status: "loading" as const,
  },
  setAuth: async () => {
    const session = await SecureStore.getItemAsync("TOKEN");
    const instance = await SecureStore.getItemAsync("INSTANCE");

    if (session) {
      set({
        auth: {
          instance,
          session,
          status: "authenticated",
        },
      });
    } else {
      set({
        auth: {
          instance: instance || "https://cloud.linkwarden.app",
          session: null,
          status: "unauthenticated",
        },
      });
    }
  },
  signIn: async (username, password, instance, token) => {
    if (process.env.EXPO_PUBLIC_SHOW_LOGS === "true")
      console.log("Signing into", instance);

    if (token) {
      // make a request to the API to validate the token
      await fetch(instance + "/api/v1/users/me", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }).then(async (res) => {
        if (res.ok) {
          await SecureStore.setItemAsync("INSTANCE", instance);
          await SecureStore.setItemAsync("TOKEN", token);
          set({
            auth: {
              session: token,
              instance,
              status: "authenticated",
            },
          });
          router.replace("/(tabs)/dashboard");
        } else {
          Alert.alert("Error", "Invalid token");
        }
      });
    } else {
      await fetch(instance + "/api/v1/session", {
        method: "POST",
        body: JSON.stringify({ username, password }),
        headers: {
          "Content-Type": "application/json",
        },
      }).then(async (res) => {
        if (res.ok) {
          const data = await res.json();
          const session = (data as any).response.token;
          await SecureStore.setItemAsync("TOKEN", session);
          await SecureStore.setItemAsync("INSTANCE", instance);
          set({
            auth: {
              session,
              instance,
              status: "authenticated",
            },
          });

          router.replace("/(tabs)/dashboard");
        } else {
          Alert.alert("Error", "Invalid credentials");
        }
      });
    }
  },
  signOut: async () => {
    await SecureStore.deleteItemAsync("TOKEN");
    await SecureStore.deleteItemAsync("INSTANCE");

    queryClient.cancelQueries();
    queryClient.clear();
    mmkvPersister.removeClient?.();

    await clearCache();

    set({
      auth: {
        instance: "",
        session: null,
        status: "unauthenticated",
      },
    });

    router.replace("/");
  },
}));

export default useAuthStore;
