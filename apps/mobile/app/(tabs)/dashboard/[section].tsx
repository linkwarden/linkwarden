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
  const router = useRouter();
  const collections = useCollections(auth);
  const { colorScheme } = useColorScheme();
  const isIOS26Plus =
    Platform.OS === "ios" && parseInt(Platform.Version, 10) >= 26;

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
      headerRight:
        section === "pinned-links"
          ? undefined
          : () => (
              <TouchableOpacity
                onPress={() =>
                  SheetManager.show(
                    "add-link-sheet",
                    section === "collection" && collectionId
                      ? {
                          payload: {
                            collection: {
                              id: Number(collectionId),
                              name: title,
                            },
                          },
                        }
                      : undefined
                  )
                }
              >
                <Plus
                  size={21}
                  color={rawTheme[colorScheme as ThemeName].primary}
                />
              </TouchableOpacity>
            ),
    });
  }, [title, navigation, router, section, collectionId, colorScheme]);

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
      className="h-full bg-base-100"
      collapsable={false}
      collapsableChildren={false}
    >
      <Links links={links} data={data} />
    </View>
  );
}
