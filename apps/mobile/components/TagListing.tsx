import { View, Text, Pressable, Platform, Alert } from "react-native";
import { decode } from "html-entities";
import { TagIncludingLinkCount } from "@linkwarden/types";
import useAuthStore from "@/store/auth";
import { useRouter } from "expo-router";
import * as ContextMenu from "zeego/context-menu";
import { cn } from "@linkwarden/lib/utils";
import { rawTheme, ThemeName } from "@/lib/colors";
import { useColorScheme } from "nativewind";
import { CalendarDays, Hash, Link } from "lucide-react-native";
import { useRemoveTag } from "@linkwarden/router/tags";

type Props = {
  tag: TagIncludingLinkCount;
};

const TagListing = ({ tag }: Props) => {
  const { auth } = useAuthStore();
  const router = useRouter();
  const { colorScheme } = useColorScheme();

  const deleteCollection = useRemoveTag(auth);

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
          onPress={() => router.navigate(`/tags/${tag.id}`)}
          android_ripple={{
            color: colorScheme === "dark" ? "rgba(255,255,255,0.2)" : "#ddd",
            borderless: false,
          }}
        >
          <View className="w-full">
            <View className="w-[90%] flex-col justify-between gap-3">
              <View className="flex flex-row gap-2 items-center pr-1.5 self-start rounded-md">
                <Hash
                  size={16}
                  color={rawTheme[colorScheme as ThemeName]["primary"]}
                />
                <Text
                  numberOfLines={2}
                  className="font-medium text-lg text-base-content"
                >
                  {decode(tag.name)}
                </Text>
              </View>
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
                  {new Date(tag.createdAt).toLocaleString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
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
                  {tag._count?.links}
                </Text>
              </View>
            </View>
          </View>
        </Pressable>
      </ContextMenu.Trigger>

      <ContextMenu.Content avoidCollisions>
        <ContextMenu.Item
          key="delete-tag"
          onSelect={() => {
            return Alert.alert(
              "Delete Tag",
              "Are you sure you want to delete this Tag? This action cannot be undone.",
              [
                {
                  text: "Cancel",
                  style: "cancel",
                },
                {
                  text: "Delete",
                  style: "destructive",
                  onPress: () => {
                    deleteCollection.mutate(tag.id as number);
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

export default TagListing;
