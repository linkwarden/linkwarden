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
  const { data: collections = [], refetch: refetchCollections } =
    useCollections(auth);
  const { data: tagsData = { tags: [], total: 0 } } = useTags(auth);
  const tags = tagsData.tags;
  const totalTagCount = tagsData.total || tags.length;

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
    <SafeAreaView
      style={styles.container}
      collapsable={false}
      collapsableChildren={false}
      className="bg-base-100 h-full"
    >
      <ScrollView
        refreshControl={
          <Spinner
            refreshing={dashboardData.isLoading || userData.isLoading}
            onRefresh={() => {
              dashboardData.refetch();
              userData.refetch();
              refetchCollections();
              refetchTags();
            }}
            progressBackgroundColor={
              rawTheme[colorScheme as ThemeName]["base-200"]
            }
            colors={[rawTheme[colorScheme as ThemeName]["base-content"]]}
          />
        }
        contentContainerStyle={{
          flexDirection: "column",
          gap: 15,
          paddingVertical: 20,
        }}
        className="bg-base-100"
        contentInsetAdjustmentBehavior="automatic"
      >
        {orderedSections.map((sectionData) => {
          return (
            <DashboardSection
              key={sectionData.id}
              sectionData={sectionData}
              collection={collections.find(
                (c) => c.id === sectionData.collectionId
              )}
              collectionLinks={
                sectionData.collectionId
                  ? collectionLinks[sectionData.collectionId]
                  : []
              }
              links={links}
              tagsLength={totalTagCount}
              numberOfLinks={numberOfLinks}
              collectionsLength={collections.length}
              numberOfPinnedLinks={numberOfPinnedLinks}
              dashboardData={dashboardData}
            />
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: Platform.select({
    ios: {
      paddingBottom: 49,
    },
    default: {},
  }),
});
