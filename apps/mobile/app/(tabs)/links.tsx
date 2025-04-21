import { useLinks } from "@/hooks/store/links";
import { View, Text, StyleSheet, VirtualizedList } from "react-native";
import { Platform } from "react-native";

export default function HomeScreen() {
  const { links, data } = useLinks({
    sort: 0,
  });

  const getItem = (data: any, index: number) => data[index];

  const getItemCount = (data: any) => data.length;

  return (
    <VirtualizedList
      data={links || []}
      initialNumToRender={4}
      keyExtractor={(item) => item.id.toString()}
      renderItem={({ item }) => (
        <View
          style={{
            padding: 20,
          }}
        >
          <Text
            style={{
              fontWeight: "bold",
              fontSize: 18,
            }}
          >
            {item.name || item.description || item.url}
          </Text>
          <Text>{item.url}</Text>
        </View>
      )}
      getItem={getItem}
      getItemCount={getItemCount}
      contentContainerStyle={styles.container}
    />
  );
}

const styles = StyleSheet.create({
  container: Platform.select({
    ios: {
      paddingBottom: 83,
    },
    default: {},
  }),
});
