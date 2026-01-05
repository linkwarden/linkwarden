import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import React, { useEffect, useMemo, useState } from "react";
import { useDashboardData } from "@linkwarden/router/dashboardData";
import useAuthStore from "@/store/auth";
import { DashboardSection as DashboardSectionType } from "@linkwarden/prisma/client";
import { useUser } from "@linkwarden/router/user";
import { useCollections } from "@linkwarden/router/collections";
import { useTags } from "@linkwarden/router/tags";
import { rawTheme, ThemeName } from "@/lib/colors";
import { useColorScheme } from "nativewind";
import Spinner from "@/components/ui/Spinner";
import DashboardSection from "@/components/DashboardSection";

export default function DashboardScreen() {
  const { auth } = useAuthStore();
  const {
    data: { links = [], numberOfPinnedLinks, collectionLinks = {} } = {
      links: [],
    },
    ...dashboardData
  } = useDashboardData(auth);
  const { data: user, ...userData } = useUser(auth);
  const { data: collections = [], ...collectionsData } = useCollections(auth);
  const { data: tags = [], ...tagsData } = useTags(auth);

  const { colorScheme } = useColorScheme();

  const [dashboardSections, setDashboardSections] = useState<
    DashboardSectionType[]
  >(user?.dashboardSections || []);

  const [numberOfLinks, setNumberOfLinks] = useState(0);

  useEffect(() => {
    setDashboardSections(user?.dashboardSections || []);
  }, [user?.dashboardSections]);

  useEffect(() => {
    setNumberOfLinks(
      collections?.reduce?.(
        (accumulator, collection) =>
          accumulator + (collection._count as any).links,
        0
      )
    );
  }, [collections]);

  const orderedSections = useMemo(() => {
    return [...dashboardSections].sort((a, b) => {
      const orderA = a.order ?? Number.MAX_SAFE_INTEGER;
      const orderB = b.order ?? Number.MAX_SAFE_INTEGER;
      return orderA - orderB;
    });
  }, [dashboardSections]);

  const [pullRefreshing, setPullRefreshing] = useState(false);

  const onRefresh = async () => {
    setPullRefreshing(true);
    try {
      await Promise.all([
        dashboardData.refetch(),
        userData.refetch(),
        collectionsData.refetch(),
        tagsData.refetch(),
      ]);
    } finally {
      setPullRefreshing(false);
    }
  };

  if (orderedSections.length === 0 && dashboardData.isLoading)
    return (
      <View className="flex justify-center h-screen items-center bg-base-100">
        <ActivityIndicator size="large" />
        <Text className="text-base mt-2.5 text-neutral">Loading...</Text>
      </View>
    );

  return (
    <ScrollView
      refreshControl={
        <Spinner
          refreshing={pullRefreshing}
          onRefresh={onRefresh}
          progressBackgroundColor={
            rawTheme[colorScheme as ThemeName]["base-200"]
          }
          colors={[rawTheme[colorScheme as ThemeName]["base-content"]]}
        />
      }
      contentContainerStyle={styles.container}
      className="bg-base-100"
      contentInsetAdjustmentBehavior="automatic"
    >
      {orderedSections.map((sectionData, i) => {
        if (!collections || !collections[0]) return null;

        const collection = collections.find(
          (c) => c.id === sectionData.collectionId
        );

        return (
          <DashboardSection
            key={sectionData.id}
            sectionData={sectionData}
            collection={collection}
            collectionLinks={
              sectionData.collectionId
                ? collectionLinks[sectionData.collectionId]
                : []
            }
            links={links}
            tagsLength={tags.length}
            numberOfLinks={numberOfLinks}
            collectionsLength={collections.length}
            numberOfPinnedLinks={numberOfPinnedLinks}
            dashboardData={dashboardData}
          />
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: Platform.select({
    ios: {
      paddingBottom: 49,
      flexDirection: "column",
      gap: 15,
      paddingVertical: 20,
    },
    default: {
      flexDirection: "column",
      gap: 15,
      paddingVertical: 20,
    },
  }),
});
