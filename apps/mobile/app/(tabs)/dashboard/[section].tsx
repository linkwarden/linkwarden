import { useLinks } from "@linkwarden/router/links";
import {
  View,
  StyleSheet,
  FlatList,
  Platform,
  ActivityIndicator,
  Text,
  ViewToken,
} from "react-native";
import useAuthStore from "@/store/auth";
import LinkListing from "@/components/LinkListing";
import { useLocalSearchParams, useNavigation } from "expo-router";
import React, { useEffect, useMemo } from "react";
import { LinkIncludingShortenedCollectionAndTags } from "@linkwarden/types";
import { useCollections } from "@linkwarden/router/collections";
import Spinner from "@/components/ui/Spinner";
import { rawTheme, ThemeName } from "@/lib/colors";
import { useColorScheme } from "nativewind";

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
  const { colorScheme } = useColorScheme();

  const navigation = useNavigation();
  const collections = useCollections(auth);

  const title = useMemo(() => {
    if (section === "pinned-links") return "Pinned Links";
    if (section === "recent-links") return "Recent Links";

    if (section === "collection") {
      return (
        collections.data?.find((c) => c.id?.toString() === collectionId)
          ?.name || "Collection"
      );
    }

    return "Links";
  }, [section, collections.data, collectionId]);

  useEffect(() => {
    navigation.setOptions({
      headerTitle: title,
      headerSearchBarOptions: {
        placeholder: `Search ${title}`,
      },
    });
  }, [title, navigation]);

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
      {data.isLoading ? (
        <View className="flex justify-center h-full items-center">
          <ActivityIndicator size="large" />
          <Text className="text-base mt-2.5 text-neutral">Loading...</Text>
        </View>
      ) : (
        <FlatList
          contentInsetAdjustmentBehavior="automatic"
          ListHeaderComponent={() => <></>}
          data={links || []}
          refreshControl={
            <Spinner
              refreshing={data.isRefetching}
              onRefresh={() => data.refetch()}
              progressBackgroundColor={
                rawTheme[colorScheme as ThemeName]["base-200"]
              }
              colors={[rawTheme[colorScheme as ThemeName]["base-content"]]}
            />
          }
          initialNumToRender={4}
          keyExtractor={(item) => item.id?.toString() || ""}
          renderItem={({ item }) => (
            <RenderItem item={item} key={item.id?.toString()} />
          )}
          onEndReached={() => data.fetchNextPage()}
          onEndReachedThreshold={0.5}
          ItemSeparatorComponent={() => <View className="bg-base-200 h-px" />}
          ListEmptyComponent={
            <View className="flex justify-center py-10 items-center">
              <Text className="text-center text-xl text-neutral">
                Nothing found...
              </Text>
            </View>
          }
          onViewableItemsChanged={({
            viewableItems,
          }: {
            viewableItems: ViewToken[];
          }) => {
            const links = viewableItems.map(
              (e) => e.item
            ) as LinkIncludingShortenedCollectionAndTags[];

            if (links.some((e) => e.id && !e.preview)) {
              data.refetch();
            }
          }}
          viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
        />
      )}
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
