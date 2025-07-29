import useAuthStore from "@/store/auth";
import { Redirect } from "expo-router";
import { useEffect } from "react";

export default function HomeScreen() {
  const { setAuth, auth } = useAuthStore();

  useEffect(() => {
    setAuth();
  }, []);

  if (auth.session) {
    return <Redirect href="/(tabs)/dashboard" />;
  } else {
    return <Redirect href="/login" />;
  }
}
