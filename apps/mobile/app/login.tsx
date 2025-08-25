import { Button } from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { rawTheme, ThemeName } from "@/lib/colors";
import useAuthStore from "@/store/auth";
import { Redirect } from "expo-router";
import { useColorScheme } from "nativewind";
import { useState } from "react";
import {
  View,
  Text,
  Dimensions,
  Pressable,
  TouchableOpacity,
} from "react-native";
import Svg, { Path } from "react-native-svg";

export default function HomeScreen() {
  const { auth, signIn } = useAuthStore();
  const { colorScheme } = useColorScheme();
  const [method, setMethod] = useState<"password" | "token">("password");

  const [form, setForm] = useState({
    user: "",
    password: "",
    token: "",
    instance: "",
  });

  if (auth.status === "authenticated") {
    return <Redirect href="/dashboard" />;
  }

  return (
    <View className="flex-col justify-end h-full bg-primary">
      <Text className="text-base-100 text-7xl font-bold ml-8">Login</Text>
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
      <View className="flex-col justify-end h-1/3 bg-base-100 -mt-2 pb-10 gap-4 w-full px-4">
        {method === "password" ? (
          <>
            <Input
              className="w-full text-xl p-3 leading-tight"
              textAlignVertical="center"
              placeholder="Email or Username"
              value={form.user}
              onChangeText={(text) => setForm({ ...form, user: text })}
            />

            <Input
              className="w-full text-xl p-3 leading-tight"
              textAlignVertical="center"
              placeholder="Password"
              secureTextEntry
              value={form.password}
              onChangeText={(text) => setForm({ ...form, password: text })}
            />
          </>
        ) : (
          <Input
            className="w-full text-xl p-3 leading-tight"
            textAlignVertical="center"
            placeholder="Access Token"
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
              ? "Login with Access Token instead"
              : "Login with Username/Password instead"}
          </Text>
        </TouchableOpacity>

        <Button
          variant="accent"
          size="lg"
          onPress={() =>
            signIn(
              form.user,
              form.password,
              form.instance ? form.instance : undefined
            )
          }
        >
          <Text className="text-white">Login</Text>
        </Button>
        <TouchableOpacity className="w-fit mx-auto">
          <Text className="text-neutral text-center w-fit">Need help?</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
