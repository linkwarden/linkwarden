import { View, Text, Alert, TouchableOpacity } from "react-native";
import { useCallback, useEffect, useMemo, useState } from "react";
import ActionSheet, {
  FlatList,
  Route,
  SheetManager,
  SheetProps,
  useSheetRouteParams,
  useSheetRouter,
} from "react-native-actions-sheet";
import Input from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useAddLink, useUpdateLink } from "@linkwarden/router/links";
import useAuthStore from "@/store/auth";
import {
  CollectionIncludingMembersAndLinkCount,
  LinkIncludingShortenedCollectionAndTags,
  TagIncludingLinkCount,
} from "@linkwarden/types/global";
import { useCollections } from "@linkwarden/router/collections";
import { rawTheme, ThemeName } from "@/lib/colors";
import { useColorScheme } from "nativewind";
import { Folder, ChevronRight, ChevronLeft, Check } from "lucide-react-native";
import useTmpStore from "@/store/tmp";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTags } from "@linkwarden/router/tags";

const Main = (props: SheetProps<"edit-link-sheet">) => {
  const { auth } = useAuthStore();

  const params = useSheetRouteParams("edit-link-sheet", "main");

  const [link, setLink] = useState<
    LinkIncludingShortenedCollectionAndTags | undefined
  >(props.payload?.link);
  const updateLink = useUpdateLink({ auth, Alert });
  const router = useSheetRouter("edit-link-sheet");
  const { colorScheme } = useColorScheme();

  useEffect(() => {
    if (params?.link) {
      setLink(params.link);
    }
  }, [params?.link]);

  const { tmp, updateTmp } = useTmpStore();

  return (
    <View className="px-8 py-5">
      <Text className="font-semibold text-lg mx-auto mb-5 text-base-content">
        Edit Link
      </Text>

      <Input
        placeholder="Name"
        className="mb-4 bg-base-100"
        value={link?.name || ""}
        onChangeText={(text) => link?.id && setLink({ ...link, name: text })}
      />

      {props.payload?.link?.url && (
        <Input
          placeholder="URL"
          className="mb-4 bg-base-100"
          value={link?.url || ""}
          onChangeText={(text) => link?.id && setLink({ ...link, url: text })}
        />
      )}

      <Button
        variant="input"
        className="mb-4"
        onPress={() => router?.navigate("collections", { link })}
      >
        <View className="flex-row items-center gap-2 w-[90%]">
          <Folder
            size={20}
            fill={link?.collection.color || "gray"}
            color={link?.collection.color || "gray"}
          />
          <Text numberOfLines={1} className="w-[90%] text-base-content">
            {link?.collection.name}
          </Text>
        </View>
        <ChevronRight
          size={16}
          color={rawTheme[colorScheme as ThemeName]["neutral"]}
        />
      </Button>

      <Button
        variant="input"
        className="mb-4 h-auto"
        onPress={() => router?.navigate("tags", { link })}
      >
        {link?.tags && link?.tags.length > 0 ? (
          <View className="flex-row flex-wrap items-center gap-2 w-[90%]">
            {link.tags.map((tag) => (
              <View
                key={tag.id}
                className="bg-neutral rounded-md h-7 px-2 py-1"
              >
                <Text numberOfLines={1} className="text-base-100">
                  {tag.name}
                </Text>
              </View>
            ))}
          </View>
        ) : (
          <Text className="text-neutral">No tags</Text>
        )}
        <ChevronRight size={16} color={"gray"} />
      </Button>

      <Input
        multiline
        textAlignVertical="top"
        placeholder="Description"
        className="mb-4 h-28 bg-base-100"
        value={link?.description || ""}
        onChangeText={(text) =>
          link?.id && setLink({ ...link, description: text })
        }
      />

      <Button
        onPress={() => {
          updateLink.mutate(link as LinkIncludingShortenedCollectionAndTags);
          if (link && tmp.link)
            updateTmp({
              link,
            });
          SheetManager.hide("edit-link-sheet");
        }}
        isLoading={updateLink.isPending}
        variant="accent"
        className="mb-2"
      >
        <Text className="text-white">Save</Text>
      </Button>

      <Button
        onPress={() => {
          SheetManager.hide("edit-link-sheet");
        }}
        variant="outline"
        className="mb-2"
      >
        <Text className="text-base-content">Cancel</Text>
      </Button>
    </View>
  );
};

const Collections = () => {
  const { auth } = useAuthStore();
  const addLink = useAddLink({ auth });
  const [searchQuery, setSearchQuery] = useState("");
  const router = useSheetRouter("edit-link-sheet");
  const { link: currentLink } = useSheetRouteParams<
    "edit-link-sheet",
    "collections"
  >("edit-link-sheet", "collections");
  const params = useSheetRouteParams("edit-link-sheet", "collections");
  const collections = useCollections(auth);
  const { colorScheme } = useColorScheme();

  const filteredCollections = useMemo(() => {
    if (!collections.data) return [];
    const q = searchQuery.trim().toLowerCase();
    if (q === "") return collections.data;
    return collections.data.filter((col) => col.name.toLowerCase().includes(q));
  }, [collections.data, searchQuery]);

  const renderItem = useCallback(
    ({
      item: collection,
    }: {
      item: CollectionIncludingMembersAndLinkCount;
    }) => {
      const onSelect = () => {
        const updatedLink = {
          ...currentLink,
          collection,
        };

        router?.popToTop();
        router?.navigate("main", { link: updatedLink });
      };

      return (
        <Button variant="input" className="mb-2" onPress={onSelect}>
          <View className="flex-row items-center gap-2 w-[75%]">
            <Folder
              size={20}
              fill={collection.color || "gray"}
              color={collection.color || "gray"}
            />
            <Text numberOfLines={1} className="w-full text-base-content">
              {collection.name}
            </Text>
          </View>
          <View className="flex-row items-center gap-2">
            {params.link?.collection.id === collection.id && (
              <Check
                size={16}
                color={rawTheme[colorScheme as ThemeName].primary}
              />
            )}
            <Text className="text-neutral">
              {collection._count?.links ?? 0}
            </Text>
          </View>
        </Button>
      );
    },
    [addLink, params.link, router]
  );

  return (
    <View className="py-5 max-h-[80vh]">
      <TouchableOpacity
        className="flex-row items-center gap-1 top-6 left-8 absolute"
        onPress={() => {
          router?.popToTop();
          router?.navigate("main", { link: currentLink });
        }}
      >
        <ChevronLeft
          size={18}
          color={rawTheme[colorScheme as ThemeName]["primary"]}
        />
        <Text className="text-primary">Back</Text>
      </TouchableOpacity>
      <Text className="font-semibold text-lg mx-auto mb-5 text-base-content">
        Collection
      </Text>
      <Input
        placeholder="Search collections"
        className="mb-4 bg-base-100 mx-8"
        value={searchQuery}
        onChangeText={setSearchQuery}
      />

      <FlatList
        data={[...filteredCollections]}
        keyExtractor={(e, i) => i.toString()}
        renderItem={renderItem}
        ListEmptyComponent={
          <Text
            style={{ textAlign: "center", marginTop: 20 }}
            className="text-neutral"
          >
            No collections match “{searchQuery}”
          </Text>
        }
        contentContainerClassName="px-8"
      />
    </View>
  );
};

const Tags = () => {
  const { auth } = useAuthStore();
  const addLink = useAddLink({ auth });
  const [searchQuery, setSearchQuery] = useState("");
  const router = useSheetRouter("edit-link-sheet");
  const params = useSheetRouteParams("edit-link-sheet", "tags");
  const tags = useTags(auth);
  const { colorScheme } = useColorScheme();
  const [updatedLink, setUpdatedLink] =
    useState<LinkIncludingShortenedCollectionAndTags>(params.link);

  const filteredTags = useMemo(() => {
    if (!tags.data) return [];
    const q = searchQuery.trim().toLowerCase();
    if (q === "") return tags.data;
    return tags.data.filter((tag) => tag.name.toLowerCase().includes(q));
  }, [tags.data, searchQuery]);

  const renderItem = useCallback(
    ({ item: tag }: { item: TagIncludingLinkCount }) => {
      const onSelect = () => {
        const isSelected = (updatedLink?.tags || []).some(
          (t) => t.id === tag.id
        );
        const nextTags = isSelected
          ? (updatedLink?.tags || []).filter((t) => t.id !== tag.id)
          : [...(updatedLink?.tags || []), tag];

        setUpdatedLink({
          ...updatedLink,
          tags: nextTags,
        });
      };

      return (
        <Button variant="input" className="mb-2" onPress={onSelect}>
          <View className="flex-row items-center gap-2 w-[75%]">
            <Text numberOfLines={1} className="w-full text-base-content">
              {tag.name}
            </Text>
          </View>
          <View className="flex-row items-center gap-2">
            {updatedLink?.tags.find((e) => e.id === tag.id) && (
              <Check
                size={16}
                color={rawTheme[colorScheme as ThemeName].primary}
              />
            )}
            <Text className="text-neutral">{tag._count?.links ?? 0}</Text>
          </View>
        </Button>
      );
    },
    [addLink, params.link, router]
  );

  return (
    <View className="py-5 max-h-[80vh]">
      <TouchableOpacity
        className="flex-row items-center gap-1 top-6 left-8 absolute"
        onPress={() => {
          router?.popToTop();
          router?.navigate("main", { link: updatedLink });
        }}
      >
        <ChevronLeft
          size={18}
          color={rawTheme[colorScheme as ThemeName]["primary"]}
        />
        <Text className="text-primary">Back</Text>
      </TouchableOpacity>
      <Text className="font-semibold text-lg mx-auto mb-5 text-base-content">
        Tags
      </Text>
      <Input
        placeholder="Search tags"
        className="mb-4 bg-base-100 mx-8"
        value={searchQuery}
        onChangeText={setSearchQuery}
      />

      <FlatList
        data={filteredTags}
        keyExtractor={(e, i) => i.toString()}
        renderItem={renderItem}
        ListEmptyComponent={
          <Text
            style={{ textAlign: "center", marginTop: 20 }}
            className="text-neutral"
          >
            No tags match “{searchQuery}”
          </Text>
        }
        contentContainerClassName="px-8"
      />
    </View>
  );
};

const routes: Route[] = [
  {
    name: "main",
    component: Main,
  },
  {
    name: "collections",
    component: Collections,
  },
  {
    name: "tags",
    component: Tags,
  },
];

export default function EditLinkSheet() {
  const { colorScheme } = useColorScheme();

  const insets = useSafeAreaInsets();

  return (
    <ActionSheet
      gestureEnabled
      indicatorStyle={{
        display: "none",
      }}
      routes={routes}
      initialRoute="main"
      containerStyle={{
        backgroundColor: rawTheme[colorScheme as ThemeName]["base-200"],
      }}
      safeAreaInsets={insets}
    />
  );
}
