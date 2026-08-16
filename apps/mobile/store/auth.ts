import { create } from "zustand";
import * as SecureStore from "expo-secure-store";
import * as AppleAuthentication from "expo-apple-authentication";
import {
  GoogleSignin,
  isCancelledResponse,
  statusCodes,
} from "@react-native-google-signin/google-signin";
import { router } from "expo-router";
import type { GetUserByIdResponse, MobileAuth } from "@linkwarden/types/global";
import type { Config } from "@linkwarden/router/config";
import { Alert } from "react-native";
import { SheetManager } from "react-native-actions-sheet";
import { queryClient } from "@/lib/queryClient";
import { queryPersister } from "@/lib/queryPersister";
import { clearCache } from "@/lib/cache";
import useDataStore from "@/store/data";
import { markWhatsNewSeen } from "@/lib/whatsNew";
import { useOfflineSyncStore } from "@/lib/offlineSync";
import { hasInactiveSubscription } from "@/lib/subscription";
import { ensureCloudIsReachable } from "@/lib/ensureCloudIsReachable";
import { loadCustomHeaders, setCustomHeaders } from "@/lib/customHeaders";
import { getSessionName } from "@/lib/sessionName";

const cloudInstance = "https://cloud.linkwarden.app";
const cloudConfig: Config = {
  DISABLE_REGISTRATION: null,
  ADMIN: null,
  RSS_POLLING_INTERVAL_MINUTES: null,
  EMAIL_PROVIDER: true,
  MAX_FILE_BUFFER: null,
  USER_CONTENT_DOMAIN: null,
  AI_ENABLED: null,
  INSTANCE_VERSION: null,
  STRIPE_ENABLED: null,
  TRIAL_PERIOD_DAYS: null,
  REQUIRE_CC: null,
};
const googleWebClientId =
  process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ??
  "1097450926817-fb426eh4dkq46gmhiuoa00k6rv196g1s.apps.googleusercontent.com";
const googleIosClientId =
  process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ??
  "1097450926817-o94t2bb30jt2me2u17ni2cc2qogd2v34.apps.googleusercontent.com";

GoogleSignin.configure({
  webClientId: googleWebClientId,
  iosClientId: googleIosClientId,
});

type SignUpForm = {
  name: string;
  username?: string;
  email?: string;
  password: string;
  instance: string;
  acceptPromotionalEmails?: boolean;
};

type InstanceLogins = {
  buttonAuths?: {
    method?: string;
  }[];
};

type InstanceInfo = {
  instance: string;
  config: Config | null;
  logins: InstanceLogins | null;
  status: "idle" | "loading" | "success" | "error";
  error: string;
};

type AuthStore = {
  auth: MobileAuth;
  instanceInfo: InstanceInfo;
  signIn: (
    username: string,
    password: string,
    instance: string,
    token?: string
  ) => Promise<boolean>;
  signInWithApple: (instance: string) => Promise<void>;
  signInWithGoogle: (instance: string) => Promise<void>;
  signUp: (form: SignUpForm) => Promise<boolean>;
  requestVerificationEmail: (
    email: string,
    instance: string
  ) => Promise<boolean>;
  setInstance: (instance: string, config?: Config) => Promise<void>;
  fetchInstanceInfo: (instance?: string, config?: Config) => Promise<void>;
  signOut: () => Promise<void>;
  setAuth: () => Promise<void>;
};

const cleanInstance = (instance?: string | null) =>
  (instance || cloudInstance).trim().replace(/\/+$/, "");

const markWhatsNewSeenForNewUser = () => markWhatsNewSeen();

const getFallbackConfig = (instance: string) =>
  instance === cloudInstance ? cloudConfig : null;

const timeout = () =>
  new Promise<Response>((_, reject) =>
    setTimeout(() => reject(new Error("TIMEOUT")), 30000)
  );

const fetchInstanceConfig = async (instance: string) => {
  const res = await Promise.race([
    fetch(`${instance}/api/v1/config`),
    timeout(),
  ]);
  const data = await res.json().catch(() => null);

  if (!res.ok || !data?.response) throw new Error("CONFIG");

  return data.response as Config;
};

const fetchInstanceLogins = async (instance: string) => {
  const res = await Promise.race([
    fetch(`${instance}/api/v1/logins`),
    timeout(),
  ]);
  const data = await res.json().catch(() => null);

  if (!res.ok) throw new Error("LOGINS");

  return data as InstanceLogins;
};

const getPostAuthRoute = async (instance: string, session: string) => {
  try {
    const headers = { Authorization: `Bearer ${session}` };
    const [configRes, userRes] = await Promise.all([
      Promise.race([
        fetch(`${instance}/api/v1/config`, { headers }),
        timeout(),
      ]),
      Promise.race([
        fetch(`${instance}/api/v1/users/me`, { headers }),
        timeout(),
      ]),
    ]);

    if (!configRes.ok || !userRes.ok) return "/(tabs)/dashboard";

    const config = ((await configRes.json())?.response ??
      null) as Config | null;
    const user = ((await userRes.json())?.response ??
      null) as GetUserByIdResponse | null;

    return hasInactiveSubscription(user, config)
      ? "/subscribe"
      : "/(tabs)/dashboard";
  } catch {
    return "/(tabs)/dashboard";
  }
};

const requestVerificationEmail = async (email: string, instance: string) => {
  try {
    const res = await Promise.race([
      fetch(`${instance}/api/v1/auth/request-verification-email`, {
        method: "POST",
        body: JSON.stringify({ email }),
        headers: { "Content-Type": "application/json" },
      }),
      timeout(),
    ]);
    const data = await res.json().catch(() => null);

    if (res.ok) return true;

    Alert.alert("Error", data?.response || "Could not send verification email");
    return false;
  } catch (err: any) {
    Alert.alert(
      err?.message === "TIMEOUT" ? "Request timed out" : "Network error",
      err?.message === "TIMEOUT"
        ? "Unable to reach the server in time. Please check your network configuration and try again."
        : "Could not connect to the server. Please check your network configuration and try again."
    );
    return false;
  }
};

const useAuthStore = create<AuthStore>((set, get) => ({
  auth: {
    instance: "",
    session: null,
    status: "loading" as const,
  },
  instanceInfo: {
    instance: "",
    config: null,
    logins: null,
    status: "idle",
    error: "",
  },
  setAuth: async () => {
    await loadCustomHeaders();
    const session = await SecureStore.getItemAsync("TOKEN");
    const instance = await SecureStore.getItemAsync("INSTANCE");
    const nextInstance = cleanInstance(instance);

    if (session) {
      set({
        auth: {
          instance: nextInstance,
          session,
          status: "authenticated",
        },
      });
    } else {
      set({
        auth: {
          instance: nextInstance,
          session: null,
          status: "unauthenticated",
        },
      });
    }

    get().fetchInstanceInfo(nextInstance);
  },
  requestVerificationEmail,
  setInstance: async (instance, config) => {
    const nextInstance = cleanInstance(instance);

    if (nextInstance === cloudInstance)
      await setCustomHeaders(nextInstance, []);

    await SecureStore.setItemAsync("INSTANCE", nextInstance);
    set((state) => ({
      auth: {
        ...state.auth,
        instance: nextInstance,
      },
    }));

    get().fetchInstanceInfo(nextInstance, config);
  },
  fetchInstanceInfo: async (nextInstance, config) => {
    const instance = cleanInstance(nextInstance || get().auth.instance);
    const current = get().instanceInfo;
    const currentConfig =
      config ??
      (current.instance === instance
        ? current.config
        : getFallbackConfig(instance));
    const currentLogins = current.instance === instance ? current.logins : null;

    if (
      !config &&
      current.instance === instance &&
      (current.status === "loading" || current.status === "success")
    ) {
      return;
    }

    set({
      instanceInfo: {
        instance,
        config: currentConfig,
        logins: currentLogins,
        status: "loading",
        error: "",
      },
    });

    const [configResult, loginsResult] = await Promise.allSettled([
      config ? Promise.resolve(config) : fetchInstanceConfig(instance),
      fetchInstanceLogins(instance),
    ]);

    if (get().instanceInfo.instance !== instance) return;

    const nextConfig =
      configResult.status === "fulfilled" ? configResult.value : currentConfig;
    const nextLogins =
      loginsResult.status === "fulfilled" ? loginsResult.value : currentLogins;

    set({
      instanceInfo: {
        instance,
        config: nextConfig,
        logins: nextLogins,
        status: nextConfig ? "success" : "error",
        error: nextConfig ? "" : "Could not load this instance.",
      },
    });
  },
  signUp: async ({
    name,
    username,
    email,
    password,
    instance,
    acceptPromotionalEmails = false,
  }) => {
    if (!(await ensureCloudIsReachable(instance))) return false;

    try {
      const res = await Promise.race([
        fetch(`${instance}/api/v1/users`, {
          method: "POST",
          body: JSON.stringify({
            name,
            username,
            email,
            password,
            acceptPromotionalEmails,
          }),
          headers: { "Content-Type": "application/json" },
        }),
        timeout(),
      ]);
      const data = await res.json().catch(() => null);

      if (res.ok) {
        return email ? await requestVerificationEmail(email, instance) : true;
      }

      Alert.alert("Error", data?.response || "Could not create account");
      return false;
    } catch (err: any) {
      Alert.alert(
        err?.message === "TIMEOUT" ? "Request timed out" : "Network error",
        err?.message === "TIMEOUT"
          ? "Unable to reach the server in time. Please check your network configuration and try again."
          : "Could not connect to the server. Please check your network configuration and try again."
      );
      return false;
    }
  },
  signIn: async (username, password, instance, token) => {
    if (process.env.EXPO_PUBLIC_SHOW_LOGS === "true")
      console.log("Signing into", instance);

    if (!(await ensureCloudIsReachable(instance))) return false;

    if (token) {
      try {
        // make a request to the API to validate the token
        const res = await Promise.race([
          fetch(instance + "/api/v1/users/me", {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }),
          new Promise<Response>((_, reject) =>
            setTimeout(() => reject(new Error("TIMEOUT")), 30000)
          ),
        ]);

        if (res.ok) {
          const route = await getPostAuthRoute(instance, token);

          await SecureStore.setItemAsync("INSTANCE", instance);
          await SecureStore.setItemAsync("TOKEN", token);
          set({
            auth: {
              session: token,
              instance,
              status: "authenticated",
            },
          });
          markWhatsNewSeenForNewUser();
          router.replace(route);
          return true;
        } else {
          Alert.alert("Error", "Invalid token");
          return false;
        }
      } catch (err: any) {
        if (err?.message === "TIMEOUT") {
          Alert.alert(
            "Request timed out",
            "Unable to reach the server in time. Please check your network configuration and try again."
          );
        } else {
          Alert.alert(
            "Network error",
            "Could not connect to the server. Please check your network configuration and try again."
          );
        }
        return false;
      }
    } else {
      try {
        const res = await Promise.race([
          fetch(`${instance}/api/v1/session`, {
            method: "POST",
            body: JSON.stringify({
              username,
              password,
              sessionName: getSessionName(),
            }),
            headers: { "Content-Type": "application/json" },
          }),
          new Promise<Response>((_, reject) =>
            setTimeout(() => reject(new Error("TIMEOUT")), 30000)
          ),
        ]);

        const data = await res.json().catch(() => null);

        if (res.ok) {
          const session = (data as any).response.token;
          const route = await getPostAuthRoute(instance, session);

          await SecureStore.setItemAsync("TOKEN", session);
          await SecureStore.setItemAsync("INSTANCE", instance);
          set({ auth: { session, instance, status: "authenticated" } });
          markWhatsNewSeenForNewUser();
          router.replace(route);
          return true;
        } else if (data?.code === "EMAIL_NOT_VERIFIED") {
          await SheetManager.hide("login-sheet");
          SheetManager.show("verify-email-sheet", {
            payload: { email: data?.email || username, instance },
            context: "global",
          });
          return false;
        } else {
          Alert.alert("Error", "Invalid credentials");
          return false;
        }
      } catch (err: any) {
        if (err?.message === "TIMEOUT") {
          Alert.alert(
            "Request timed out",
            "Unable to reach the server in time. Please check your network configuration and try again."
          );
        } else {
          Alert.alert(
            "Network error",
            "Could not connect to the server. Please check your network configuration and try again."
          );
        }
        return false;
      }
    }
  },
  signInWithApple: async (instance) => {
    if (!(await ensureCloudIsReachable(instance))) return;

    let credential: AppleAuthentication.AppleAuthenticationCredential;
    try {
      credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });
    } catch (err: any) {
      if (err?.code === "ERR_REQUEST_CANCELED") return;
      Alert.alert("Error", "Could not sign in with Apple.");
      return;
    }

    if (!credential.identityToken) {
      Alert.alert("Error", "Apple did not return an identity token.");
      return;
    }

    const name = [
      credential.fullName?.givenName,
      credential.fullName?.familyName,
    ]
      .filter(Boolean)
      .join(" ")
      .trim();

    try {
      const res = await Promise.race([
        fetch(`${instance}/api/v1/auth/mobile/apple`, {
          method: "POST",
          body: JSON.stringify({
            identityToken: credential.identityToken,
            name: name || undefined,
            sessionName: getSessionName(),
          }),
          headers: { "Content-Type": "application/json" },
        }),
        timeout(),
      ]);
      const data = await res.json().catch(() => null);

      if (res.ok) {
        const session = data.response.token;
        const route = await getPostAuthRoute(instance, session);

        await SecureStore.setItemAsync("TOKEN", session);
        await SecureStore.setItemAsync("INSTANCE", instance);
        set({ auth: { session, instance, status: "authenticated" } });
        markWhatsNewSeenForNewUser();
        router.replace(route);
      } else {
        Alert.alert("Error", data?.response || "Could not sign in with Apple.");
      }
    } catch (err: any) {
      Alert.alert(
        err?.message === "TIMEOUT" ? "Request timed out" : "Network error",
        err?.message === "TIMEOUT"
          ? "Unable to reach the server in time. Please check your network configuration and try again."
          : "Could not connect to the server. Please check your network configuration and try again."
      );
    }
  },
  signInWithGoogle: async (instance) => {
    if (!(await ensureCloudIsReachable(instance))) return;

    let idToken: string | null = null;
    let displayName = "";

    try {
      await GoogleSignin.hasPlayServices();
      await GoogleSignin.signOut();
      const response = await GoogleSignin.signIn();
      if (isCancelledResponse(response)) return;
      idToken = response.data?.idToken ?? null;
      displayName = response.data?.user?.name ?? "";
    } catch (err: any) {
      if (
        err?.code === statusCodes.SIGN_IN_CANCELLED ||
        err?.code === statusCodes.IN_PROGRESS
      )
        return;
      console.log("Google sign-in error:", err?.code, err?.message, err);
      Alert.alert(
        "Error",
        `Could not sign in with Google. ${err?.code ?? ""} ${
          err?.message ?? ""
        }`
      );
      return;
    }

    if (!idToken) {
      Alert.alert("Error", "Google did not return an identity token.");
      return;
    }

    try {
      const res = await Promise.race([
        fetch(`${instance}/api/v1/auth/mobile/google`, {
          method: "POST",
          body: JSON.stringify({
            identityToken: idToken,
            name: displayName || undefined,
            sessionName: getSessionName(),
          }),
          headers: { "Content-Type": "application/json" },
        }),
        timeout(),
      ]);
      const data = await res.json().catch(() => null);

      if (res.ok) {
        const session = data.response.token;
        const route = await getPostAuthRoute(instance, session);

        await SecureStore.setItemAsync("TOKEN", session);
        await SecureStore.setItemAsync("INSTANCE", instance);
        set({ auth: { session, instance, status: "authenticated" } });
        markWhatsNewSeenForNewUser();
        router.replace(route);
      } else {
        Alert.alert(
          "Error",
          data?.response || "Could not sign in with Google."
        );
      }
    } catch (err: any) {
      Alert.alert(
        err?.message === "TIMEOUT" ? "Request timed out" : "Network error",
        err?.message === "TIMEOUT"
          ? "Unable to reach the server in time. Please check your network configuration and try again."
          : "Could not connect to the server. Please check your network configuration and try again."
      );
    }
  },
  signOut: async () => {
    const instance = await SecureStore.getItemAsync("INSTANCE");
    const nextInstance = cleanInstance(instance);

    await SecureStore.deleteItemAsync("TOKEN");

    queryClient.cancelQueries();
    queryClient.clear();
    await queryPersister.removeClient?.();

    await clearCache();

    useDataStore.getState().updateData({ offlineEnabled: false });
    useOfflineSyncStore.getState().reset();

    set({
      auth: {
        instance: nextInstance,
        session: null,
        status: "unauthenticated",
      },
    });

    get().fetchInstanceInfo(nextInstance);

    router.replace("/");
  },
}));

export default useAuthStore;
