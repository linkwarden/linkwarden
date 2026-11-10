import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Platform,
  Text,
  TextInput,
  TextInputProps,
  View,
} from "react-native";
import { useColorScheme } from "nativewind";
import { cn } from "@linkwarden/lib/utils";
import { rawTheme, ThemeName } from "@/lib/colors";
import {
  VERIFICATION_CODE_LENGTH,
  verificationCodeFromInput,
} from "@linkwarden/lib/verificationCode";

type Props = Omit<
  TextInputProps,
  "value" | "onChangeText" | "onSelectionChange" | "style"
> & {
  value: string;
  onChangeText: (code: string) => void;
};

function Caret() {
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const blink = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0,
          duration: 0,
          delay: 500,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 0,
          delay: 500,
          useNativeDriver: true,
        }),
      ])
    );

    blink.start();
    return () => blink.stop();
  }, [opacity]);

  return (
    <Animated.View style={{ opacity }}>
      <View className="h-7 w-0.5 bg-base-content" />
    </Animated.View>
  );
}

// One regular text field lies over the boxes and holds the whole code, so
// typing, pasting, the keyboard's code suggestion and screen readers work like
// they do on any text field. The boxes only show what's in it.
export default function VerificationCodeInput({
  value,
  onChangeText,
  onFocus,
  onBlur,
  ...props
}: Props) {
  const { colorScheme } = useColorScheme();
  const theme = rawTheme[colorScheme as ThemeName];
  const [focused, setFocused] = useState(false);
  const [selection, setSelection] = useState({ start: 0, end: 0 });

  const hasSelection =
    selection.start < selection.end && selection.end <= value.length;
  const caretIndex = Math.min(value.length, VERIFICATION_CODE_LENGTH - 1);

  return (
    <View>
      <View
        className="flex-row justify-center gap-2"
        pointerEvents="none"
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      >
        {Array.from({ length: VERIFICATION_CODE_LENGTH }, (_, index) => {
          const active =
            focused &&
            (hasSelection
              ? index >= selection.start && index < selection.end
              : index === caretIndex);

          return (
            <View
              key={index}
              className={cn(
                "flex-1 aspect-square max-w-16 items-center justify-center rounded-xl border border-neutral-content bg-base-100",
                active && "border-2 border-primary bg-primary/10"
              )}
            >
              {value[index] ? (
                <Text className="text-base-content text-2xl font-semibold">
                  {value[index]}
                </Text>
              ) : (
                active && !hasSelection && <Caret />
              )}
            </View>
          );
        })}
      </View>

      <TextInput
        {...props}
        value={value}
        onChangeText={(text) =>
          onChangeText(verificationCodeFromInput(value, text))
        }
        onSelectionChange={(e) => setSelection(e.nativeEvent.selection)}
        onFocus={(e) => {
          setFocused(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          onBlur?.(e);
        }}
        keyboardType="number-pad"
        textContentType="oneTimeCode"
        autoComplete="one-time-code"
        // Hiding the caret on Android also stops a long-press on the empty
        // field from offering Paste, so there it's only made transparent
        caretHidden={Platform.OS === "ios"}
        cursorColor="transparent"
        // A transparent color draws the selection handles in black on iOS
        selectionColor={theme.primary}
        placeholderTextColor="transparent"
        underlineColorAndroid="transparent"
        // The text is hidden and tiny, so a tap anywhere puts the caret at the
        // end, where the next digit goes
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          bottom: 0,
          left: 0,
          padding: 0,
          fontSize: 1,
          color: "transparent",
          backgroundColor: "transparent",
        }}
      />
    </View>
  );
}
