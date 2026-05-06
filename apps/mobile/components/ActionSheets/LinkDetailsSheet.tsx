import { useEffect, useState, type ReactNode } from "react";
import {
  ActivityIndicator,
  Linking,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import ActionSheet, {
  ScrollView,
  SheetManager,
  SheetProps,
} from "react-native-actions-sheet";
import { decode } from "html-entities";
import { useRouter } from "expo-router";
import { useColorScheme } from "nativewind";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  CalendarDays,
  ChevronRight,
  ExternalLink,
  File,
  FileCode,
  FileImage,
  FileText,
  Folder,
  Tag,
} from "lucide-react-native";
import { Button } from "@/components/ui/Button";
import { rawTheme, ThemeName } from "@/lib/colors";
import useAuthStore from "@/store/auth";
import useDataStore from "@/store/data";
import { useUser } from "@linkwarden/router/user";
import {
  atLeastOneFormatAvailable,
  formatAvailable,
} from "@linkwarden/lib/formatStats";
import getOriginalFormat from "@linkwarden/lib/getOriginalFormat";
import {
  ArchivedFormat,
  LinkIncludingShortenedCollectionAndTags,
} from "@linkwarden/types/global";
import SheetHeader from "./SheetHeader";

type CollectionOwner = {
  id: number | null;
  name: string;
  username: string;
  image: string;
  archiveAsScreenshot?: boolean;
  archiveAsMonolith?: boolean;
  archiveAsPDF?: boolean;
};

const initialCollectionOwner: CollectionOwner = {
  id: null,
  name: "",
  username: "",
  image: "",
  archiveAsScreenshot: undefined,
  archiveAsMonolith: undefined,
  archiveAsPDF: undefined,
};

function SectionLabel({ children }: { children: string }) {
  return <Text className="mb-2 text-sm text-neutral">{children}</Text>;
}

function PreservedFormatRow({
  title,
  icon,
  onPress,
}: {
  title: string;
  icon: ReactNode;
  onPress: () => void;
}) {
  return (
    <Button variant="input" className="h-auto" onPress={onPress}>
      <View className="flex-row items-center gap-3">
        {icon}
        <Text className="text-base text-base-content">{title}</Text>
      </View>
      <ChevronRight size={16} color="#6B7280" />
    </Button>
  );
}

export default function LinkDetailsSheet(
  props: SheetProps<"link-details-sheet">
) {
  const { auth } = useAuthStore();
  const { data } = useDataStore();
  const { data: user } = useUser(auth);
  const { colorScheme } = useColorScheme();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const router = useRouter();
  const theme = rawTheme[colorScheme as ThemeName];
  const [link, setLink] =
    useState<LinkIncludingShortenedCollectionAndTags | null>(
      props.payload?.link ?? null
    );
  const [collectionOwner, setCollectionOwner] = useState<CollectionOwner>(
    initialCollectionOwner
  );

  useEffect(() => {
    setLink(props.payload?.link ?? null);
  }, [props.payload?.link]);

  useEffect(() => {
    if (!link?.collection.ownerId || !auth.instance) {
      setCollectionOwner(initialCollectionOwner);
      return;
    }

    let cancelled = false;

    const fetchOwner = async () => {
      if (link.collection.ownerId === user?.id) {
        if (!cancelled) {
          setCollectionOwner({
            id: user.id,
            name: user.name || "",
            username: user.username || "",
            image: user.image || "",
            archiveAsScreenshot: user.archiveAsScreenshot,
            archiveAsMonolith: user.archiveAsMonolith,
            archiveAsPDF: user.archiveAsPDF,
          });
        }

        return;
      }

      try {
        const response = await fetch(
          `${auth.instance}/api/v1/public/users/${link.collection.ownerId}`,
          auth.session
            ? {
                headers: {
                  Authorization: `Bearer ${auth.session}`,
                },
              }
            : undefined
        );

        const payload = await response.json();

        if (!response.ok || cancelled) {
          return;
        }

        setCollectionOwner(payload.response as CollectionOwner);
      } catch (error) {
        console.error("Failed to load collection owner", error);
      }
    };

    void fetchOwner();

    return () => {
      cancelled = true;
    };
  }, [auth.instance, auth.session, link?.collection.ownerId, user]);

  const closeSheet = () => {
    void SheetManager.hide("link-details-sheet");
  };

  const handleOpenOriginal = () => {
    if (!link?.id) return;

    closeSheet();

    const format = getOriginalFormat(link);

    if (data.preferredBrowser === "app") {
      router.navigate(
        format !== null
          ? `/links/${link.id}?format=${format}`
          : `/links/${link.id}`
      );
      return;
    }

    void Linking.openURL(
      format !== null
        ? `${auth.instance}/preserved/${link.id}?format=${format}`
        : (link.url as string)
    );
  };

  const handleOpenPreservedFormat = (format: ArchivedFormat) => {
    if (!link?.id) return;

    closeSheet();
    router.navigate(`/links/${link.id}?format=${format}`);
  };

  const handleOpenCollection = () => {
    if (!link?.collection.id) return;

    closeSheet();
    router.navigate(`/collections/${link.collection.id}`);
  };

  const handleOpenTag = (tagId?: number) => {
    if (!tagId) return;

    closeSheet();
    router.navigate(`/tags/${tagId}`);
  };

  const handleOpenWaybackSnapshot = () => {
    if (!link?.url) return;

    closeSheet();
    void Linking.openURL(
      `https://web.archive.org/web/${link.url.replace(/(^\w+:|^)\/\//, "")}`
    );
  };

  const isReady = () => {
    if (!link) return false;

    return (
      (collectionOwner.archiveAsScreenshot === true ? link.image : true) &&
      (collectionOwner.archiveAsMonolith === true ? link.monolith : true) &&
      (collectionOwner.archiveAsPDF === true ? link.pdf : true) &&
      link.readable
    );
  };

  const formattedSavedDate = link?.createdAt
    ? new Date(link.createdAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : null;

  const formattedSavedTime = link?.createdAt
    ? new Date(link.createdAt).toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "numeric",
      })
    : null;

  return (
    <ActionSheet
      gestureEnabled
      indicatorStyle={{
        display: "none",
      }}
      containerStyle={{
        backgroundColor: theme["base-200"],
      }}
      safeAreaInsets={insets}
      onClose={() => {
        setLink(null);
        setCollectionOwner(initialCollectionOwner);
      }}
    >
      <SheetHeader title="Link Details" onClose={closeSheet} />

      {link ? (
        <ScrollView
          style={{
            maxHeight: height * 0.8,
          }}
          contentContainerStyle={{
            paddingBottom: 20,
          }}
          contentContainerClassName="px-6"
          showsVerticalScrollIndicator={false}
          contentInsetAdjustmentBehavior="automatic"
        >
          <View className="px-1 pb-2">
            <Text className="text-2xl font-semibold text-base-content">
              {decode(link.name || "") || "Untitled"}
            </Text>
          </View>

          {link.url ? (
            <View className="mb-5">
              <SectionLabel>Link</SectionLabel>

              <View className="rounded-lg bg-base-100 px-4 py-3 relative">
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={handleOpenOriginal}
                >
                  <Text
                    className="text-base text-base-content"
                    numberOfLines={1}
                  >
                    {link.url}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : null}

          <View className="mb-5">
            <SectionLabel>Collection</SectionLabel>

            <Button
              variant="input"
              className="h-auto py-3"
              onPress={handleOpenCollection}
            >
              <View className="flex-row items-center gap-3 w-[85%]">
                <Folder
                  size={20}
                  fill={link.collection.color || theme.primary}
                  color={link.collection.color || theme.primary}
                />
                <Text numberOfLines={1} className="text-base text-base-content">
                  {link.collection.name || "Unorganized"}
                </Text>
              </View>
              <ChevronRight size={16} color="#6B7280" />
            </Button>
          </View>

          <View className="mb-5">
            <SectionLabel>Tags</SectionLabel>

            <View className="rounded-lg bg-base-100 p-3">
              {link.tags && link.tags.length > 0 ? (
                <View className="flex-row flex-wrap gap-2">
                  {link.tags.map((tag) => (
                    <TouchableOpacity
                      key={tag.id}
                      activeOpacity={0.8}
                      className="flex-row items-center gap-1 rounded-lg bg-base-200 px-3 py-2"
                      onPress={() => handleOpenTag(tag.id)}
                    >
                      <Tag size={14} color={theme.neutral} />
                      <Text className="text-sm text-base-content">
                        {tag.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              ) : (
                <Text className="text-base text-neutral">No tags</Text>
              )}
            </View>
          </View>

          <View className="mb-5">
            <SectionLabel>Description</SectionLabel>

            <View className="rounded-lg bg-base-100 px-4 py-3">
              {link.description ? (
                <Text
                  className="text-base leading-6 text-base-content"
                  selectable
                >
                  {decode(link.description)}
                </Text>
              ) : (
                <Text className="text-base text-neutral">
                  No description provided
                </Text>
              )}
            </View>
          </View>

          <View className="mb-5">
            <SectionLabel>
              {link.url ? "Preserved Formats" : "Content"}
            </SectionLabel>

            <View className="rounded-lg bg-base-100 flex flex-col gap-2 p-2">
              {formatAvailable(link, "monolith") ? (
                <PreservedFormatRow
                  title="Webpage"
                  icon={<FileCode size={18} color={theme.primary} />}
                  onPress={() =>
                    handleOpenPreservedFormat(ArchivedFormat.monolith)
                  }
                />
              ) : null}

              {formatAvailable(link, "image") ? (
                <PreservedFormatRow
                  title="Screenshot"
                  icon={<FileImage size={18} color={theme.primary} />}
                  onPress={() =>
                    handleOpenPreservedFormat(
                      link.image?.endsWith(".png")
                        ? ArchivedFormat.png
                        : ArchivedFormat.jpeg
                    )
                  }
                />
              ) : null}

              {formatAvailable(link, "pdf") ? (
                <PreservedFormatRow
                  title="PDF"
                  icon={<File size={18} color={theme.primary} />}
                  onPress={() => handleOpenPreservedFormat(ArchivedFormat.pdf)}
                />
              ) : null}

              {formatAvailable(link, "readable") ? (
                <PreservedFormatRow
                  title="Readable"
                  icon={<FileText size={18} color={theme.primary} />}
                  onPress={() =>
                    handleOpenPreservedFormat(ArchivedFormat.readability)
                  }
                />
              ) : null}

              {!isReady() && !atLeastOneFormatAvailable(link) ? (
                <View className="px-4 py-8 items-center">
                  <ActivityIndicator
                    size="large"
                    color={theme.primary}
                    className="mb-3"
                  />
                  <Text className="text-lg text-base-content">
                    Link preservation is in the queue
                  </Text>
                  <Text className="text-sm text-neutral mt-1">
                    Please check back later to see the result
                  </Text>
                </View>
              ) : link.url && !isReady() && atLeastOneFormatAvailable(link) ? (
                <View className="px-4 py-5 items-center">
                  <ActivityIndicator
                    size="small"
                    color={theme.primary}
                    className="mb-3"
                  />
                  <Text className="text-base text-base-content text-center">
                    There are more formats on the way
                  </Text>
                  <Text className="text-sm text-neutral mt-1">
                    Check back later
                  </Text>
                </View>
              ) : null}

              {link.url ? (
                <TouchableOpacity
                  activeOpacity={0.8}
                  className="flex-row items-center justify-center gap-2"
                  onPress={handleOpenWaybackSnapshot}
                >
                  <Text className="text-sm text-neutral">
                    View latest snapshot on archive.org
                  </Text>
                  <ExternalLink size={14} color={theme.neutral} />
                </TouchableOpacity>
              ) : null}
            </View>
          </View>

          {formattedSavedDate && formattedSavedTime ? (
            <View className="mb-1 flex-row items-center justify-center gap-2">
              <CalendarDays size={14} color={theme.neutral} />
              <Text className="text-center text-xs text-neutral">
                Saved {formattedSavedDate} at {formattedSavedTime}
              </Text>
            </View>
          ) : null}
        </ScrollView>
      ) : null}
    </ActionSheet>
  );
}
