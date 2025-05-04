import { View, StyleSheet, ActivityIndicator, Text } from "react-native";
import { WebView } from "react-native-webview";
import useAuthStore from "@/store/auth";
import { useLocalSearchParams } from "expo-router";
import { useGetLink } from "@linkwarden/router/links";
import { useUser } from "@linkwarden/router/user";
import { useEffect, useState } from "react";
import { generateLinkHref } from "@linkwarden/lib/generateLinkHref";

export default function HomeScreen() {
  const { auth } = useAuthStore();
  const { id } = useLocalSearchParams();
  const getLink = useGetLink(false, auth);
  const { data: user } = useUser(auth);
  const [url, setUrl] = useState<string>();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchLinkData() {
      const link = await getLink.mutateAsync({ id: Number(id) });

      if (link) {
        setUrl(generateLinkHref(link, user[0], auth.instance, true));
      }
    }

    if (user[0]?.id && !url) {
      fetchLinkData();
    }
  }, [user, url]);

  return (
    <View style={styles.container}>
      {url && (
        <WebView
          style={{
            ...(isLoading
              ? {
                  opacity: 0,
                }
              : {
                  flex: 1,
                }),
          }}
          source={{
            uri: url,
            headers: { Authorization: `Bearer ${auth.session}` },
          }}
          onLoadEnd={() => setIsLoading(false)}
        />
      )}
      {isLoading && (
        <View
          style={{
            flex: 1,
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: "#fff",
            padding: 20,
          }}
        >
          <ActivityIndicator size="large" color="gray" />
          <Text
            style={{
              fontSize: 16,
              marginTop: 10,
              color: "gray",
            }}
          >
            Loading...
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
