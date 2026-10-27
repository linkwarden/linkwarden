import { useEffect, useState } from "react";
import { Alert, Dimensions, ScrollView, Text } from "react-native";
import ActionSheet, {
  SheetManager,
  SheetProps,
} from "react-native-actions-sheet";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColorScheme } from "nativewind";
import { isAtLeastInstanceVersion } from "@linkwarden/router/config";
import { Button } from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { rawTheme, ThemeName } from "@/lib/colors";
import useAuthStore from "@/store/auth";
import SheetHeader from "./SheetHeader";

const cloudInstance = "https://cloud.linkwarden.app";
const MIN_EMAIL_CODE_VERSION = "v2.17.0";

export default function VerifyEmailSheet({
  payload,
}: SheetProps<"verify-email-sheet">) {
  const { auth, instanceInfo, signIn, requestVerificationEmail } =
    useAuthStore();
  const { colorScheme } = useColorScheme();
  const insets = useSafeAreaInsets();
  const theme = rawTheme[colorScheme as ThemeName];
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [code, setCode] = useState("");

  const email = payload?.email ?? "";
  const instance = payload?.instance ?? "";
  const password = payload?.password ?? "";

  // The code is only accepted together with the password entered before this
  // sheet. The cloud always sends codes, self-hosted servers since v2.17.0.
  const supportsCode =
    Boolean(password) &&
    (instance === cloudInstance ||
      (instanceInfo.instance === instance &&
        isAtLeastInstanceVersion(
          instanceInfo.config?.INSTANCE_VERSION,
          MIN_EMAIL_CODE_VERSION
        )));

  const closeSheet = () => {
    SheetManager.hide("verify-email-sheet");
  };

  useEffect(() => {
    if (auth.status === "authenticated") closeSheet();
  }, [auth.status]);

  const handleVerify = async () => {
    if (code.length !== 6)
      return Alert.alert("Error", "Please enter the 6-digit code.");

    setIsVerifying(true);
    await signIn(email, password, instance, undefined, code);
    setIsVerifying(false);
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
        {supportsCode ? (
          <>
            <Text className="text-base-content text-base">
              Please verify your email address to continue. Enter the 6-digit
              code we sent to your inbox.
            </Text>
            <Input
              className="w-full text-xl p-3 leading-tight h-12 text-center tracking-widest"
              textAlignVertical="center"
              placeholder="Verification code"
              keyboardType="number-pad"
              textContentType="oneTimeCode"
              autoComplete="one-time-code"
              maxLength={6}
              value={code}
              onChangeText={(text) => setCode(text.replace(/\D/g, ""))}
            />
            <Button
              variant="accent"
              size="lg"
              isLoading={isVerifying}
              onPress={handleVerify}
            >
              <Text className="text-white text-xl">Verify</Text>
            </Button>
          </>
        ) : (
          <Text className="text-base-content text-base">
            Please verify your email address to continue. Open the link we sent
            to your inbox to verify and log in automatically.
          </Text>
        )}
        <Button
          variant={supportsCode ? "ghost" : "accent"}
          size="lg"
          isLoading={isLoading}
          onPress={async () => {
            setIsLoading(true);
            await requestVerificationEmail(email, instance);
            setIsLoading(false);
          }}
        >
          <Text
            className={
              supportsCode ? "text-primary text-base" : "text-white text-xl"
            }
          >
            {supportsCode ? "Resend Code" : "Resend Email"}
          </Text>
        </Button>
      </ScrollView>
    </ActionSheet>
  );
}
