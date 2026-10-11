import { useLinks } from "@linkwarden/router/links";
import {
  View,
  Platform,
  TouchableOpacity,
  NativeSyntheticEvent,
} from "react-native";
import { Plus } from "lucide-react-native";
import { SheetManager } from "react-native-actions-sheet";
import { useColorScheme } from "nativewind";
import { rawTheme, ThemeName } from "@/lib/colors";
import useAuthStore from "@/store/auth";
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
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
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const isIOS26Plus =
    Platform.OS === "ios" && parseInt(Platform.Version, 10) >= 26;

  useEffect(() => {
    navigation?.setOptions?.({
      ...(tag.data?.name
        ? {
            headerTitle: tag.data.name,
            headerSearchBarOptions: {
              placeholder: `Search ${tag.data.name}`,
              autoCapitalize: "none",
              ...(isIOS26Plus && {
                allowToolbarIntegration: false,
                placement: "integratedButton",
                // Without this, iOS 27 drops the large title's padding while searching
                hideNavigationBar: false,
              }),
              onChangeText: (e: NativeSyntheticEvent<{ text: string }>) => {
                router.setParams({
                  search: encodeURIComponent(e.nativeEvent.text),
                });
              },
              headerIconColor: colorScheme === "dark" ? "white" : "black",
            },
          }
        : {}),
      headerRight: () => (
        <TouchableOpacity
          onPress={() =>
            SheetManager.show("add-link-sheet", {
              payload: {
                tag: tagId != null ? { id: tagId, name: tag.data?.name } : {},
              },
            })
          }
        >
          <Plus size={21} color={rawTheme[colorScheme as ThemeName].primary} />
        </TouchableOpacity>
      ),
    });
  }, [navigation, router, tag.data?.name, tagId, isIOS26Plus, colorScheme]);

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
