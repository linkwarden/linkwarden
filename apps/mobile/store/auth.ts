import { create } from "zustand";
import * as SecureStore from "expo-secure-store";
import { router } from "expo-router";
import { MobileAuth } from "@linkwarden/types";

type AuthStore = {
  auth: MobileAuth;
  signIn: (username: string, password: string, instance?: string) => void;
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
          instance: "",
          session: null,
          status: "unauthenticated",
        },
      });
    }
  },
  signIn: async (
    username,
    password,
    instance = process.env.NODE_ENV === "production"
      ? "https://cloud.linkwarden.app"
      : (process.env.EXPO_PUBLIC_LINKWARDEN_URL as string)
  ) => {
    if (process.env.EXPO_PUBLIC_SHOW_LOGS === "true")
      console.log("Signing into", instance);

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

        router.replace("/(tabs)/(dashboard)");
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
  },
  signOut: async () => {
    await SecureStore.deleteItemAsync("TOKEN");
    set({
      auth: {
        instance: "",
        session: null,
        status: "unauthenticated",
      },
    });

    router.replace("/login");
  },
}));

export default useAuthStore;
