import { useLinks } from "@linkwarden/router/links";
import { View, StyleSheet, Platform } from "react-native";
import useAuthStore from "@/store/auth";
import { useLocalSearchParams, useNavigation } from "expo-router";
import React, { useEffect } from "react";
import { useTag } from "@linkwarden/router/tags";
import Links from "@/components/Links";

export default function LinksScreen() {
  const { auth } = useAuthStore();
  const { search, id } = useLocalSearchParams<{
    search?: string;
    id: string;
  }>();
  const parsedTagId = Number(id);
  const tagId =
    Number.isFinite(parsedTagId) && parsedTagId > 0 ? parsedTagId : undefined;

  const { links, data } = useLinks(
    {
      sort: 0,
      searchQueryString: decodeURIComponent(search ?? ""),
      tagId,
    },
    auth
  );

  const tag = useTag(tagId, auth);

  const navigation = useNavigation();
  const isIOS26Plus =
    Platform.OS === "ios" && parseInt(Platform.Version, 10) >= 26;

  useEffect(() => {
    if (tag.data?.name)
      navigation?.setOptions?.({
        headerTitle: tag.data.name,
        headerSearchBarOptions: {
          placeholder: `Search ${tag.data.name}`,
          ...(isIOS26Plus && {
            allowToolbarIntegration: false,
            placement: "integratedButton",
          }),
        },
      });
  }, [navigation, tag.data?.name, isIOS26Plus]);

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
