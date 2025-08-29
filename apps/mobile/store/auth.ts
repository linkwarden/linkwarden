import { create } from "zustand";
import * as SecureStore from "expo-secure-store";
import { router } from "expo-router";
import { MobileAuth } from "@linkwarden/types";

type AuthStore = {
  auth: MobileAuth;
  signIn: (
    username: string,
    password: string,
    instance: string,
    token: string
  ) => void;
  signOut: () => void;
  setAuth: () => void;
};

const useAuthStore = create<AuthStore>((set) => ({
  auth: {
    instance: "",
    session: null,
    status: "loading",
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
      await SecureStore.setItemAsync("TOKEN", token);
      // make a request to the API to validate the token (TODO)
      router.replace("/(tabs)/dashboard");
      set({
        auth: {
          session: token,
          instance,
          status: "authenticated",
        },
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
          set({
            auth: {
              instance,
              session: null,
              status: "unauthenticated",
            },
          });
        }
      });
    }
  },
  signOut: async () => {
    await SecureStore.deleteItemAsync("TOKEN");
    const instance = await SecureStore.getItemAsync("INSTANCE");

    set({
      auth: {
        instance,
        session: null,
        status: "unauthenticated",
      },
    });

    router.replace("/login");
  },
}));

export default useAuthStore;
