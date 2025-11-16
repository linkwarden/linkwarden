import { useLinks } from "@linkwarden/router/links";
import { View, StyleSheet, Platform } from "react-native";
import useAuthStore from "@/store/auth";
import { useLocalSearchParams, useNavigation } from "expo-router";
import React, { useEffect, useMemo } from "react";
import { useCollections } from "@linkwarden/router/collections";
import Links from "@/components/Links";

export default function LinksScreen() {
  const { auth } = useAuthStore();
  const { search, section, collectionId } = useLocalSearchParams<{
    search?: string;
    section?: "pinned-links" | "recent-links" | "collection";
    collectionId?: string;
  }>();

  const navigation = useNavigation();
  const collections = useCollections(auth);

  const title = useMemo(() => {
    if (section === "pinned-links") return "Pinned Links";
    if (section === "recent-links") return "Recent Links";

    if (section === "collection") {
      return (
        collections.data?.find((c) => c.id?.toString() === collectionId)
          ?.name || "Collection"
      );
    }

    return "Links";
  }, [section, collections.data, collectionId]);

  useEffect(() => {
    navigation.setOptions({
      headerTitle: title,
      headerSearchBarOptions: {
        placeholder: `Search ${title}`,
      },
    });
  }, [title, navigation]);

  const { links, data } = useLinks(
    {
      sort: 0,
      searchQueryString: decodeURIComponent(search ?? ""),
      collectionId: Number(collectionId),
      pinnedOnly: section === "pinned-links",
    },
    auth
  );

  return (
    <View
      style={styles.container}
      className="h-full bg-base-100"
      collapsable={false}
      collapsableChildren={false}
    >
      <Links links={links} data={data} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: Platform.select({
    ios: {
      paddingBottom: 83,
    },
    default: {},
  }),
});
