import useAuthStore from "@/store/auth";
import { Link } from "expo-router";
import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
} from "react-native";

export default function HomeScreen() {
  const { signIn } = useAuthStore();
  const [form, setForm] = useState({
    user: "",
    password: "",
    instance: "",
  });

  return (
    <View style={styles.container}>
      <Text>Login</Text>
      <View
        style={{
          flexDirection: "column",
          justifyContent: "space-between",
          marginVertical: 10,
          gap: 10,
        }}
      >
        <TextInput
          style={{
            height: 40,
            width: 250,
            borderRadius: 5,
            padding: 10,
            borderColor: "gray",
            borderWidth: 1,
          }}
          placeholder="Username"
          value={form.user}
          onChangeText={(text) => setForm({ ...form, user: text })}
        />
        <TextInput
          style={{
            height: 40,
            width: 250,
            borderRadius: 5,
            padding: 10,
            borderColor: "gray",
            borderWidth: 1,
          }}
          placeholder="Password"
          secureTextEntry
          value={form.password}
          onChangeText={(text) => setForm({ ...form, password: text })}
        />
        <TouchableOpacity
          style={{
            backgroundColor: "#000000",
            padding: 10,
            borderRadius: 5,
          }}
          onPress={() =>
            signIn(
              form.user,
              form.password,
              form.instance ? form.instance : undefined
            )
          }
        >
          <Text style={{ color: "#fff", textAlign: "center" }}>Login</Text>
        </TouchableOpacity>
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
