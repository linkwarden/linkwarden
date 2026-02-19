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
import React, { useEffect, useState } from "react";
import Spinner from "@/components/ui/Spinner";
import { rawTheme, ThemeName } from "@/lib/colors";
import { useColorScheme } from "nativewind";
import { TagIncludingLinkCount } from "@linkwarden/types/global";
import { useTags } from "@linkwarden/router/tags";

export default function TagsScreen() {
  const { colorScheme } = useColorScheme();
  const { auth } = useAuthStore();
  const { search } = useLocalSearchParams<{ search?: string }>();

  const tagsQuery = useTags(auth);
  const tags = tagsQuery.data?.tags || [];

  const [filteredTags, setFilteredTags] = useState<TagIncludingLinkCount[]>([]);

  useEffect(() => {
    const filter =
      tags?.filter((e) =>
        e.name.includes(decodeURIComponent(search || ""))
      ) || [];

    setFilteredTags(filter);
  }, [search, tags]);

  return (
    <View
      style={styles.container}
      className="h-full bg-base-100"
      collapsable={false}
      collapsableChildren={false}
    >
      {tagsQuery.isLoading ? (
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
              refreshing={tagsQuery.isRefetching}
              onRefresh={() => tagsQuery.refetch()}
              progressBackgroundColor={
                rawTheme[colorScheme as ThemeName]["base-200"]
              }
              colors={[rawTheme[colorScheme as ThemeName]["base-content"]]}
            />
          }
          refreshing={tagsQuery.isRefetching}
          initialNumToRender={4}
          keyExtractor={(item) => item.id?.toString() || ""}
          renderItem={({ item }) => <TagListing tag={item} />}
          onEndReachedThreshold={0.5}
          ItemSeparatorComponent={() => (
            <View className="bg-neutral-content h-px" />
          )}
          ListEmptyComponent={
            <View className="flex justify-center py-10 items-center">
              <Text className="text-center text-xl text-neutral">
                Nothing found...
              </Text>
            </View>
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
