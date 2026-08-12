import { useRouter } from "expo-router";
import {
  NativeTabs,
  Icon,
  Label,
  VectorIcon,
} from "expo-router/unstable-native-tabs";
import React, { useEffect } from "react";
import { ActivityIndicator, Platform, View } from "react-native";
import Feather from "@expo/vector-icons/Feather";
import { useColorScheme } from "nativewind";
import { rawTheme, ThemeName } from "@/lib/colors";
import useAuthStore from "@/store/auth";
import { useUser } from "@linkwarden/router/user";
import { useConfig } from "@linkwarden/router/config";
import { shouldRouteToSubscribe } from "@/lib/subscription";

const isRejectedSession = (error: unknown) =>
  (error as any)?.status === 401 || (error as any)?.status === 403;

let recoveringSession: string | null = null;

export default function TabLayout() {
  const { colorScheme } = useColorScheme();
  const router = useRouter();
  const { auth } = useAuthStore();
  const {
    data: user,
    error: userError,
    isLoading: isUserLoading,
  } = useUser(auth);
  const config = useConfig(auth);
  const routeToSubscribe = shouldRouteToSubscribe(user, config.data);
  const shouldRecover =
    auth.status === "authenticated" && isRejectedSession(userError);

  useEffect(() => {
    if (routeToSubscribe) router.replace("/subscribe");
  }, [routeToSubscribe, router]);

  useEffect(() => {
    if (!shouldRecover || !auth.session || recoveringSession === auth.session)
      return;

    recoveringSession = auth.session;
    router.replace({
      pathname: "/",
      params: {
        serverRecovery: "true",
      },
    });
  }, [auth.session, router, shouldRecover]);

  if (
    auth.status === "authenticated" &&
    (isUserLoading || config.isLoading || routeToSubscribe || shouldRecover)
  ) {
    return (
      <View className="flex-1 items-center justify-center bg-base-100">
        <ActivityIndicator
          size="large"
          color={rawTheme[colorScheme as ThemeName]["base-content"]}
        />
      </View>
    );
  }

  return (
    <NativeTabs
      labelVisibilityMode="labeled"
      tintColor={rawTheme[colorScheme as ThemeName].primary}
      backgroundColor={
        Platform.OS === "android"
          ? rawTheme[colorScheme as ThemeName]["base-200"]
          : undefined
      }
      indicatorColor={rawTheme[colorScheme as ThemeName]["neutral-content"]}
      minimizeBehavior="onScrollDown"
    >
      <NativeTabs.Trigger name="dashboard">
        <Label>Dashboard</Label>
        <Icon src={<VectorIcon family={Feather} name="home" />} />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="links">
        <Label>Links</Label>
        <Icon src={<VectorIcon family={Feather} name="link" />} />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="collections">
        <Label>Collections</Label>
        <Icon src={<VectorIcon family={Feather} name="folder" />} />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="tags">
        <Label>Tags</Label>
        <Icon src={<VectorIcon family={Feather} name="hash" />} />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="settings">
        <Label>Settings</Label>
        <Icon src={<VectorIcon family={Feather} name="settings" />} />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
