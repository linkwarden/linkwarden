import { Button } from "@/components/ui/Button";
import { rawTheme, ThemeName } from "@/lib/colors";
import useAuthStore from "@/store/auth";
import { Redirect, router } from "expo-router";
import { useColorScheme } from "nativewind";
import { View, Text, Dimensions, TouchableOpacity, Image } from "react-native";
import { SheetManager } from "react-native-actions-sheet";
import Svg, { Path } from "react-native-svg";
import Animated, { SlideInDown } from "react-native-reanimated";

export default function HomeScreen() {
  const { auth } = useAuthStore();
  const { colorScheme } = useColorScheme();

  if (auth.session) {
    return <Redirect href="/dashboard" />;
  }

  return (
    <Animated.View
      entering={SlideInDown.springify().damping(100).stiffness(300)}
      className="flex-col justify-end h-full bg-primary relative"
    >
      <View className="my-auto">
        <Image
          source={require("@/assets/images/linkwarden.png")}
          className="w-[120px] h-[120px] mx-auto"
        />
        <Text className="text-base-100 text-4xl font-semibold mt-7 mx-auto">
          Linkwarden
        </Text>
      </View>
      <View>
        <Text className="text-base-100 text-xl text-center font-semibold mx-4 mt-3">
          Welcome to the official mobile app for Linkwarden!
        </Text>

        <Text className="text-base-100 text-xl text-center mx-4 mt-3">
          Expect regular improvements and new features as we continue refining
          the experience.
        </Text>
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
        <Button
          variant="accent"
          size="lg"
          onPress={() => router.push("/login")}
        >
          <Text className="text-white text-xl">Get Started</Text>
        </Button>
        <TouchableOpacity
          className="w-fit mx-auto"
          onPress={() => SheetManager.show("support-sheet")}
        >
          <Text className="text-neutral text-center w-fit">Need help?</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}
