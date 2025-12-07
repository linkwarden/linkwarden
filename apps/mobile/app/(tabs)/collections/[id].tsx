import { useLinks } from "@linkwarden/router/links";
import { View, StyleSheet, Platform } from "react-native";
import useAuthStore from "@/store/auth";
import { useLocalSearchParams, useNavigation } from "expo-router";
import React, { useEffect } from "react";
import { useCollections } from "@linkwarden/router/collections";
import Links from "@/components/Links";

export default function LinksScreen() {
  const { auth } = useAuthStore();
  const { search, id } = useLocalSearchParams<{
    search?: string;
    id: string;
  }>();

  const { links, data } = useLinks(
    {
      sort: 0,
      searchQueryString: decodeURIComponent(search ?? ""),
      collectionId: Number(id),
    },
    auth
  );

  const collections = useCollections(auth);

  const navigation = useNavigation();

  useEffect(() => {
    const activeCollection = collections.data?.filter(
      (e) => e.id === Number(id)
    )[0];

    if (activeCollection?.name)
      navigation?.setOptions?.({
        headerTitle: activeCollection?.name,
        headerSearchBarOptions: {
          placeholder: `Search ${activeCollection.name}`,
        },
      });
  }, [navigation]);

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
