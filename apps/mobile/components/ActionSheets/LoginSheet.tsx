import { useEffect, useState } from "react";
import {
  Dimensions,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import ActionSheet, { SheetManager } from "react-native-actions-sheet";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColorScheme } from "nativewind";
import { Button } from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import WebViewModal from "@/components/WebViewModal";
import { rawTheme, ThemeName } from "@/lib/colors";
import useAuthStore from "@/store/auth";
import SheetHeader from "./SheetHeader";

const cloudInstance = "https://cloud.linkwarden.app";

const cleanInstance = (instance: string) => instance.trim().replace(/\/+$/, "");

export default function LoginSheet() {
  const { auth, signIn, instanceInfo, fetchInstanceInfo } = useAuthStore();
  const { colorScheme } = useColorScheme();
  const insets = useSafeAreaInsets();
  const theme = rawTheme[colorScheme as ThemeName];
  const [method, setMethod] = useState<"password" | "token">("password");
  const [isLoading, setIsLoading] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [form, setForm] = useState({
    user: "",
    password: "",
    token: "",
    instance: auth.instance || cloudInstance,
  });

  const instance = cleanInstance(form.instance);

  const emailEnabled =
    instance === cloudInstance ||
    (instanceInfo.instance === instance &&
      instanceInfo.config?.EMAIL_PROVIDER === true);

  useEffect(() => {
    fetchInstanceInfo(instance);
  }, [instance]);

  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      instance: auth.instance || cloudInstance,
    }));
  }, [auth.instance]);

  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      token: "",
      user: "",
      password: "",
    }));
  }, [method]);

  const closeSheet = () => {
    SheetManager.hide("login-sheet");
  };

  useEffect(() => {
    if (auth.status === "authenticated") closeSheet();
  }, [auth.status]);

  const handleLogin = async () => {
    if (!instance || (!form.token && (!form.user || !form.password))) return;

    setIsLoading(true);
    const success = await signIn(
      form.user,
      form.password,
      instance,
      form.token
    );
    setIsLoading(false);

    if (success) closeSheet();
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
        title="Login"
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
        contentContainerClassName="px-8 pb-5 flex-col gap-4"
      >
        {method === "password" ? (
          <>
            <Input
              className="w-full text-xl p-3 leading-tight h-12"
              textAlignVertical="center"
              placeholder="Email or Username"
              value={form.user}
              autoCapitalize="none"
              onChangeText={(text) => setForm({ ...form, user: text })}
            />
            <Input
              className="w-full text-xl p-3 leading-tight h-12"
              textAlignVertical="center"
              placeholder="Password"
              autoCapitalize="none"
              secureTextEntry
              value={form.password}
              onChangeText={(text) => setForm({ ...form, password: text })}
            />
          </>
        ) : (
          <Input
            className="w-full text-xl p-3 leading-tight h-12"
            textAlignVertical="center"
            placeholder="Access Token"
            autoCapitalize="none"
            secureTextEntry
            value={form.token}
            onChangeText={(text) => setForm({ ...form, token: text })}
          />
        )}

        <View className="flex flex-row">
          <TouchableOpacity
            onPress={() =>
              setMethod(method === "password" ? "token" : "password")
            }
            className="w-fit"
          >
            <Text className="text-primary w-fit text-center">
              {method === "password"
                ? "Login with Access Token"
                : "Login with Username/Password"}
            </Text>
          </TouchableOpacity>

          {emailEnabled && method === "password" && (
            <TouchableOpacity
              onPress={() => setShowForgot(true)}
              className="w-fit ml-auto"
            >
              <Text className="text-primary text-right">Forgot password?</Text>
            </TouchableOpacity>
          )}
        </View>

        <Button
          variant="accent"
          size="lg"
          isLoading={isLoading}
          onPress={handleLogin}
        >
          <Text className="text-white text-xl">Login</Text>
        </Button>
      </ScrollView>

      <WebViewModal
        visible={showForgot}
        onClose={() => setShowForgot(false)}
        title="Forgot Password"
        uri={`${instance}/forgot`}
      />
    </ActionSheet>
  );
}
