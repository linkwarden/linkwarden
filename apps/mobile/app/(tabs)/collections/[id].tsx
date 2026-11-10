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
  const router = useRouter();
  const { colorScheme } = useColorScheme();

  const isIOS26Plus =
    Platform.OS === "ios" && parseInt(Platform.Version, 10) >= 26;

  useEffect(() => {
    const activeCollection = collections.data?.filter(
      (e) => e.id === Number(id)
    )[0];

    navigation?.setOptions?.({
      ...(activeCollection?.name
        ? {
            headerTitle: activeCollection.name,
            headerSearchBarOptions: {
              placeholder: `Search ${activeCollection.name}`,
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
                collection: { id: Number(id), name: activeCollection?.name },
              },
            })
          }
        >
          <Plus size={21} color={rawTheme[colorScheme as ThemeName].primary} />
        </TouchableOpacity>
      ),
    });
  }, [navigation, router, collections.data, id, colorScheme]);

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
