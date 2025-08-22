import useAuthStore from "@/store/auth";
import { Redirect } from "expo-router";

export default function HomeScreen() {
  const { auth } = useAuthStore();

  if (auth.session) {
    return <Redirect href="/(tabs)/dashboard" />;
  } else {
    return <Redirect href="/login" />;
  }
}
