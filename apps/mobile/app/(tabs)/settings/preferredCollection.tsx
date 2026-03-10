import { View, Text, FlatList, TouchableOpacity, Platform } from "react-native";
import React, { useCallback, useEffect, useState } from "react";
import useAuthStore from "@/store/auth";
import useDataStore from "@/store/data";
import { useCollections } from "@linkwarden/router/collections";
import { CollectionIncludingMembersAndLinkCount } from "@linkwarden/types/global";
import { Folder, Check } from "lucide-react-native";
import { useColorScheme } from "nativewind";
import { rawTheme, ThemeName } from "@/lib/colors";
import { useLocalSearchParams } from "expo-router";
import { useHeaderHeight } from "@react-navigation/elements";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const PreferredCollectionScreen = () => {
  const { auth } = useAuthStore();
  const { data, updateData } = useDataStore();
  const collections = useCollections(auth);
  const { colorScheme } = useColorScheme();
  const { search } = useLocalSearchParams<{ search?: string }>();
  const [filteredCollections, setFilteredCollections] = useState<
    CollectionIncludingMembersAndLinkCount[]
  >([]);
  const headerHeight = useHeaderHeight();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    const filter =
      collections.data?.filter((e) =>
        e.name
          .toLowerCase()
          .includes(decodeURIComponent(search?.toLowerCase() || ""))
      ) || [];

    setFilteredCollections(filter);
  }, [search, collections.data]);

  const renderCollection = useCallback(
    ({
      item: collection,
    }: {
      item: CollectionIncludingMembersAndLinkCount;
    }) => {
      const isSelected = data.preferredCollection?.id === collection.id;

      return (
        <TouchableOpacity
          className="bg-base-200 rounded-lg px-4 py-3 mb-3 flex-row items-center justify-between"
          onPress={() => updateData({ preferredCollection: collection })}
        >
          <View className="flex-row items-center gap-2 w-[70%]">
            <Folder
              size={20}
              fill={collection.color || "gray"}
              color={collection.color || "gray"}
            />
            <Text numberOfLines={1} className="text-base-content">
              {collection.name}
            </Text>
          </View>
          <View className="flex-row items-center gap-2">
            {isSelected ? (
              <Check
                size={16}
                color={rawTheme[colorScheme as ThemeName].primary}
              />
            ) : null}
            <Text className="text-neutral">
              {collection._count?.links ?? 0}
            </Text>
          </View>
        </TouchableOpacity>
      );
    },
    [colorScheme, data.preferredCollection?.id, updateData]
  );

  return (
    <View className="flex-1 bg-base-100">
      <FlatList
        data={filteredCollections}
        keyExtractor={(item) => item.id?.toString() || ""}
        renderItem={renderCollection}
        contentContainerStyle={{
          paddingHorizontal: 16,
          flexGrow: 1,
          paddingTop: Platform.OS === "ios" ? headerHeight + 10 : 10,
          paddingBottom: insets.bottom + 60,
        }}
        ListEmptyComponent={
          <View
            style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
          >
            <Text className="text-neutral text-center">
              No collections match “{search}”
            </Text>
          </View>
        }
      />
    </View>
  );
};

export default PreferredCollectionScreen;
