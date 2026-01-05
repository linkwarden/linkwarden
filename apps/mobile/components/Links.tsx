import {
  View,
  FlatList,
  Text,
  ActivityIndicator,
  ViewToken,
} from "react-native";
import LinkListing from "@/components/LinkListing";
import React, { useState } from "react";
import { LinkIncludingShortenedCollectionAndTags } from "@linkwarden/types";
import Spinner from "@/components/ui/Spinner";
import { rawTheme, ThemeName } from "@/lib/colors";
import { useColorScheme } from "nativewind";

const RenderItem = React.memo(
  ({ item }: { item: LinkIncludingShortenedCollectionAndTags }) => {
    return <LinkListing link={item} />;
  }
);

type Props = {
  links: LinkIncludingShortenedCollectionAndTags[];
  data: any;
};

export default function Links({ links, data }: Props) {
  const { colorScheme } = useColorScheme();
  const [promptedRefetch, setPromptedRefetch] = useState(false);

  return data.isLoading ? (
    <View className="flex justify-center h-screen items-center">
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
          refreshing={data.isRefetching && promptedRefetch}
          onRefresh={async () => {
            setPromptedRefetch(true);
            await data.refetch();
            setPromptedRefetch(false);
          }}
          progressBackgroundColor={
            rawTheme[colorScheme as ThemeName]["base-200"]
          }
          colors={[rawTheme[colorScheme as ThemeName]["base-content"]]}
        />
      }
      refreshing={data.isRefetching && promptedRefetch}
      initialNumToRender={4}
      keyExtractor={(item) => item.id?.toString() || ""}
      renderItem={({ item }) => (
        <RenderItem item={item} key={item.id?.toString()} />
      )}
      onEndReached={() => data.fetchNextPage()}
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
      onViewableItemsChanged={({
        viewableItems,
      }: {
        viewableItems: ViewToken[];
      }) => {
        const links = viewableItems.map(
          (e) => e.item
        ) as LinkIncludingShortenedCollectionAndTags[];

        if (!data.isRefetching && links.some((e) => e.id && !e.preview))
          data.refetch();
      }}
      viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
    />
  );
}
