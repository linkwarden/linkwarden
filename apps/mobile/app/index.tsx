import useAuthStore from "@/store/auth";
import useDataStore from "@/store/data";
import { Redirect } from "expo-router";
import { useEffect } from "react";

export default function HomeScreen() {
  const { setAuth, auth } = useAuthStore();
  const { setData } = useDataStore();

  useEffect(() => {
    setAuth();
    setData();
  }, []);

  if (auth.session) {
    return <Redirect href="/(tabs)/dashboard" />;
  } else {
    return <Redirect href="/login" />;
  }
}
