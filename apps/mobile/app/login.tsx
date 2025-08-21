import { Button } from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import useAuthStore from "@/store/auth";
import { Redirect } from "expo-router";
import { useState } from "react";
import { View, Text, StyleSheet } from "react-native";

export default function HomeScreen() {
  const { auth, signIn } = useAuthStore();
  const [form, setForm] = useState({
    user: "",
    password: "",
    instance: "",
  });

  if (auth.status === "authenticated") {
    return <Redirect href="/dashboard" />;
  }

  return (
    <View style={styles.container}>
      <Text className="text-base-content">Login</Text>
      <View
        style={{
          flexDirection: "column",
          justifyContent: "space-between",
          marginVertical: 10,
          gap: 10,
        }}
      >
        <Input
          className="w-72"
          placeholder="Username"
          value={form.user}
          onChangeText={(text) => setForm({ ...form, user: text })}
        />
        <Input
          className="w-72"
          placeholder="Password"
          secureTextEntry
          value={form.password}
          onChangeText={(text) => setForm({ ...form, password: text })}
        />
        <Button
          variant="accent"
          onPress={() =>
            signIn(
              form.user,
              form.password,
              form.instance ? form.instance : undefined
            )
          }
        >
          <Text className="text-white">Login</Text>
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
