import { Platform, ScrollView, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import React, { useEffect, useMemo, useState } from "react";
import { useDashboardData } from "@linkwarden/router/dashboardData";
import useAuthStore from "@/store/auth";
import { DashboardSection as PrismaDashboardSection } from "@linkwarden/prisma/client";
import { useUser } from "@linkwarden/router/user";
import { useCollections } from "@linkwarden/router/collections";
import { useTags } from "@linkwarden/router/tags";
import { useRouter } from "expo-router";
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

  const router = useRouter();

  const [dashboardSections, setDashboardSections] = useState<
    PrismaDashboardSection[]
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

  return (
    <ScrollView
      refreshControl={
        <Spinner
          refreshing={
            dashboardData.isRefetching ||
            userData.isRefetching ||
            collectionsData.isRefetching ||
            tagsData.isRefetching
          }
          onRefresh={() => {
            dashboardData.refetch();
            userData.refetch();
            collectionsData.refetch();
            tagsData.refetch();
          }}
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
        if (!collections || !collections[0]) return <></>;

        const collection = collections.find(
          (c) => c.id === sectionData.collectionId
        );

        return (
          <DashboardSection
            key={i}
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
