import {
  View,
  Text,
  Image,
  TouchableOpacity,
  Pressable,
  Platform,
} from "react-native";
import { decode } from "html-entities";
import { LinkIncludingShortenedCollectionAndTags } from "@linkwarden/types";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { ArchivedFormat } from "@linkwarden/types";
import {
  atLeastOneFormatAvailable,
  formatAvailable,
} from "@linkwarden/lib/formatStats";
import useAuthStore from "@/store/auth";
import { useRouter } from "expo-router";
import * as ContextMenu from "zeego/context-menu";

type Props = {
  link: LinkIncludingShortenedCollectionAndTags;
};

const LinkListing = ({ link }: Props) => {
  const { auth } = useAuthStore();
  const router = useRouter();

  let shortendURL;

  try {
    if (link.url) {
      shortendURL = new URL(link.url).host.toLowerCase();
    }
  } catch (error) {
    console.log(error);
  }

  return (
    <ContextMenu.Root
      onOpenChange={(open) => {
        /* if needed, track open/close */
      }}
    >
      <ContextMenu.Trigger asChild>
        <View
          style={{
            padding: 20,
            flexDirection: "row",
            justifyContent: "space-between",
            backgroundColor: "#fff",
          }}
        >
          <Pressable
            onPress={() => router.push(`/links/${link.id}`)}
            android_ripple={{ color: "#ddd", borderless: false }}
            style={({ pressed }) => ({
              backgroundColor: pressed
                ? Platform.OS === "android"
                  ? "#fff"
                  : "#eee"
                : "#fff",
            })}
          >
            <View
              style={{
                padding: 20,
                flexDirection: "row",
                justifyContent: "space-between",
              }}
            >
              <View
                style={{
                  width: "70%",
                  flexDirection: "column",
                  justifyContent: "space-between",
                }}
              >
                <Text
                  style={{
                    fontWeight: "500",
                    fontSize: 18,
                  }}
                  numberOfLines={2}
                >
                  {decode(link.name || link.description || link.url)}
                </Text>

                {shortendURL && (
                  <Text
                    style={{
                      marginTop: 5,
                      fontWeight: "300",
                      fontSize: 14,
                    }}
                    numberOfLines={1}
                  >
                    {shortendURL}
                  </Text>
                )}

                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 5,
                    marginTop: 5,
                    // padding: 5,
                    paddingRight: 5,
                    alignSelf: "flex-start",
                    borderRadius: 5,
                    // backgroundColor: link.collection.color
                    //   ? `${link.collection.color}33`
                    //   : "#00000033",
                  }}
                >
                  <IconSymbol
                    name="folder.fill"
                    size={16}
                    color={link.collection.color || ""}
                  />
                  <Text
                    style={{ fontWeight: "300", fontSize: 12 }}
                    numberOfLines={1}
                  >
                    {link.collection.name}
                  </Text>
                </View>
              </View>

              <View
                style={{
                  flexDirection: "column",
                  alignItems: "flex-end",
                }}
              >
                <View
                  style={{
                    borderRadius: 7,
                    position: "relative",
                    overflow: "hidden",
                  }}
                >
                  {formatAvailable(link, "preview") ? (
                    <Image
                      source={{
                        uri:
                          auth.instance +
                          `/api/v1/archives/${link.id}?format=${ArchivedFormat.jpeg}&preview=true&updatedAt=${link.updatedAt}`,
                        headers: {
                          Authorization: `Bearer ${auth.session}`,
                        },
                      }}
                      style={{
                        borderRadius: 5,
                        height: 60,
                        width: 90,
                        resizeMode: "cover",
                        transform: [{ scale: 1.05 }],
                      }}
                    />
                  ) : (
                    <View
                      style={{
                        height: 60,
                        width: 90,
                      }}
                    />
                  )}
                </View>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 5,
                    marginTop: 20,
                    alignSelf: "flex-start",
                  }}
                >
                  <IconSymbol name="calendar" size={16} color={"gray"} />
                  <Text
                    style={{
                      fontWeight: "300",
                      fontSize: 12,
                    }}
                    numberOfLines={1}
                  >
                    {new Date(link.createdAt as string).toLocaleString(
                      "en-US",
                      {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      }
                    )}
                  </Text>
                </View>
              </View>
            </View>
          </Pressable>
        </View>
      </ContextMenu.Trigger>

      <ContextMenu.Content avoidCollisions>
        <ContextMenu.Item
          key="open-link"
          onSelect={() => router.push(`/links/${link.id}`)}
        >
          <ContextMenu.ItemTitle>Open Link</ContextMenu.ItemTitle>
        </ContextMenu.Item>
        {link.url && atLeastOneFormatAvailable(link) && (
          <ContextMenu.Sub>
            <ContextMenu.SubTrigger key="preserved-formats">
              <ContextMenu.ItemTitle>Preserved Formats</ContextMenu.ItemTitle>
            </ContextMenu.SubTrigger>
            <ContextMenu.SubContent>
              {formatAvailable(link, "monolith") && (
                <ContextMenu.Item
                  key="preserved-formats-webpage"
                  onSelect={() =>
                    router.push(
                      `/links/${link.id}?format=${ArchivedFormat.monolith}`
                    )
                  }
                >
                  <ContextMenu.ItemTitle>Webpage</ContextMenu.ItemTitle>
                </ContextMenu.Item>
              )}
              {formatAvailable(link, "image") && (
                <ContextMenu.Item
                  key="preserved-formats-screenshot"
                  onSelect={() =>
                    router.push(
                      `/links/${link.id}?format=${
                        link.image?.endsWith(".png")
                          ? ArchivedFormat.png
                          : ArchivedFormat.jpeg
                      }`
                    )
                  }
                >
                  <ContextMenu.ItemTitle>Screenshot</ContextMenu.ItemTitle>
                </ContextMenu.Item>
              )}
              {formatAvailable(link, "pdf") && (
                <ContextMenu.Item
                  key="preserved-formats-pdf"
                  onSelect={() =>
                    router.push(
                      `/links/${link.id}?format=${ArchivedFormat.pdf}`
                    )
                  }
                >
                  <ContextMenu.ItemTitle>PDF</ContextMenu.ItemTitle>
                </ContextMenu.Item>
              )}
              {formatAvailable(link, "readable") && (
                <ContextMenu.Item
                  key="preserved-formats-readable"
                  onSelect={() =>
                    router.push(
                      `/links/${link.id}?format=${ArchivedFormat.readability}`
                    )
                  }
                >
                  <ContextMenu.ItemTitle>Readable</ContextMenu.ItemTitle>
                </ContextMenu.Item>
              )}
            </ContextMenu.SubContent>
          </ContextMenu.Sub>
        )}
        <ContextMenu.Item
          key="copy-url"
          onSelect={() => {
            /* e.g. copy URL */
          }}
        >
          <ContextMenu.ItemTitle>Copy URL</ContextMenu.ItemTitle>
        </ContextMenu.Item>
        <ContextMenu.Item
          key="delete-link"
          onSelect={() => {
            /* e.g. delete */
          }}
        >
          <ContextMenu.ItemTitle>Delete</ContextMenu.ItemTitle>
        </ContextMenu.Item>
      </ContextMenu.Content>
    </ContextMenu.Root>
  );
};

export default LinkListing;
