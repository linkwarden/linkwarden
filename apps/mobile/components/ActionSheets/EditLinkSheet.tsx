import { View, Text, Alert, TouchableOpacity, Image } from "react-native";
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
import * as FileSystem from "expo-file-system/legacy";
import Input from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useUpdateLink, useUpdateFile } from "@linkwarden/router/links";
import useAuthStore from "@/store/auth";
import {
  ArchivedFormat,
  CollectionIncludingMembersAndLinkCount,
  LinkIncludingShortenedCollectionAndTags,
  TagIncludingLinkCount,
  TagSort,
} from "@linkwarden/types/global";
import { useCollections } from "@linkwarden/router/collections";
import { rawTheme, ThemeName } from "@/lib/colors";
import { useColorScheme } from "nativewind";
import {
  Folder,
  ChevronRight,
  ChevronLeft,
  Check,
  Plus,
  ImageUp,
} from "lucide-react-native";
import { formatAvailable } from "@linkwarden/lib/formatStats";
import {
  getCachePathForFormat,
  loadCacheOrFetch,
  seedFormatCache,
} from "@/lib/cache";
import { customHeadersFor } from "@/lib/customHeaders";
import useTmpStore from "@/store/tmp";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTags } from "@linkwarden/router/tags";
import { isAtLeastInstanceVersion, useConfig } from "@linkwarden/router/config";
import SheetHeader from "./SheetHeader";

const MIN_TAG_SEARCH_VERSION = "2.14.1";

const Main = (props: SheetProps<"edit-link-sheet">) => {
  const { auth } = useAuthStore();

  const params = useSheetRouteParams("edit-link-sheet", "main");

  const [link, setLink] = useState<
    LinkIncludingShortenedCollectionAndTags | undefined
  >(props.payload?.link);
  const updateLink = useUpdateLink({ auth, Alert });
  const updateFile = useUpdateFile({ auth, Alert });
  const router = useSheetRouter("edit-link-sheet");
  const { colorScheme } = useColorScheme();

  const [currentBanner, setCurrentBanner] = useState("");
  const [newBanner, setNewBanner] =
    useState<ImagePicker.ImagePickerAsset | null>(null);

  useEffect(() => {
    if (params?.link) {
      setLink(params.link);
    }
  }, [params?.link]);

  useEffect(() => {
    if (!link?.id) return;

    loadCacheOrFetch({
      filePath: getCachePathForFormat(link.id, "preview"),
      setContent: setCurrentBanner,
      shouldFetch: formatAvailable(link, "preview"),
      updatedAt: link.updatedAt,
      onStart: () => setCurrentBanner(""),
      errorMessage: "Failed to fetch preview",
      fetchContent: async (filePath) => {
        const apiUrl = `${auth.instance}/api/v1/archives/${link.id}?format=${ArchivedFormat.jpeg}&preview=true&updatedAt=${link.updatedAt}`;

        const result = await FileSystem.downloadAsync(apiUrl, filePath, {
          headers: {
            ...customHeadersFor(apiUrl),
            Authorization: `Bearer ${auth.session}`,
          },
        });

        return result.uri;
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth.instance, auth.session, link?.id, link?.preview, link?.updatedAt]);

  const pickBanner = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setNewBanner(result.assets[0]);
    }
  };

  const bannerUri =
    newBanner?.uri ||
    (currentBanner ? `${currentBanner}?updatedAt=${link?.updatedAt}` : "");

  const { tmp, updateTmp } = useTmpStore();

  return (
    <>
      <SheetHeader
        title="Edit Link"
        onClose={() => {
          SheetManager.hide("edit-link-sheet");
        }}
      />

      <View className="px-8 pb-5">
        <Input
          placeholder="Name"
          className="mb-4 bg-base-100"
          value={link?.name || ""}
          onChangeText={(text) => link?.id && setLink({ ...link, name: text })}
        />

        {props.payload?.link?.url && (
          <Input
            placeholder="URL"
            autoCapitalize="none"
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

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={pickBanner}
          className="mb-4 h-36 rounded-lg bg-base-100 overflow-hidden items-center justify-center"
        >
          {bannerUri ? (
            <Image
              source={{ uri: bannerUri }}
              resizeMode="cover"
              className="absolute top-0 bottom-0 left-0 right-0 h-full w-full"
            />
          ) : null}

          <View className="flex-row items-center justify-center gap-2 bg-base-200/20 w-full h-full rounded-md">
            <View className="flex-row items-center gap-2 bg-base-200/90 rounded-md px-3 py-1.5">
              <ImageUp
                size={16}
                color={rawTheme[colorScheme as ThemeName].primary}
              />
              <Text className="text-base-content">
                {bannerUri ? "Change Banner" : "Upload Banner"}
              </Text>
            </View>
          </View>
        </TouchableOpacity>

        <Button
          onPress={async () => {
            if (!link) return;

            if (newBanner && link.id) {
              const uploaded = await updateFile
                .mutateAsync({
                  linkId: link.id,
                  file: {
                    uri: newBanner.uri,
                    name: newBanner.fileName || "banner.jpg",
                    type: "image/jpeg",
                  },
                  isPreview: true,
                })
                .catch(() => null);

              if (uploaded) {
                await seedFormatCache(link.id, "preview", newBanner.uri).catch(
                  () => {}
                );
              }
            }

            updateLink.mutate(link as LinkIncludingShortenedCollectionAndTags);
            if (link && tmp.link)
              updateTmp({
                link,
              });
            SheetManager.hide("edit-link-sheet");
          }}
          isLoading={updateLink.isPending || updateFile.isPending}
          variant="primary"
        >
          <Text className="text-base-100">Save</Text>
        </Button>
      </View>
    </>
  );
};

const Collections = () => {
  const { auth } = useAuthStore();
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
    [colorScheme, currentLink, params.link, router]
  );

  return (
    <View className="max-h-[80vh]">
      <SheetHeader
        title="Collection"
        onClose={() => {
          SheetManager.hide("edit-link-sheet");
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
  const router = useSheetRouter("edit-link-sheet");
  const params = useSheetRouteParams("edit-link-sheet", "tags");
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
  const [updatedLink, setUpdatedLink] =
    useState<LinkIncludingShortenedCollectionAndTags>(params.link);
  const normalizedSearchQuery = searchQuery.trim();

  const availableTags = useMemo(() => {
    const tagsById = new Map<number, TagIncludingLinkCount>();

    for (const tag of updatedLink?.tags || []) {
      tagsById.set(tag.id, tag as TagIncludingLinkCount);
    }

    for (const tag of tags.data || []) {
      tagsById.set(tag.id, tag);
    }

    return Array.from(tagsById.values());
  }, [updatedLink?.tags, tags.data]);

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

    const now = new Date();
    const newTag = {
      id: -now.getTime(),
      name: normalizedSearchQuery,
      ownerId: updatedLink.collection.ownerId ?? 0,
      createdAt: now,
      updatedAt: now,
      _count: {
        links: 0,
      },
    } as TagIncludingLinkCount;

    setUpdatedLink((currentLink) => ({
      ...currentLink,
      tags: [...(currentLink.tags || []), newTag],
    }));
  }, [canAddTag, normalizedSearchQuery, updatedLink.collection.ownerId]);

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
    [colorScheme, updatedLink]
  );

  return (
    <View className="max-h-[80vh]">
      <SheetHeader
        title="Tags"
        onClose={() => {
          SheetManager.hide("edit-link-sheet");
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
