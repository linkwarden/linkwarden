import { useRef, useState } from "react";
import { Alert, Linking, Text, TouchableOpacity, View } from "react-native";
import ActionSheet, {
  ActionSheetRef,
  SheetManager,
} from "react-native-actions-sheet";
import { useColorScheme } from "nativewind";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useSideInsets } from "@/lib/sideInsets";
import { useUser } from "@linkwarden/router/user";
import useAuthStore from "@/store/auth";
import { rawTheme, ThemeName } from "@/lib/colors";
import { Button } from "../ui/Button";
import Input from "../ui/Input";
import SheetHeader from "./SheetHeader";

const FEEDBACK_OPTIONS = [
  { value: "customer_service", label: "Customer Service" },
  { value: "low_quality", label: "Low Quality" },
  { value: "missing_features", label: "Missing Features" },
  { value: "switched_service", label: "Switched Service" },
  { value: "too_complex", label: "Too Complex" },
  { value: "too_expensive", label: "Too Expensive" },
  { value: "unused", label: "Unused" },
  { value: "other", label: "Other" },
];

export default function DeleteAccountSheet() {
  const actionSheetRef = useRef<ActionSheetRef>(null);
  const { colorScheme } = useColorScheme();
  const theme = rawTheme[colorScheme as ThemeName];
  const insets = useSafeAreaInsets();
  const sideInsets = useSideInsets();

  const { auth, signOut } = useAuthStore();
  const { data: user } = useUser(auth);

  const [password, setPassword] = useState("");
  const [feedback, setFeedback] = useState<string>();
  const [comment, setComment] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [loading, setLoading] = useState(false);

  const canDelete = user?.hasPassword
    ? password !== ""
    : confirmation.trim() === "confirm";

  const reset = () => {
    setPassword("");
    setFeedback(undefined);
    setComment("");
    setConfirmation("");
    setLoading(false);
  };

  const closeSheet = () => {
    actionSheetRef.current?.hide();
  };

  const handleDelete = async () => {
    if (!canDelete || loading || !user?.id || !auth.instance || !auth.session) {
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${auth.instance}/api/v1/users/${user.id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${auth.session}`,
        },
        body: JSON.stringify({
          password,
          cancellation_details: { comment, feedback },
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data?.response || "Could not delete your account.");
      }

      await SheetManager.hide("delete-account-sheet");
      await signOut();
    } catch (error: any) {
      Alert.alert(
        "Delete failed",
        error?.message || "Could not delete your account."
      );
      setLoading(false);
    }
  };

  return (
    <ActionSheet
      ref={actionSheetRef}
      gestureEnabled
      indicatorStyle={{ display: "none" }}
      containerStyle={{ backgroundColor: theme["base-100"], ...sideInsets }}
      safeAreaInsets={insets}
      onClose={reset}
    >
      <SheetHeader
        title="Delete account"
        onClose={closeSheet}
        titleClassName="text-red-500"
        align="left"
      />

      <View className="px-8 pb-5">
        <Text className="text-base-content">
          This will permanently delete all the Links, Collections, Tags, and
          archived data you own. It will also log you out. This action is
          irreversible!
        </Text>

        {user?.subscription?.active &&
        user.subscription.provider === "APPLE" ? (
          <View className="mt-3">
            <Text className="text-base-content">
              Note: Deleting your account will not cancel your App Store
              subscription. To avoid future charges, cancel the subscription in
              your Apple ID settings or use the following link:
            </Text>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() =>
                Linking.openURL("https://apps.apple.com/account/subscriptions")
              }
            >
              <Text className="text-primary font-semibold mt-2">
                https://apps.apple.com/account/subscriptions
              </Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {user?.subscription?.active &&
        user.subscription.provider === "GOOGLE" ? (
          <View className="border border-neutral-content p-3 rounded-md mt-5">
            <Text className="text-base-content">
              Your Google Play subscription's auto-renewal will be cancelled
              automatically when your account is deleted.
            </Text>
          </View>
        ) : null}

        {user?.hasPassword ? (
          <>
            <Text className="text-base-content mt-5 mb-2 font-semibold">
              Confirm password
            </Text>
            <Input
              placeholder="Password"
              placeholderTextColor={theme.neutral}
              className="bg-base-200"
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              value={password}
              onChangeText={setPassword}
            />
          </>
        ) : (
          <>
            <Text className="text-base-content mt-5 mb-2 font-semibold">
              Type "confirm" below to delete your account
            </Text>
            <Input
              placeholder="confirm"
              placeholderTextColor={theme.neutral}
              className="bg-base-200"
              autoCapitalize="none"
              autoCorrect={false}
              value={confirmation}
              onChangeText={setConfirmation}
            />
          </>
        )}

        <View className="border border-neutral-content p-2 rounded-md mt-5 mb-2">
          <Text className="italic font-semibold mb-2 text-base-content">
            Optional (but it really helps us improve!)
          </Text>
          <Text className="mb-2 text-base-content">
            Reason for cancellation
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {FEEDBACK_OPTIONS.map((option) => {
              const isSelected = feedback === option.value;
              return (
                <TouchableOpacity
                  key={option.value}
                  activeOpacity={0.7}
                  onPress={() =>
                    setFeedback(isSelected ? undefined : option.value)
                  }
                  className="rounded-full border px-3 py-1.5"
                  style={{
                    borderColor: isSelected
                      ? theme.accent
                      : theme["neutral-content"],
                    backgroundColor: isSelected ? theme.accent : "transparent",
                  }}
                >
                  <Text
                    className="text-sm"
                    style={{
                      color: isSelected ? "#FFFFFF" : theme["base-content"],
                    }}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Input
            placeholder="More information (optional)"
            placeholderTextColor={theme.neutral}
            className="mt-4 bg-base-200 min-h-20"
            multiline
            textAlignVertical="top"
            value={comment}
            onChangeText={setComment}
          />
        </View>

        <Button
          onPress={handleDelete}
          isLoading={loading}
          disabled={!canDelete}
          variant="destructive"
          className="mt-5"
        >
          <Text className="text-white font-semibold">Delete Your Account</Text>
        </Button>
      </View>
    </ActionSheet>
  );
}
