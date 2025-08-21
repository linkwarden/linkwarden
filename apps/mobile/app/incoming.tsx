import React, { useEffect, useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import useAuthStore from "@/store/auth";
import useDataStore from "@/store/data";
import { Check } from "lucide-react-native";

export default function IncomingScreen() {
  const { auth } = useAuthStore();
  const router = useRouter();
  const { data, updateData } = useDataStore();

  useEffect(() => {
    if (auth.status === "unauthenticated") {
      router.replace("/login");
      return;
    }
  }, []);

  useEffect(() => {
    let timeout = setTimeout(() => {
      updateData({
        shareIntent: {
          hasShareIntent: false,
          url: "",
        },
      });
      router.replace("/dashboard");
    }, 3000);
    return () => clearTimeout(timeout);
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.subtitle}>{String(data?.shareIntent.url)}</Text>
      {auth.status !== "unauthenticated" && data?.shareIntent.url ? (
        <View style={styles.center}>
          <Check size={140} style={styles.check} />
          <Text style={styles.title}>Link Saved!</Text>
        </View>
      ) : (
        <View style={styles.center}>
          <ActivityIndicator size="large" />
          <Text style={styles.subtitle}>
            One sec… {String(data?.shareIntent.url)}
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  check: {
    marginBottom: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: "600",
  },
  subtitle: {
    marginTop: 12,
    fontSize: 16,
    opacity: 0.7,
  },
});
