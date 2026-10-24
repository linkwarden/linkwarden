import { Alert, Image, Text, TouchableOpacity, View } from "react-native";
import { useCallback, useEffect, useMemo, useState } from "react";
import ActionSheet, {
  FlatList,
  Route,
  SheetManager,
  SheetProps,
  useSheetRouteParams,
  useSheetRouter,
} from "react-native-actions-sheet";
import * as ImagePicker from "expo-image-picker";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Folder,
  ImageUp,
  Plus,
} from "lucide-react-native";
import Input from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useAddLink, useUpdateFile } from "@linkwarden/router/links";
import { useCollections } from "@linkwarden/router/collections";
import { useTags } from "@linkwarden/router/tags";
import { isAtLeastInstanceVersion, useConfig } from "@linkwarden/router/config";
import {
  CollectionIncludingMembersAndLinkCount,
  TagSort,
} from "@linkwarden/types/global";
import useAuthStore from "@/store/auth";
import { rawTheme, ThemeName } from "@/lib/colors";
import { seedFormatCache } from "@/lib/cache";
import { useColorScheme } from "nativewind";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import SheetHeader from "./SheetHeader";

const MIN_TAG_SEARCH_VERSION = "2.14.1";

export type NewLinkDraft = {
  url: string;
  name: string;
  description: string;
  collection?: { id?: number; name?: string };
  tags: { id?: number; name: string }[];
};

type DraftTag = NewLinkDraft["tags"][number] & { _count?: { links: number } };

const Main = (props: SheetProps<"add-link-sheet">) => {
  const { auth } = useAuthStore();

  const params = useSheetRouteParams("add-link-sheet", "main");

  const [link, setLink] = useState<NewLinkDraft>(() => {
    const collection = props.payload?.collection;
    const tag = props.payload?.tag;

    return {
      url: "",
      name: "",
      description: "",
      collection:
        collection?.id != null || collection?.name ? collection : undefined,
      tags: tag?.name ? [{ id: tag.id, name: tag.name }] : [],
    };
  });
  const [showName, setShowName] = useState(false);
  const [showDescription, setShowDescription] = useState(false);
  const [banner, setBanner] = useState<ImagePicker.ImagePickerAsset | null>(
    null
  );

  const addLink = useAddLink({ auth, Alert });
  const updateFile = useUpdateFile({ auth, Alert });
  const collections = useCollections(auth);
  const router = useSheetRouter("add-link-sheet");
  const { colorScheme } = useColorScheme();

  useEffect(() => {
    if (params?.link) {
      setLink(params.link);
    }
  }, [params?.link]);

  const selectedCollection = collections.data?.find(
    (collection) => collection.id === link.collection?.id
  );
  const collectionColor = selectedCollection?.color || "gray";

  const pickBanner = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setBanner(result.assets[0]);
    }
  };

  const hiddenFields = [
    {
      label: "Name",
      isShown: showName,
      onPress: () => setShowName(true),
    },
    {
      label: "Collection",
      isShown: !!link.collection,
      onPress: () => router?.navigate("collections", { link }),
    },
    {
      label: "Tags",
      isShown: link.tags.length > 0,
      onPress: () => router?.navigate("tags", { link }),
    },
    {
      label: "Description",
      isShown: showDescription,
      onPress: () => setShowDescription(true),
    },
    {
      label: "Banner",
      isShown: !!banner,
      onPress: pickBanner,
    },
  ].filter((field) => !field.isShown);

  const saveLink = async () => {
    const newLink = {
      url: link.url,
      ...(link.name.trim() ? { name: link.name } : {}),
      ...(link.description.trim() ? { description: link.description } : {}),
      ...(link.collection ? { collection: link.collection } : {}),
      ...(link.tags.length > 0 ? { tags: link.tags } : {}),
    };

    if (!banner) {
      addLink.mutate(newLink);
      SheetManager.hide("add-link-sheet");
      return;
    }

    // The banner is uploaded against the new link's id, so wait for it to be created first
    const createdLink = await addLink.mutateAsync(newLink).catch(() => null);
    if (!createdLink?.id) return;

    const uploaded = await updateFile
      .mutateAsync({
        linkId: createdLink.id,
        file: {
          uri: banner.uri,
          name: banner.fileName || "banner.jpg",
          type: "image/jpeg",
        },
        isPreview: true,
      })
      .catch(() => null);

    if (uploaded) {
      await seedFormatCache(createdLink.id, "preview", banner.uri).catch(
        () => {}
      );
    }

    SheetManager.hide("add-link-sheet");
  };

  return (
    <>
      <SheetHeader
        title="New Link"
        onClose={() => {
          SheetManager.hide("add-link-sheet");
        }}
      />

      <View className="px-8 pb-5">
        <Input
          placeholder="e.g. https://example.com"
          className="mb-4 bg-base-100"
          autoCapitalize="none"
          value={link.url}
          onChangeText={(text) => setLink({ ...link, url: text })}
        />

        {showName ? (
          <Input
            autoFocus
            placeholder="Name"
            className="mb-4 bg-base-100"
            value={link.name}
            onChangeText={(text) => setLink({ ...link, name: text })}
          />
        ) : null}

        {link.collection ? (
          <Button
            variant="input"
            className="mb-4"
            onPress={() => router?.navigate("collections", { link })}
          >
            <View className="flex-row items-center gap-2 w-[90%]">
              <Folder
                size={20}
                fill={collectionColor}
                color={collectionColor}
              />
              <Text numberOfLines={1} className="w-[90%] text-base-content">
                {selectedCollection?.name || link.collection.name}
              </Text>
            </View>
            <ChevronRight
              size={16}
              color={rawTheme[colorScheme as ThemeName]["neutral"]}
            />
          </Button>
        ) : null}

        {link.tags.length > 0 ? (
          <Button
            variant="input"
            className="mb-4 h-auto"
            onPress={() => router?.navigate("tags", { link })}
          >
            <View className="flex-row flex-wrap items-center gap-2 w-[90%]">
              {link.tags.map((tag) => (
                <View
                  key={tag.name}
                  className="bg-neutral rounded-md h-7 px-2 py-1"
                >
                  <Text numberOfLines={1} className="text-base-100">
                    {tag.name}
                  </Text>
                </View>
              ))}
            </View>
            <ChevronRight
              size={16}
              color={rawTheme[colorScheme as ThemeName]["neutral"]}
            />
          </Button>
        ) : null}

        {showDescription ? (
          <Input
            autoFocus
            multiline
            textAlignVertical="top"
            placeholder="Description"
            className="mb-4 h-28 bg-base-100"
            value={link.description}
            onChangeText={(text) => setLink({ ...link, description: text })}
          />
        ) : null}

        {banner ? (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={pickBanner}
            className="mb-4 h-36 rounded-lg bg-base-100 overflow-hidden items-center justify-center"
          >
            <Image
              source={{ uri: banner.uri }}
              resizeMode="cover"
              className="absolute top-0 bottom-0 left-0 right-0 h-full w-full"
            />

            <View className="flex-row items-center justify-center gap-2 bg-base-200/20 w-full h-full rounded-md">
              <View className="flex-row items-center gap-2 bg-base-200/90 rounded-md px-3 py-1.5">
                <ImageUp
                  size={16}
                  color={rawTheme[colorScheme as ThemeName].primary}
                />
                <Text className="text-base-content">Change Banner</Text>
              </View>
            </View>
          </TouchableOpacity>
        ) : null}

        {hiddenFields.length > 0 ? (
          <View className="mb-4 flex-row flex-wrap gap-2">
            {hiddenFields.map((field) => (
              <TouchableOpacity
                key={field.label}
                activeOpacity={0.6}
                accessibilityRole="button"
                accessibilityLabel={`Add ${field.label}`}
                onPress={field.onPress}
                className="h-8 flex-row items-center gap-1.5 rounded-full border border-dashed border-neutral/50 px-3"
              >
                <Plus
                  size={16}
                  color={rawTheme[colorScheme as ThemeName].primary}
                />
                <Text className="text-base-content">{field.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : null}

        <Button
          onPress={saveLink}
          isLoading={addLink.isPending || updateFile.isPending}
          variant="primary"
        >
          <Text className="text-base-100">Save to Linkwarden</Text>
        </Button>
      </View>
    </>
  );
};

const Collections = () => {
  const { auth } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState("");
  const router = useSheetRouter("add-link-sheet");
  const { link: currentLink } = useSheetRouteParams(
    "add-link-sheet",
    "collections"
  );
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
          collection: { id: collection.id, name: collection.name },
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
            {currentLink.collection?.id === collection.id && (
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
    [colorScheme, currentLink, router]
  );

  return (
    <View className="max-h-[80vh]">
      <SheetHeader
        title="Collection"
        onClose={() => {
          SheetManager.hide("add-link-sheet");
        }}
        leftSlot={
          <TouchableOpacity
            className="flex-row items-center gap-1"
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
        }
      />
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
  const [searchQuery, setSearchQuery] = useState("");
  const router = useSheetRouter("add-link-sheet");
  const params = useSheetRouteParams("add-link-sheet", "tags");
  const config = useConfig(auth);
  const supportsTagSearch = isAtLeastInstanceVersion(
    config.data?.INSTANCE_VERSION,
    MIN_TAG_SEARCH_VERSION
  );
  const tags = useTags(auth, {
    sort: TagSort.NameAZ,
    search: supportsTagSearch ? searchQuery : undefined,
  });
  const { colorScheme } = useColorScheme();
  const [updatedLink, setUpdatedLink] = useState<NewLinkDraft>(params.link);
  const normalizedSearchQuery = searchQuery.trim();

  // Tags are matched by name, since new tags don't have an id until the link is saved
  const availableTags = useMemo(() => {
    const tagsByName = new Map<string, DraftTag>();

    for (const tag of updatedLink.tags) {
      tagsByName.set(tag.name, tag);
    }

    for (const tag of tags.data || []) {
      tagsByName.set(tag.name, tag);
    }

    return Array.from(tagsByName.values());
  }, [updatedLink.tags, tags.data]);

  const filteredTags = useMemo(() => {
    const q = normalizedSearchQuery.toLowerCase();
    if (q === "") return availableTags;
    return availableTags.filter((tag) => tag.name.toLowerCase().includes(q));
  }, [availableTags, normalizedSearchQuery]);

  const canAddTag =
    !tags.isFetching &&
    normalizedSearchQuery !== "" &&
    !availableTags.some(
      (tag) => tag.name.toLowerCase() === normalizedSearchQuery.toLowerCase()
    );

  const handleAddTag = useCallback(() => {
    if (!canAddTag) return;

    setUpdatedLink((currentLink) => ({
      ...currentLink,
      tags: [...currentLink.tags, { name: normalizedSearchQuery }],
    }));
  }, [canAddTag, normalizedSearchQuery]);

  const renderItem = useCallback(
    ({ item: tag }: { item: DraftTag }) => {
      const isSelected = updatedLink.tags.some((t) => t.name === tag.name);

      const onSelect = () => {
        const nextTags = isSelected
          ? updatedLink.tags.filter((t) => t.name !== tag.name)
          : [...updatedLink.tags, { id: tag.id, name: tag.name }];

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
            {isSelected && (
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
    [colorScheme, updatedLink]
  );

  return (
    <View className="max-h-[80vh]">
      <SheetHeader
        title="Tags"
        onClose={() => {
          SheetManager.hide("add-link-sheet");
        }}
        leftSlot={
          <TouchableOpacity
            className="flex-row items-center gap-1"
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
        }
      />
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
        ListHeaderComponent={
          canAddTag ? (
            <Button variant="input" className="mb-2" onPress={handleAddTag}>
              <View className="flex-row items-center gap-2 w-full">
                <Plus
                  size={16}
                  color={rawTheme[colorScheme as ThemeName].primary}
                />
                <Text className="text-base-content">
                  {`Add tag "${normalizedSearchQuery}"`}
                </Text>
              </View>
            </Button>
          ) : null
        }
        onEndReached={() => {
          if (!tags.hasNextPage || tags.isFetchingNextPage) return;
          tags.fetchNextPage();
        }}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          tags.isFetchingNextPage ? (
            <Text
              style={{ textAlign: "center", marginTop: 20 }}
              className="text-neutral"
            >
              Loading...
            </Text>
          ) : null
        }
        ListEmptyComponent={
          tags.isFetching ? null : (
            <Text
              style={{ textAlign: "center", marginTop: 20 }}
              className="text-neutral"
            >
              {normalizedSearchQuery
                ? `No tags match "${normalizedSearchQuery}"`
                : "No tags found"}
            </Text>
          )
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

export default function AddLinkSheet() {
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
