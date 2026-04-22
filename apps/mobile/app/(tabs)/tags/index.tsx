import {
  View,
  StyleSheet,
  FlatList,
  Platform,
  Text,
  ActivityIndicator,
} from "react-native";
import useAuthStore from "@/store/auth";
import TagListing from "@/components/TagListing";
import { useLocalSearchParams } from "expo-router";
import React, { useMemo } from "react";
import Spinner from "@/components/ui/Spinner";
import { rawTheme, ThemeName } from "@/lib/colors";
import { useColorScheme } from "nativewind";
import { TagSort } from "@linkwarden/types/global";
import { useTags } from "@linkwarden/router/tags";
import { isAtLeastInstanceVersion, useConfig } from "@linkwarden/router/config";

const MIN_TAG_SEARCH_VERSION = "2.14.1";

const decodeSearchParam = (value?: string) => {
  if (!value) return "";

  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
};

export default function TagsScreen() {
  const { colorScheme } = useColorScheme();
  const { auth } = useAuthStore();
  const { search } = useLocalSearchParams<{ search?: string }>();
  const config = useConfig(auth);
  const searchQuery = decodeSearchParam(search);
  const supportsTagSearch = isAtLeastInstanceVersion(
    config.data?.INSTANCE_VERSION,
    MIN_TAG_SEARCH_VERSION
  );

  const tags = useTags(auth, {
    sort: TagSort.NameAZ,
    search: supportsTagSearch ? searchQuery : undefined,
  });
  const filteredTags = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    if (q === "") return tags.data;

    return tags.data.filter((tag) => tag.name.toLowerCase().includes(q));
  }, [searchQuery, tags.data]);

  return (
    <View
      style={styles.container}
      className="h-full bg-base-100"
      collapsable={false}
      collapsableChildren={false}
    >
      {tags.isLoading ? (
        <View className="flex justify-center h-screen items-center">
          <ActivityIndicator size="large" />
          <Text className="text-base mt-2.5 text-neutral">Loading...</Text>
        </View>
      ) : (
        <FlatList
          contentInsetAdjustmentBehavior="automatic"
          ListHeaderComponent={() => <></>}
          data={filteredTags}
          refreshControl={
            <Spinner
              refreshing={tags.isRefetching}
              onRefresh={() => tags.refetch()}
              progressBackgroundColor={
                rawTheme[colorScheme as ThemeName]["base-200"]
              }
              colors={[rawTheme[colorScheme as ThemeName]["base-content"]]}
            />
          }
          refreshing={tags.isRefetching}
          initialNumToRender={4}
          keyExtractor={(item) => item.id?.toString() || ""}
          renderItem={({ item }) => <TagListing tag={item} />}
          onEndReached={() => {
            if (!tags.hasNextPage || tags.isFetchingNextPage) return;
            tags.fetchNextPage();
          }}
          onEndReachedThreshold={0.5}
          ItemSeparatorComponent={() => (
            <View className="bg-neutral-content h-px" />
          )}
          ListFooterComponent={
            tags.isFetchingNextPage ? (
              <View className="py-4 items-center">
                <ActivityIndicator size="small" />
              </View>
            ) : null
          }
          ListEmptyComponent={
            tags.isFetching ? null : (
              <View className="flex justify-center py-10 items-center">
                <Text className="text-center text-xl text-neutral">
                  Nothing found...
                </Text>
              </View>
            )
          }
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
