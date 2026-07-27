import { Button } from "@/components/ui/Button";
import { rawTheme, ThemeName } from "@/lib/colors";
import useAuthStore from "@/store/auth";
import { router, usePathname } from "expo-router";
import { useColorScheme } from "nativewind";
import { ActivityIndicator, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function NotFoundScreen() {
  const { auth } = useAuthStore();
  const pathname = usePathname();
  const { colorScheme } = useColorScheme();
  const theme = rawTheme[colorScheme as ThemeName];

  const isAuthenticated = auth.status === "authenticated" && !!auth.session;

  if (auth.status === "loading") {
    return (
      <View className="bg-base-100 flex-1 items-center justify-center">
        <ActivityIndicator size="large" color={theme["base-content"]} />
      </View>
    );
  }

  return (
    <SafeAreaView className="bg-base-100 flex-1">
      <View className="flex-1 items-center justify-center gap-4 px-8">
        <Text className="text-neutral text-3xl">404</Text>
        <Text className="text-base-content text-2xl font-semibold text-center">
          Page Not Found
        </Text>
        <Text className="text-neutral text-base text-center">
          The page you followed either doesn't exist or isn't available in this
          version of the app. Updating to the latest version might do the trick.
        </Text>
        {pathname ? (
          <Text
            className="text-neutral font-bold text-xs text-center opacity-60"
            numberOfLines={1}
          >
            {pathname}
          </Text>
        ) : null}
        <Button
          variant="accent"
          size="lg"
          className="px-8 mt-4"
          accessibilityRole="button"
          accessibilityLabel={
            isAuthenticated ? "Back to Dashboard" : "Back to Login"
          }
          onPress={() =>
            router.replace(isAuthenticated ? "/(tabs)/dashboard" : "/")
          }
        >
          <Text className="text-white text-lg">
            {isAuthenticated ? "Back to Dashboard" : "Back to Login"}
          </Text>
        </Button>
      </View>
    </SafeAreaView>
  );
}
