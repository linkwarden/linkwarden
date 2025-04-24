import useAuthStore from "@/store/auth";
import { Redirect, router } from "expo-router";
import { useEffect } from "react";
import { View, Text, StyleSheet, Button } from "react-native";

export default function HomeScreen() {
  const { setAuth, auth } = useAuthStore();

  useEffect(() => {
    setAuth();
  }, []);

  if (auth.session) {
    return <Redirect href="/(tabs)" />;
  } else {
    return <Redirect href="/login" />;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
