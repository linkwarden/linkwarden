import { useLinks } from "@linkwarden/router/links";
import { View, StyleSheet, Platform } from "react-native";
import useAuthStore from "@/store/auth";
import { useLocalSearchParams, useNavigation } from "expo-router";
import React, { useEffect } from "react";
import { useTags } from "@linkwarden/router/tags";
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
      tagId: Number(id),
    },
    auth
  );

  const tags = useTags(auth);

  const navigation = useNavigation();

  useEffect(() => {
    const activeTag = tags.data?.filter((e) => e.id === Number(id))[0];

    if (activeTag?.name)
      navigation?.setOptions?.({
        headerTitle: activeTag?.name,
        headerSearchBarOptions: {
          placeholder: `Search ${activeTag.name}`,
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
