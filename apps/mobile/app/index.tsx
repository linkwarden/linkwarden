import { Button } from "@/components/ui/Button";
import { rawTheme, ThemeName } from "@/lib/colors";
import useAuthStore from "@/store/auth";
import { isAtLeastInstanceVersion } from "@linkwarden/router/config";
import { FontAwesome } from "@expo/vector-icons";
import { Redirect, useLocalSearchParams } from "expo-router";
import { ChevronDown, CircleHelp } from "lucide-react-native";
import { useColorScheme } from "nativewind";
import { useEffect } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Platform,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SheetManager } from "react-native-actions-sheet";
import Animated, { FadeIn } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { KeyboardToolbar } from "react-native-keyboard-controller";
import * as DropdownMenu from "zeego/dropdown-menu";

const cloudInstance = "https://cloud.linkwarden.app";
let signingOutRecoverySession: string | null = null;

const displayInstance = (instance: string | null | undefined) =>
  (instance || cloudInstance).replace(/^https?:\/\//, "").replace(/\/+$/, "");

export default function HomeScreen() {
  const {
    auth,
    instanceInfo,
    setInstance,
    fetchInstanceInfo,
    signInWithApple,
    signInWithGoogle,
    signOut,
  } = useAuthStore();
  const { serverRecovery } = useLocalSearchParams<{
    serverRecovery?: string;
  }>();
  const { colorScheme } = useColorScheme();
  const theme = rawTheme[colorScheme as ThemeName];
  const serverName = displayInstance(auth.instance);
  const instance = (auth.instance || cloudInstance).trim().replace(/\/+$/, "");
  const isCloudInstance = instance === cloudInstance;
  const currentInstanceInfo =
    instanceInfo.instance === instance ? instanceInfo : null;
  const buttonAuths = currentInstanceInfo?.logins?.buttonAuths;
  const versionOk = currentInstanceInfo?.config
    ? isAtLeastInstanceVersion(
        currentInstanceInfo.config.INSTANCE_VERSION,
        "v2.15.0"
      )
    : instance === cloudInstance;
  const hasApple = buttonAuths
    ? buttonAuths.some((button) => button.method === "apple")
    : instance === cloudInstance;
  const hasGoogle = buttonAuths
    ? buttonAuths.some((button) => button.method === "google")
    : instance === cloudInstance;
  const appleEnabled = Platform.OS === "ios" && hasApple && versionOk;
  const googleEnabled = hasGoogle && versionOk;
  const isCheckingOAuth =
    currentInstanceInfo?.status === "loading" && !buttonAuths;

  const openLoginSheet = async () => {
    SheetManager.show("login-sheet");
  };

  const openSignUpSheet = async () => {
    SheetManager.show("sign-up-sheet");
  };

  const setCloudServer = () => {
    setInstance(cloudInstance);
  };

  const openSelfHostedSheet = () => {
    requestAnimationFrame(() => {
      SheetManager.show("self-hosted-server-sheet");
    });
  };

  const serverOptions = [
    {
      key: "cloud",
      title: "Cloud (Default)",
      onSelect: setCloudServer,
      className: "font-bold",
    },
    {
      key: "self-hosted",
      title: "Self-hosted",
      onSelect: openSelfHostedSheet,
    },
  ];
  const orderedServerOptions =
    Platform.OS === "ios" ? [...serverOptions].reverse() : serverOptions;
  useEffect(() => {
    if (serverRecovery === "true") return;

    fetchInstanceInfo(instance);
  }, [fetchInstanceInfo, instance, serverRecovery]);

  useEffect(() => {
    if (
      serverRecovery !== "true" ||
      auth.status !== "authenticated" ||
      !auth.session ||
      signingOutRecoverySession === auth.session
    )
      return;

    signingOutRecoverySession = auth.session;
    signOut()
      .then(() => {
        Alert.alert(
          "Signed out",
          "Your session is no longer valid. Please sign in again."
        );
      })
      .catch((error) => {
        signingOutRecoverySession = null;
        console.error("Could not sign out after losing the server:", error);
      });
  }, [auth.session, auth.status, serverRecovery, signOut]);

  if (serverRecovery === "true") {
    return (
      <View className="flex-1 items-center justify-center bg-base-100">
        <ActivityIndicator size="large" color={theme["base-content"]} />
      </View>
    );
  }

  if (auth.session) {
    return <Redirect href="/dashboard" />;
  }

  return (
    <>
      <Animated.View entering={FadeIn} className="flex-col justify-end h-full">
        <View className="h-full bg-zinc-100 dark:bg-zinc-900">
          <SafeAreaView className="flex-col justify-between h-full duration-100 pt-10 -mt-2 w-full px-4">
            <View className="flex-col gap-2">
              <View className="flex-row items-center justify-end">
                <TouchableOpacity
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel="Need help?"
                  className="items-center justify-center rounded-full"
                  onPress={() => SheetManager.show("support-sheet")}
                >
                  <CircleHelp size={25} color={theme["base-content"]} />
                </TouchableOpacity>
              </View>
            </View>

            <View className="flex-col gap-4">
              <Image
                source={require("@/assets/images/linkwarden.png")}
                className="w-[100px] h-[100px] mx-auto"
              />

              <Text className="text-base-content text-3xl font-semibold text-center">
                Bookmarks, Evolved
              </Text>
            </View>

            <View className="flex-col gap-4">
              <View className="flex-row gap-3">
                <Button
                  variant="accent"
                  size="lg"
                  className="flex-1 px-4"
                  onPress={openSignUpSheet}
                >
                  <Text className="text-white text-xl">Sign Up</Text>
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="flex-1 px-4 bg-base-100"
                  onPress={openLoginSheet}
                  activeOpacity={0.7}
                >
                  <Text className="text-base-content text-xl">Login</Text>
                </Button>
              </View>

              {(appleEnabled || googleEnabled) && (
                <View className="flex-col gap-3">
                  {appleEnabled && (
                    <Button
                      variant="outline"
                      size="lg"
                      accessibilityRole="button"
                      accessibilityLabel="Continue with Apple"
                      className="w-full flex-row gap-2 bg-base-100 px-4"
                      disabled={isCheckingOAuth}
                      onPress={async () => {
                        if (isCheckingOAuth) return;
                        signInWithApple(instance);
                      }}
                    >
                      <FontAwesome
                        name="apple"
                        size={22}
                        color={theme["base-content"]}
                      />
                      <Text className="text-base-content text-base font-semibold">
                        Continue with Apple
                      </Text>
                    </Button>
                  )}
                  {googleEnabled && (
                    <Button
                      variant="outline"
                      size="lg"
                      accessibilityRole="button"
                      accessibilityLabel="Continue with Google"
                      className="w-full flex-row gap-2 bg-base-100 px-4"
                      disabled={isCheckingOAuth}
                      onPress={async () => {
                        if (isCheckingOAuth) return;
                        signInWithGoogle(instance);
                      }}
                    >
                      <FontAwesome
                        name="google"
                        size={20}
                        color={theme["base-content"]}
                      />
                      <Text className="text-base-content text-base font-semibold">
                        Continue with Google
                      </Text>
                    </Button>
                  )}
                </View>
              )}

              <Text className="text-neutral text-center text-xs px-2">
                By continuing, you agree to our{" "}
                <Text
                  className="font-semibold"
                  onPress={() => Linking.openURL("https://linkwarden.app/tos")}
                >
                  Terms of Service
                </Text>{" "}
                and{" "}
                <Text
                  className="font-semibold"
                  onPress={() =>
                    Linking.openURL("https://linkwarden.app/privacy-policy")
                  }
                >
                  Privacy Policy
                </Text>
                .
              </Text>

              <View className="flex-row items-center justify-center gap-1 mt-5">
                <Text className="text-neutral text-xs">Hosted on:</Text>
                <DropdownMenu.Root>
                  <DropdownMenu.Trigger asChild>
                    <TouchableOpacity
                      activeOpacity={0.7}
                      accessibilityRole="button"
                      accessibilityLabel={`Hosted on: ${serverName}`}
                      className="flex-row items-center justify-center gap-1"
                    >
                      <Text className="text-primary text-xs">{serverName}</Text>
                      <ChevronDown size={12} color={theme["primary"]} />
                    </TouchableOpacity>
                  </DropdownMenu.Trigger>

                  <DropdownMenu.Content>
                    <DropdownMenu.Separator />
                    {orderedServerOptions.map((option) => {
                      const isActive =
                        option.key === "cloud"
                          ? isCloudInstance
                          : !isCloudInstance;

                      return (
                        <DropdownMenu.CheckboxItem
                          key={option.key}
                          value={isActive}
                          onValueChange={option.onSelect}
                          className={option.className}
                        >
                          <DropdownMenu.ItemTitle>
                            {option.title}
                          </DropdownMenu.ItemTitle>
                        </DropdownMenu.CheckboxItem>
                      );
                    })}
                  </DropdownMenu.Content>
                </DropdownMenu.Root>
              </View>
            </View>
          </SafeAreaView>
        </View>
      </Animated.View>
      <KeyboardToolbar />
    </>
  );
}
