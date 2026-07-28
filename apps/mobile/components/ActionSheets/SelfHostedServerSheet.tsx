import { useEffect, useState } from "react";
import { Alert, Pressable, Text, View } from "react-native";
import ActionSheet, { SheetManager } from "react-native-actions-sheet";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColorScheme } from "nativewind";
import { ChevronDown, ChevronRight, X } from "lucide-react-native";
import { Button } from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { rawTheme, ThemeName } from "@/lib/colors";
import useAuthStore from "@/store/auth";
import {
  CustomHeader,
  getCustomHeaders,
  isValidCustomHeader,
  setCustomHeaders,
} from "@/lib/customHeaders";
import type { Config } from "@linkwarden/router/config";
import SheetHeader from "./SheetHeader";

const cloudInstance = "https://cloud.linkwarden.app";

const cleanInstance = (instance: string) => instance.trim().replace(/\/+$/, "");

const normalizeInstance = (instance: string) => {
  const clean = cleanInstance(instance);

  if (!clean) return "";
  if (/^https?:\/\//i.test(clean)) return clean;

  return `https://${clean}`;
};

const timeout = () =>
  new Promise<Response>((_, reject) =>
    setTimeout(() => reject(new Error("TIMEOUT")), 30000)
  );

export default function SelfHostedServerSheet() {
  const { auth, setInstance } = useAuthStore();
  const { colorScheme } = useColorScheme();
  const insets = useSafeAreaInsets();
  const theme = rawTheme[colorScheme as ThemeName];
  const [server, setServer] = useState(
    auth.instance && auth.instance !== cloudInstance ? auth.instance : ""
  );
  const [showAdvanced, setShowAdvanced] = useState(
    () => (getCustomHeaders()?.headers.length ?? 0) > 0
  );
  const [headers, setHeaders] = useState<CustomHeader[]>(
    () => getCustomHeaders()?.headers ?? []
  );
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setServer(
      auth.instance && auth.instance !== cloudInstance ? auth.instance : ""
    );
  }, [auth.instance]);

  const closeSheet = () => {
    SheetManager.hide("self-hosted-server-sheet");
  };

  const updateHeader = (
    index: number,
    field: keyof CustomHeader,
    text: string
  ) => {
    setHeaders((prev) =>
      prev.map((row, i) => (i === index ? { ...row, [field]: text } : row))
    );
  };

  const setSelfHostedServer = async () => {
    const instance = normalizeInstance(server);

    if (!instance)
      return Alert.alert("Error", "Please enter a server address.");

    const customHeaders = headers
      .map((h) => ({ key: h.key.trim(), value: h.value.trim() }))
      .filter((h) => h.key || h.value);

    const invalid = customHeaders.find((h) => !isValidCustomHeader(h));
    if (invalid)
      return Alert.alert(
        "Error",
        `"${invalid.key || "(empty)"}" is not a valid header.`
      );

    setIsLoading(true);

    try {
      const res = await Promise.race([
        fetch(`${instance}/api/v1/config`, {
          headers: Object.fromEntries(
            customHeaders.map((h) => [h.key, h.value])
          ),
        }),
        timeout(),
      ]);
      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.response) {
        return Alert.alert("Error", "Could not verify this server.");
      }

      await setCustomHeaders(instance, customHeaders);
      await setInstance(instance, data.response as Config);
      closeSheet();
    } catch (err: any) {
      Alert.alert(
        err?.message === "TIMEOUT" ? "Request timed out" : "Network error",
        err?.message === "TIMEOUT"
          ? "Unable to reach the server in time. Please check the address and try again."
          : "Could not connect to the server. Please check the address and try again."
      );
    } finally {
      setIsLoading(false);
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
        title="Self-hosted Server"
        onClose={closeSheet}
        titleClassName="text-2xl"
        align="left"
      />

      <View className="px-8 pb-5 flex-col gap-4">
        <Input
          className="w-full text-xl p-3 leading-tight h-12"
          textAlignVertical="center"
          placeholder="https://example.com"
          selectTextOnFocus={false}
          value={server}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
          onChangeText={setServer}
        />

        <Pressable
          className="flex-row items-center gap-1"
          onPress={() => setShowAdvanced((prev) => !prev)}
        >
          {showAdvanced ? (
            <ChevronDown size={18} color={theme.neutral} />
          ) : (
            <ChevronRight size={18} color={theme.neutral} />
          )}
          <Text className="text-neutral">Advanced</Text>
        </Pressable>

        {showAdvanced && (
          <View className="flex-col gap-2">
            <Text className="text-base-content font-bold">Custom Headers</Text>
            <Text className="text-neutral text-sm">
              Custom headers are sent with every request to this server.
            </Text>

            {headers.map((header, index) => (
              <View key={index} className="flex-row items-center gap-2">
                <Input
                  className="flex-1 p-3 leading-tight h-12"
                  textAlignVertical="center"
                  placeholder="Header"
                  value={header.key}
                  autoCapitalize="none"
                  autoCorrect={false}
                  onChangeText={(text) => updateHeader(index, "key", text)}
                />
                <Input
                  className="flex-1 p-3 leading-tight h-12"
                  textAlignVertical="center"
                  placeholder="Value"
                  value={header.value}
                  autoCapitalize="none"
                  autoCorrect={false}
                  onChangeText={(text) => updateHeader(index, "value", text)}
                />
                <Pressable
                  hitSlop={8}
                  onPress={() =>
                    setHeaders((prev) => prev.filter((_, i) => i !== index))
                  }
                >
                  <X size={18} color={theme.neutral} />
                </Pressable>
              </View>
            ))}

            <Button
              variant="simple"
              onPress={() =>
                setHeaders((prev) => [...prev, { key: "", value: "" }])
              }
            >
              <Text className="text-base-content">Add Header</Text>
            </Button>
          </View>
        )}

        <Button
          variant="accent"
          size="lg"
          isLoading={isLoading}
          onPress={setSelfHostedServer}
        >
          <Text className="text-white text-xl">Set</Text>
        </Button>
      </View>
    </ActionSheet>
  );
}
