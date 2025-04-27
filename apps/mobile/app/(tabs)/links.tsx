import { useLinks } from "@linkwarden/router/links";
import {
  View,
  StyleSheet,
  Text,
  ActivityIndicator,
  FlatList,
} from "react-native";
import { Platform } from "react-native";
import useAuthStore from "@/store/auth";
import LinkListing from "@/components/LinkListing";

export default function HomeScreen() {
  const { auth } = useAuthStore();
  const { links, data } = useLinks(
    {
      sort: 0,
    },
    auth
  );

  return (
    <View>
      <FlatList
        data={links || []}
        onRefresh={() => data.refetch()}
        refreshing={data.isRefetching}
        initialNumToRender={4}
        keyExtractor={(item) => item.id?.toString() || ""}
        renderItem={({ item }) => (
          <LinkListing link={item} key={item.id?.toString()} />
        )}
        onEndReached={() => data.fetchNextPage()}
        onEndReachedThreshold={0.5}
        ItemSeparatorComponent={() => (
          <View
            style={{
              height: 1,
              backgroundColor: "#CED0CE",
              marginHorizontal: 20,
            }}
          />
        )}
        contentContainerStyle={styles.container}
      />
      <ActivityIndicator size="large" color="gray" />
    </View>
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
