import { useLinks } from "@linkwarden/router/links";
import { Sort } from "@linkwarden/types/global";
import { View } from "react-native";
import useAuthStore from "@/store/auth";
import { useLocalSearchParams } from "expo-router";
import React from "react";
import Links from "@/components/Links";

export default function LinksScreen() {
  const { auth } = useAuthStore();
  const { search } = useLocalSearchParams<{ search?: string }>();

  const { links, data } = useLinks(
    {
      sort: search ? Sort.BestMatch : Sort.DateNewestFirst,
      searchQueryString: decodeURIComponent(search ?? ""),
    },
    auth
  );

  return (
    <View
      className="h-full bg-base-100"
      collapsable={false}
      collapsableChildren={false}
    >
      <Links links={links} data={data} />
    </View>
  );
}
