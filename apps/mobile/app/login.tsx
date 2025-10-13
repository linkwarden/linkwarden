import { Button } from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { rawTheme, ThemeName } from "@/lib/colors";
import useAuthStore from "@/store/auth";
import { Redirect } from "expo-router";
import { useColorScheme } from "nativewind";
import { useEffect, useState } from "react";
import { View, Text, Dimensions, TouchableOpacity, Image } from "react-native";
import { SheetManager } from "react-native-actions-sheet";
import Svg, { Path } from "react-native-svg";
import {
  KeyboardAwareScrollView,
  KeyboardToolbar,
} from "react-native-keyboard-controller";

export default function HomeScreen() {
  const { auth, signIn } = useAuthStore();
  const { colorScheme } = useColorScheme();
  const [method, setMethod] = useState<"password" | "token">("password");

  const [form, setForm] = useState({
    user: "",
    password: "",
    token: "",
    instance: auth.instance || "https://cloud.linkwarden.app",
  });

  const [showInstanceField, setShowInstanceField] = useState(
    form.instance !== "https://cloud.linkwarden.app"
  );

  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      instance: auth.instance || "https://cloud.linkwarden.app",
    }));
  }, [auth.instance]);

  useEffect(() => {
    setShowInstanceField(form.instance !== "https://cloud.linkwarden.app");
  }, [form.instance]);

  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      token: "",
      user: "",
      password: "",
    }));
  }, [method]);

  if (auth.status === "authenticated") {
    return <Redirect href="/dashboard" />;
  }

  return (
    <>
      <KeyboardAwareScrollView
        bottomOffset={62}
        contentContainerClassName="flex-col justify-end h-full bg-base-100 relative"
      >
        <View className="flex-col justify-end h-full bg-primary relative">
          <View className="my-auto">
            <Image
              source={require("@/assets/images/linkwarden.png")}
              className="w-[120px] h-[120px] mx-auto"
            />
          </View>
          <Text className="text-base-100 text-7xl font-bold ml-8">Login</Text>
          <View>
            <Text
              className="text-base-100 text-2xl mx-8 mt-3"
              numberOfLines={1}
            >
              Login to{" "}
              {form.instance === "https://cloud.linkwarden.app"
                ? "cloud.linkwarden.app"
                : form.instance}
            </Text>
            <TouchableOpacity
              onPress={() => {
                if (showInstanceField) {
                  setForm({
                    ...form,
                    instance: "https://cloud.linkwarden.app",
                  });
                }
                setShowInstanceField(!showInstanceField);
              }}
              className="mx-8 mt-1 self-start"
            >
              <Text className="text-neutral-content text-sm">
                {!showInstanceField ? "Change server" : "Use official server"}
              </Text>
            </TouchableOpacity>
          </View>
          <Svg
            viewBox="0 0 1440 320"
            width={Dimensions.get("screen").width}
            height={100}
          >
            <Path
              fill={rawTheme[colorScheme as ThemeName]["base-100"]}
              fill-opacity="1"
              d="M0,256L48,234.7C96,213,192,171,288,176C384,181,480,235,576,266.7C672,299,768,309,864,277.3C960,245,1056,171,1152,122.7C1248,75,1344,53,1392,42.7L1440,32L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
            />
          </Svg>
          <View className="flex-col justify-end h-auto duration-100 pt-10 bg-base-100 -mt-2 pb-10 gap-4 w-full px-4">
            {showInstanceField && (
              <Input
                className="w-full text-xl p-3 leading-tight h-12"
                textAlignVertical="center"
                placeholder="Instance URL"
                selectTextOnFocus={false}
                value={form.instance}
                onChangeText={(text) => setForm({ ...form, instance: text })}
              />
            )}
            {method === "password" ? (
              <>
                <Input
                  className="w-full text-xl p-3 leading-tight h-12"
                  textAlignVertical="center"
                  placeholder="Email or Username"
                  value={form.user}
                  onChangeText={(text) => setForm({ ...form, user: text })}
                />
                <Input
                  className="w-full text-xl p-3 leading-tight h-12"
                  textAlignVertical="center"
                  placeholder="Password"
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
                secureTextEntry
                value={form.token}
                onChangeText={(text) => setForm({ ...form, token: text })}
              />
            )}

            <TouchableOpacity
              onPress={() =>
                setMethod(method === "password" ? "token" : "password")
              }
              className="w-fit mx-auto"
            >
              <Text className="text-primary w-fit text-center">
                {method === "password"
                  ? "Login with Access Token"
                  : "Login with Username/Password"}
              </Text>
            </TouchableOpacity>

            <Button
              variant="accent"
              size="lg"
              onPress={() => {
                if (
                  ((form.user && form.password) || form.token) &&
                  form.instance
                ) {
                  signIn(form.user, form.password, form.instance, form.token);
                }
              }}
            >
              <Text className="text-white text-xl">Login</Text>
            </Button>
            <TouchableOpacity
              className="w-fit mx-auto"
              onPress={() => SheetManager.show("support-sheet")}
            >
              <Text className="text-neutral text-center w-fit">Need help?</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAwareScrollView>
      <KeyboardToolbar />
    </>
  );
}
