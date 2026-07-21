import { View, FlatList, Text, ActivityIndicator } from "react-native";
import useAuthStore from "@/store/auth";
import EmptyState from "@/components/EmptyState";
import CollectionListing from "@/components/CollectionListing";
import { useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import Spinner from "@/components/ui/Spinner";
import { rawTheme, ThemeName } from "@/lib/colors";
import { useColorScheme } from "nativewind";
import { useCollections } from "@linkwarden/router/collections";
import { CollectionIncludingMembersAndLinkCount } from "@linkwarden/types/global";

export default function CollectionsScreen() {
  const { colorScheme } = useColorScheme();
  const { auth } = useAuthStore();
  const { search } = useLocalSearchParams<{ search?: string }>();

  const collections = useCollections(auth);

  const [filteredCollections, setFilteredCollections] = useState<
    CollectionIncludingMembersAndLinkCount[]
  >([]);

  useEffect(() => {
    const filter =
      collections.data?.filter((e) =>
        e.name.includes(decodeURIComponent(search || ""))
      ) || [];

    setFilteredCollections(filter);
  }, [search, collections.data]);

  const refreshControl = (
    <Spinner
      refreshing={collections.isRefetching}
      onRefresh={() => collections.refetch()}
      progressBackgroundColor={rawTheme[colorScheme as ThemeName].neutral}
      colors={[rawTheme[colorScheme as ThemeName]["base-content"]]}
    />
  );

  return (
    <View
      className="h-full bg-base-100"
      collapsable={false}
      collapsableChildren={false}
    >
      {collections.isLoading ? (
        <View className="flex justify-center h-screen items-center">
          <ActivityIndicator size="large" />
          <Text className="text-base mt-2.5 text-neutral">Loading...</Text>
        </View>
      ) : filteredCollections.length === 0 ? (
        <EmptyState refreshControl={refreshControl} />
      ) : (
        <FlatList
          contentInsetAdjustmentBehavior="automatic"
          ListHeaderComponent={() => <></>}
          data={filteredCollections}
          refreshControl={refreshControl}
          refreshing={collections.isRefetching}
          initialNumToRender={4}
          keyExtractor={(item) => item.id?.toString() || ""}
          renderItem={({ item }) => <CollectionListing collection={item} />}
          onEndReachedThreshold={0.5}
          ItemSeparatorComponent={() => (
            <View className="bg-neutral-content h-px" />
          )}
        />
      )}
    </View>
  );
}
