import { useEffect, useState } from "react";
import {
  Alert,
  Dimensions,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import ActionSheet, { SheetManager } from "react-native-actions-sheet";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColorScheme } from "nativewind";
import { Check } from "lucide-react-native";
import {
  isAtLeastInstanceVersion,
  type Config,
} from "@linkwarden/router/config";
import { Button } from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { rawTheme, ThemeName } from "@/lib/colors";
import useAuthStore from "@/store/auth";
import SheetHeader from "./SheetHeader";

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

const cleanInstance = (instance: string) => instance.trim().replace(/\/+$/, "");

export default function SignUpSheet() {
  const { auth, instanceInfo, signUp } = useAuthStore();
  const { colorScheme } = useColorScheme();
  const insets = useSafeAreaInsets();
  const theme = rawTheme[colorScheme as ThemeName];
  const [isLoading, setIsLoading] = useState(false);
  const [acceptPromotionalEmails, setAcceptPromotionalEmails] = useState(false);
  const [form, setForm] = useState({
    name: "",
    username: "",
    email: "",
    password: "",
    instance: auth.instance || cloudInstance,
  });

  const instance = cleanInstance(form.instance);
  const currentInstanceInfo =
    instanceInfo.instance === instance ? instanceInfo : null;
  const currentConfig =
    instance === cloudInstance
      ? currentInstanceInfo?.config || cloudConfig
      : currentInstanceInfo?.config || null;
  const isConfigLoading =
    currentInstanceInfo?.status === "loading" && !currentConfig;
  const configError = currentInstanceInfo?.error || "";
  const emailSignUp = currentConfig?.EMAIL_PROVIDER === true;
  const supportsMobileSignup =
    instance === cloudInstance ||
    isAtLeastInstanceVersion(currentConfig?.INSTANCE_VERSION, "v2.15.0");

  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      instance: auth.instance || cloudInstance,
    }));
  }, [auth.instance]);

  const closeSheet = async () => {
    await SheetManager.hide("sign-up-sheet");
  };

  useEffect(() => {
    if (auth.status === "authenticated") closeSheet();
  }, [auth.status]);

  const register = async () => {
    const email = form.email.toLowerCase().trim();
    const username = form.username.toLowerCase().trim();
    const name = form.name.trim();

    if (!currentConfig)
      return Alert.alert("Error", configError || "Please check the instance.");
    else if (currentConfig.DISABLE_REGISTRATION)
      return Alert.alert("Error", "Registration is disabled on this instance.");
    else if (emailSignUp && !supportsMobileSignup)
      return Alert.alert(
        "Sign up through the web",
        "This instance needs to be updated to support mobile sign-up. You can sign up through the web, then come back here to log in."
      );
    else if (!name || !form.password || (emailSignUp ? !email : !username))
      return Alert.alert("Error", "Please fill all fields");
    else if (form.password.length < 8)
      return Alert.alert("Error", "Password must be at least 8 characters");

    setIsLoading(true);
    const created = await signUp({
      name,
      email: emailSignUp ? email : undefined,
      username: emailSignUp ? undefined : username,
      password: form.password,
      instance,
      acceptPromotionalEmails,
    });
    setIsLoading(false);

    if (!created) return;

    if (emailSignUp) {
      await closeSheet();
      SheetManager.show("verify-email-sheet", {
        payload: { email, instance },
        context: "global",
      });
    } else {
      Alert.alert("Account created", "You can log in now.");
      closeSheet();
    }
  };

  return (
    <ActionSheet
      gestureEnabled
      indicatorStyle={{
        display: "none",
      }}
      containerStyle={{
        backgroundColor: theme["base-100"],
      }}
      safeAreaInsets={insets}
    >
      <SheetHeader
        title="Sign Up"
        onClose={closeSheet}
        titleClassName="text-2xl"
        align="left"
      />

      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        style={{
          maxHeight: Dimensions.get("window").height * 0.78,
        }}
        contentContainerClassName="px-8 pb-5 flex-col gap-3"
      >
        <>
          {!!configError && (
            <Text className="text-red-500 text-center">{configError}</Text>
          )}
          {currentConfig?.DISABLE_REGISTRATION && (
            <Text className="text-neutral text-center">
              Registration is disabled on this instance.
            </Text>
          )}
          {currentConfig?.EMAIL_PROVIDER === true && !supportsMobileSignup && (
            <Text className="text-neutral text-center">
              This instance needs to be updated to support mobile sign-up. You
              can sign up through the web, then come back here to log in.
            </Text>
          )}
          <Input
            className="w-full text-xl p-3 leading-tight h-12"
            textAlignVertical="center"
            placeholder="Display Name"
            value={form.name}
            onChangeText={(text) => setForm({ ...form, name: text })}
          />
          {emailSignUp ? (
            <Input
              className="w-full text-xl p-3 leading-tight h-12"
              textAlignVertical="center"
              placeholder="Email"
              value={form.email}
              autoCapitalize="none"
              keyboardType="email-address"
              onChangeText={(text) => setForm({ ...form, email: text })}
            />
          ) : (
            <Input
              className="w-full text-xl p-3 leading-tight h-12"
              textAlignVertical="center"
              placeholder="Username"
              value={form.username}
              autoCapitalize="none"
              onChangeText={(text) => setForm({ ...form, username: text })}
            />
          )}
          <Input
            className="w-full text-xl p-3 leading-tight h-12"
            textAlignVertical="center"
            placeholder="Password"
            secureTextEntry
            autoCapitalize="none"
            value={form.password}
            onChangeText={(text) => setForm({ ...form, password: text })}
          />
          {instance === cloudInstance && (
            <TouchableOpacity
              activeOpacity={0.75}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: acceptPromotionalEmails }}
              className="flex-row items-center gap-3 py-1"
              onPress={() => setAcceptPromotionalEmails((checked) => !checked)}
            >
              <View
                className="h-5 w-5 items-center justify-center rounded border"
                style={{
                  backgroundColor: acceptPromotionalEmails
                    ? theme.accent
                    : "transparent",
                  borderColor: acceptPromotionalEmails
                    ? theme.accent
                    : theme.neutral,
                }}
              >
                {acceptPromotionalEmails && (
                  <Check size={14} color="#FFFFFF" strokeWidth={3} />
                )}
              </View>
              <Text className="text-neutral flex-1 text-sm">
                Get notified about new features and offers via email.
              </Text>
            </TouchableOpacity>
          )}
          <Button
            variant="accent"
            size="lg"
            disabled={isConfigLoading}
            isLoading={isLoading}
            onPress={register}
          >
            <Text className="text-white text-xl">Sign Up</Text>
          </Button>
        </>
      </ScrollView>
    </ActionSheet>
  );
}
