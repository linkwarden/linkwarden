import { useLinks } from "@linkwarden/router/links";
import { View, StyleSheet, FlatList, Platform } from "react-native";
import useAuthStore from "@/store/auth";
import LinkListing from "@/components/LinkListing";
import { useLocalSearchParams, useNavigation } from "expo-router";
import React, { useEffect, useState } from "react";
import { LinkIncludingShortenedCollectionAndTags } from "@linkwarden/types";
import { useCollections } from "@linkwarden/router/collections";

const RenderItem = React.memo(
  ({ item }: { item: LinkIncludingShortenedCollectionAndTags }) => {
    return <LinkListing link={item} />;
  }
);

export default function LinksScreen() {
  const { auth } = useAuthStore();
  const { search, section, collectionId } = useLocalSearchParams<{
    search?: string;
    section?: "pinned-links" | "recent-links" | "collection";
    collectionId?: string;
  }>();

  const navigation = useNavigation();
  const collections = useCollections(auth);

  useEffect(() => {
    navigation.setOptions({
      headerTitle:
        section === "pinned-links"
          ? "Pinned Links"
          : section === "recent-links"
            ? "Recent Links"
            : section === "collection"
              ? collections.data?.find((c) => c.id?.toString() === collectionId)
                  ?.name || "Collection"
              : "Links",
    });
  }, [section, navigation]);

  const { links, data } = useLinks(
    {
      sort: 0,
      searchQueryString: decodeURIComponent(search ?? ""),
      collectionId: Number(collectionId),
      pinnedOnly: section === "pinned-links",
    },
    auth
  );

  return (
    <View
      style={styles.container}
      className="h-full bg-base-100"
      collapsable={false}
      collapsableChildren={false}
    >
      <FlatList
        contentInsetAdjustmentBehavior="automatic"
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
        ItemSeparatorComponent={() => <View className="bg-base-200 h-px" />}
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
