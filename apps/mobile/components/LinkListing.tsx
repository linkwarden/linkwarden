import { View, Text, Image } from "react-native";
import { decode } from "html-entities";
import { LinkIncludingShortenedCollectionAndTags } from "@linkwarden/types";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { ArchivedFormat } from "@linkwarden/types";
import { formatAvailable } from "@linkwarden/lib/formatStats";
import useAuthStore from "@/store/auth";

type Props = {
  link: LinkIncludingShortenedCollectionAndTags;
};

const LinkListing = ({ link }: Props) => {
  const { auth } = useAuthStore();

  let shortendURL;

  try {
    if (link.url) {
      shortendURL = new URL(link.url).host.toLowerCase();
    }
  } catch (error) {
    console.log(error);
  }

  return (
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
            marginRight: 20,
            padding: 5,
            alignSelf: "flex-start",
            borderRadius: 5,
            backgroundColor: link.collection.color
              ? `${link.collection.color}33`
              : "#00000033",
          }}
        >
          <IconSymbol
            name="folder.fill"
            size={16}
            color={link.collection.color || ""}
          />

          <Text
            style={{
              fontWeight: "300",
              fontSize: 12,
            }}
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
          style={{ borderRadius: 7, position: "relative", overflow: "hidden" }}
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
            {new Date(link.createdAt as string).toLocaleString("en-US", {
              year: "numeric",
              month: "short",
              day: "numeric",
            })}
          </Text>
        </View>
      </View>
    </View>
  );
};

export default LinkListing;
