import { useEffect, useRef } from "react";
import { ActivityIndicator, Modal, Platform, View } from "react-native";
import { WebView } from "react-native-webview";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColorScheme } from "nativewind";
import { rawTheme, ThemeName } from "@/lib/colors";
import SheetHeader from "./ActionSheets/SheetHeader";

type WebViewModalProps = {
  visible: boolean;
  onClose: () => void;
  title: string;
  uri: string;
  sessionToken?: string | null;
};

const buildSessionCookieScript = (sessionToken: string, uri: string) => `
  (function () {
    try {
      var secure = window.location.protocol === "https:";
      var name = (secure ? "__Secure-" : "") + "next-auth.session-token";
      document.cookie =
        name +
        "=" +
        ${JSON.stringify(sessionToken)} +
        "; path=/; SameSite=Lax" +
        (secure ? "; Secure" : "");
      if (window.location.pathname.indexOf("/login") === 0) {
        window.location.replace(${JSON.stringify(uri)});
      }
    } catch (e) {}
  })();
  true;
`;

export default function WebViewModal({
  visible,
  onClose,
  title,
  uri,
  sessionToken,
}: WebViewModalProps) {
  const insets = useSafeAreaInsets();
  const { colorScheme } = useColorScheme();
  const webViewRef = useRef<WebView>(null);
  const recoveredFromLogin = useRef(false);

  useEffect(() => {
    if (visible) recoveredFromLogin.current = false;
  }, [visible]);

  const sessionCookieScript = sessionToken
    ? buildSessionCookieScript(sessionToken, uri)
    : undefined;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View
        style={{
          flex: 1,
          paddingTop: insets.top,
          paddingBottom: Platform.OS === "android" ? insets.bottom : undefined,
        }}
        className="bg-base-100"
      >
        <SheetHeader
          title={title}
          onClose={onClose}
          titleClassName="text-2xl"
          align="left"
        />
        {visible && (
          <WebView
            ref={webViewRef}
            source={{ uri }}
            className="flex-1"
            incognito={true}
            startInLoadingState
            renderLoading={() => (
              <View className="absolute inset-0 items-center justify-center bg-base-100">
                <ActivityIndicator
                  size="large"
                  color={rawTheme[colorScheme as ThemeName].neutral}
                />
              </View>
            )}
            injectedJavaScriptBeforeContentLoaded={sessionCookieScript}
            onNavigationStateChange={
              sessionCookieScript
                ? (navState) => {
                    if (
                      !recoveredFromLogin.current &&
                      navState.url.includes("/login")
                    ) {
                      recoveredFromLogin.current = true;
                      webViewRef.current?.injectJavaScript(sessionCookieScript);
                    }
                  }
                : undefined
            }
          />
        )}
      </View>
    </Modal>
  );
}
