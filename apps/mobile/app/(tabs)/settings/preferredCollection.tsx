import { View, Text, FlatList, TouchableOpacity } from "react-native";
import React, { useCallback, useMemo, useState } from "react";
import useAuthStore from "@/store/auth";
import useDataStore from "@/store/data";
import { useCollections } from "@linkwarden/router/collections";
import { CollectionIncludingMembersAndLinkCount } from "@linkwarden/types";
import Input from "@/components/ui/Input";
import { Folder, Check } from "lucide-react-native";
import { useColorScheme } from "nativewind";
import { rawTheme, ThemeName } from "@/lib/colors";

const PreferredCollectionScreen = () => {
  const { auth } = useAuthStore();
  const { data, updateData } = useDataStore();
  const collections = useCollections(auth);
  const { colorScheme } = useColorScheme();
  const [searchQuery, setSearchQuery] = useState("");

  const filteredCollections = useMemo(() => {
    if (!collections.data) return [];
    const q = searchQuery.trim().toLowerCase();
    if (q === "") return collections.data;
    return collections.data.filter((col) => col.name.toLowerCase().includes(q));
  }, [collections.data, searchQuery]);

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
          paddingHorizontal: 20,
          paddingTop: 20,
          paddingBottom: 20,
        }}
        contentInsetAdjustmentBehavior="automatic"
        ListHeaderComponent={
          <Input
            placeholder="Search collections"
            className="mb-4 bg-base-200 h-10"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        }
        ListEmptyComponent={
          <Text
            style={{ textAlign: "center", marginTop: 20 }}
            className="text-neutral"
          >
            No collections match “{searchQuery}”
          </Text>
        }
      />
    </View>
  );
};

export default PreferredCollectionScreen;
