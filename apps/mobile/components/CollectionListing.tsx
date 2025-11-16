import { View, Text, Image, Pressable, Platform, Alert } from "react-native";
import { decode } from "html-entities";
import { CollectionIncludingMembersAndLinkCount } from "@linkwarden/types";
import { ArchivedFormat } from "@linkwarden/types";
import { formatAvailable } from "@linkwarden/lib/formatStats";
import useAuthStore from "@/store/auth";
import { useRouter } from "expo-router";
import * as ContextMenu from "zeego/context-menu";
import { useDeleteLink, useUpdateLink } from "@linkwarden/router/links";
import { SheetManager } from "react-native-actions-sheet";
import { cn } from "@linkwarden/lib/utils";
import { rawTheme, ThemeName } from "@/lib/colors";
import { useColorScheme } from "nativewind";
import { CalendarDays, Folder, Link } from "lucide-react-native";
import { useDeleteCollection } from "@linkwarden/router/collections";

type Props = {
  collection: CollectionIncludingMembersAndLinkCount;
};

const CollectionListing = ({ collection }: Props) => {
  const { auth } = useAuthStore();
  const router = useRouter();
  const { colorScheme } = useColorScheme();

  const deleteCollection = useDeleteCollection(auth);

  return (
    <ContextMenu.Root>
      <ContextMenu.Trigger asChild>
        <Pressable
          className={cn(
            "p-5 flex-row justify-between",
            "bg-base-100",
            Platform.OS !== "android" && "active:bg-base-200/50"
          )}
          onLongPress={() => {}}
          onPress={() => router.push(`/collections/${collection.id}`)}
          android_ripple={{
            color: colorScheme === "dark" ? "rgba(255,255,255,0.2)" : "#ddd",
            borderless: false,
          }}
        >
          <View className="w-full">
            <View className="w-[90%] flex-col justify-between gap-3">
              <View className="flex flex-row gap-2 items-center pr-1.5 self-start rounded-md">
                <Folder
                  size={16}
                  fill={collection.color || ""}
                  color={collection.color || ""}
                />
                <Text
                  numberOfLines={2}
                  className="font-medium text-lg text-base-content"
                >
                  {decode(collection.name)}
                </Text>
              </View>
              {collection.description && (
                <Text
                  numberOfLines={2}
                  className="font-light text-sm text-base-content"
                >
                  {decode(collection.description)}
                </Text>
              )}
            </View>

            <View className="flex-row gap-3">
              <View className="flex flex-row gap-1 items-center mt-5 self-start">
                <CalendarDays
                  size={16}
                  color={rawTheme[colorScheme as ThemeName]["neutral"]}
                />
                <Text
                  numberOfLines={1}
                  className="font-light text-xs text-base-content"
                >
                  {new Date(collection.createdAt as string).toLocaleString(
                    "en-US",
                    {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    }
                  )}
                </Text>
              </View>
              <View className="flex flex-row gap-1 items-center mt-5 self-start">
                <Link
                  size={16}
                  color={rawTheme[colorScheme as ThemeName]["neutral"]}
                />
                <Text
                  numberOfLines={1}
                  className="font-light text-xs text-base-content"
                >
                  {collection._count?.links}
                </Text>
              </View>
            </View>
          </View>
        </Pressable>
      </ContextMenu.Trigger>

      <ContextMenu.Content avoidCollisions>
        <ContextMenu.Item
          key="delete-collection"
          onSelect={() => {
            return Alert.alert(
              "Delete Collection",
              "Are you sure you want to delete this collection? This action cannot be undone.",
              [
                {
                  text: "Cancel",
                  style: "cancel",
                },
                {
                  text: "Delete",
                  style: "destructive",
                  onPress: () => {
                    deleteCollection.mutate(collection.id as number);
                  },
                },
              ]
            );
          }}
        >
          <ContextMenu.ItemTitle>Delete</ContextMenu.ItemTitle>
        </ContextMenu.Item>
      </ContextMenu.Content>
    </ContextMenu.Root>
  );
};

export default CollectionListing;
