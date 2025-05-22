import { useLinks } from "@linkwarden/router/links";
import { View, StyleSheet, FlatList, Platform } from "react-native";
import useAuthStore from "@/store/auth";
import LinkListing from "@/components/LinkListing";
import { useLocalSearchParams } from "expo-router";
import React from "react";
import { LinkIncludingShortenedCollectionAndTags } from "@linkwarden/types";

const RenderItem = React.memo(
  ({ item }: { item: LinkIncludingShortenedCollectionAndTags }) => {
    return <LinkListing link={item} />;
  }
);

export default function LinksScreen() {
  const { auth } = useAuthStore();
  const { search } = useLocalSearchParams<{ search?: string }>();

  const { links, data } = useLinks(
    {
      sort: 0,
      searchQueryString: search ?? search,
    },
    auth
  );

  return (
    <View>
      <FlatList
        ListHeaderComponent={() => <></>}
        data={links || []}
        onRefresh={() => data.refetch()}
        refreshing={data.isRefetching}
        initialNumToRender={4}
        keyExtractor={(item) => item.id?.toString() || ""}
        renderItem={({ item }) => (
          <RenderItem item={item} key={item.id?.toString()} />
        )}
        onEndReached={() => data.fetchNextPage()}
        onEndReachedThreshold={0.5}
        ItemSeparatorComponent={() => (
          <View
            style={{
              height: 1,
              backgroundColor: "#eee",
            }}
          />
        )}
        contentContainerStyle={styles.container}
      />
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
