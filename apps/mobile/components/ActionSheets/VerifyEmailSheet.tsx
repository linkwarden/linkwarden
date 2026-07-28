import { useEffect, useState } from "react";
import { Dimensions, ScrollView, Text } from "react-native";
import ActionSheet, {
  SheetManager,
  SheetProps,
} from "react-native-actions-sheet";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColorScheme } from "nativewind";
import { Button } from "@/components/ui/Button";
import { rawTheme, ThemeName } from "@/lib/colors";
import useAuthStore from "@/store/auth";
import SheetHeader from "./SheetHeader";

export default function VerifyEmailSheet({
  payload,
}: SheetProps<"verify-email-sheet">) {
  const { auth, requestVerificationEmail } = useAuthStore();
  const { colorScheme } = useColorScheme();
  const insets = useSafeAreaInsets();
  const theme = rawTheme[colorScheme as ThemeName];
  const [isLoading, setIsLoading] = useState(false);

  const email = payload?.email ?? "";
  const instance = payload?.instance ?? "";

  const closeSheet = () => {
    SheetManager.hide("verify-email-sheet");
  };

  useEffect(() => {
    if (auth.status === "authenticated") closeSheet();
  }, [auth.status]);

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
        title="Check Email"
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
        <Text className="text-base-content text-xl" numberOfLines={1}>
          {email}
        </Text>
        <Text className="text-base-content text-base">
          Please verify your email address to continue. Open the link we sent to
          your inbox to verify and log in automatically.
        </Text>
        <Button
          variant="accent"
          size="lg"
          isLoading={isLoading}
          onPress={async () => {
            setIsLoading(true);
            await requestVerificationEmail(email, instance);
            setIsLoading(false);
          }}
        >
          <Text className="text-white text-xl">Resend Email</Text>
        </Button>
      </ScrollView>
    </ActionSheet>
  );
}
