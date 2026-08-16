import { useEffect, useRef } from "react";
import { ActivityIndicator, Alert, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import useAuthStore from "@/store/auth";
import { getSessionName } from "@/lib/sessionName";

const cloudInstance = "https://cloud.linkwarden.app";

const cleanInstance = (instance: string) => instance.trim().replace(/\/+$/, "");

export default function VerifyEmail() {
  const { auth, signIn } = useAuthStore();
  const params = useLocalSearchParams<{
    token?: string;
    email?: string;
    instance?: string;
  }>();
  const started = useRef(false);

  useEffect(() => {
    if (auth.status === "loading" || started.current) return;
    started.current = true;

    if (auth.status === "authenticated") {
      router.replace("/(tabs)/dashboard");
      return;
    }

    const token = typeof params.token === "string" ? params.token : "";
    const email = typeof params.email === "string" ? params.email : "";
    const instance = cleanInstance(
      typeof params.instance === "string" &&
        /^https?:\/\//.test(params.instance)
        ? params.instance
        : cloudInstance
    );

    const verify = async () => {
      if (!token || !email) {
        router.replace("/");
        return;
      }

      try {
        const res = await fetch(`${instance}/api/v1/auth/verify-email-token`, {
          method: "POST",
          body: JSON.stringify({
            token,
            email,
            sessionName: getSessionName(),
          }),
          headers: { "Content-Type": "application/json" },
        });
        const data = await res.json().catch(() => null);

        if (!res.ok) {
          Alert.alert(
            "Error",
            data?.response || "Could not verify email. Please log in."
          );
          router.replace("/");
          return;
        }

        const success = await signIn("", "", instance, data.response.token);
        if (!success) router.replace("/");
      } catch {
        Alert.alert(
          "Network error",
          "Could not connect to the server. Please check your network configuration and try again."
        );
        router.replace("/");
      }
    };

    verify();
  }, [auth.status]);

  return (
    <View className="bg-base-100 flex-1 items-center justify-center gap-3">
      <ActivityIndicator size="large" />
      <Text className="text-base-content text-base">
        Verifying your email...
      </Text>
    </View>
  );
}
