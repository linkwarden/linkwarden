import {
  FlatList,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { SafeAreaView } from "react-native-safe-area-context";
import { useDashboardData } from "@linkwarden/router/dashboardData";
import useAuthStore from "@/store/auth";
import React, { useEffect, useMemo, useState } from "react";
import { DashboardSection, DashboardSectionType } from "@prisma/client";
import { useUser } from "@linkwarden/router/user";
import { useCollections } from "@linkwarden/router/collections";
import { useTags } from "@linkwarden/router/tags";
import clsx from "clsx";
import DashboardItem from "@/components/DashboardItem";
import { LinkIncludingShortenedCollectionAndTags } from "@linkwarden/types";
import LinkListing from "@/components/LinkListing";
import { useRouter } from "expo-router";

export default function DashboardScreen() {
  const { auth } = useAuthStore();
  const {
    data: { links = [], numberOfPinnedLinks, collectionLinks = {} } = {
      links: [],
    },
    ...dashboardData
  } = useDashboardData(auth);
  const { data: user } = useUser(auth);
  const { data: collections = [] } = useCollections(auth);
  const { data: tags = [] } = useTags(auth);

  const [dashboardSections, setDashboardSections] = useState<
    DashboardSection[]
  >(user?.dashboardSections || []);

  const [numberOfLinks, setNumberOfLinks] = useState(0);

  useEffect(() => {
    setDashboardSections(user?.dashboardSections || []);
  }, [user?.dashboardSections]);

  useEffect(() => {
    setNumberOfLinks(
      collections.reduce(
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
    <SafeAreaView style={styles.container}>
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={dashboardData.isLoading}
            onRefresh={dashboardData.refetch}
          />
        }
        contentContainerStyle={{
          flexDirection: "column",
          gap: 15,
          paddingVertical: 20,
        }}
        contentInsetAdjustmentBehavior="automatic"
      >
        {orderedSections.map((sectionData) => {
          const collection = collections.find(
            (c) => c.id === sectionData.collectionId
          );

          return (
            <Section
              key={sectionData.id}
              sectionData={sectionData}
              collection={collection}
              links={links}
              tagsLength={tags.length}
              numberOfLinks={numberOfLinks}
              collectionsLength={collections.length}
              numberOfPinnedLinks={numberOfPinnedLinks}
              dashboardData={dashboardData}
              collectionLinks={
                sectionData.collectionId
                  ? collectionLinks[sectionData.collectionId]
                  : []
              }
            />
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

interface SectionProps {
  sectionData: { type: DashboardSectionType };
  collection?: any;
  links?: any[];
  tagsLength: number;
  numberOfLinks: number;
  collectionsLength: number;
  numberOfPinnedLinks: number;
  dashboardData: { isLoading: boolean };
  collectionLinks?: any[];
}

const Section: React.FC<SectionProps> = ({
  sectionData,
  collection,
  links = [],
  tagsLength,
  numberOfLinks,
  collectionsLength,
  numberOfPinnedLinks,
  dashboardData,
  collectionLinks = [],
}) => {
  const router = useRouter();

  switch (sectionData.type) {
    case DashboardSectionType.STATS:
      return (
        <View className="flex-col gap-4 max-w-full px-5">
          <View className="flex-row gap-4">
            <DashboardItem
              name={numberOfLinks === 1 ? "Link" : "Links"}
              value={numberOfLinks}
              icon="link.circle.fill"
              color="#9c00cc"
            />
            <DashboardItem
              name={collectionsLength === 1 ? "Collection" : "Collections"}
              value={collectionsLength}
              icon="folder.circle.fill"
              color="#0096cc"
            />
          </View>
          <View className="flex-row gap-4">
            <DashboardItem
              name={tagsLength === 1 ? "Tag" : "Tags"}
              value={tagsLength}
              icon="tag.circle.fill"
              color="#00cc99"
            />
            <DashboardItem
              name={"Pinned Links"}
              value={numberOfPinnedLinks}
              icon="pin.circle.fill"
              color="#cc6d00"
            />
          </View>
        </View>
      );

    case DashboardSectionType.RECENT_LINKS:
      return (
        <>
          <View className="flex-row justify-between items-center px-5">
            <View className="flex-row gap-2 items-center">
              <View className={"flex-row items-center gap-2"}>
                <IconSymbol size={30} name="clock" color={""} />
                <Text className="text-2xl capitalize">Recent Links</Text>
              </View>
            </View>
            <TouchableOpacity
              className="flex-row items-center text-sm gap-1"
              onPress={() => router.navigate("/(tabs)/dashboard/recent-links")}
            >
              <Text className="text-[#3478f6]">View All</Text>
              <IconSymbol size={15} name="chevron.right" color={"#3478f6"} />
            </TouchableOpacity>
          </View>

          {dashboardData.isLoading ||
          (links.length > 0 && !dashboardData.isLoading) ? (
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              directionalLockEnabled
              data={links || []}
              refreshing={dashboardData.isLoading}
              initialNumToRender={2}
              keyExtractor={(item) => item.id?.toString() || ""}
              renderItem={({ item }) => (
                <RenderItem item={item} key={item.id?.toString()} />
              )}
              ItemSeparatorComponent={() => <View style={{ width: 10 }} />}
              contentContainerStyle={{
                paddingHorizontal: 20,
              }}
            />
          ) : (
            <View className="flex-col gap-2 justify-center items-center h-40 p-10 rounded-xl bg-base-200 bg-white mx-5">
              <IconSymbol size={40} name="clock" color={""} />
              <Text className="text-center text-xl text-gray-500">
                No Recent Links
              </Text>

              {/* <View className="text-center w-full mt-4 flex-row flex-wrap gap-4 justify-center">
                <Button onPress={() => setNewLinkModal(true)} variant="accent">
                  <Icon name="bi-plus-lg" className="text-xl" />
                  <Text>{t("add_link")}</Text>
                </Button>
                <ImportDropdown />
              </View> */}
            </View>
          )}
        </>
      );

    case DashboardSectionType.PINNED_LINKS:
      return (
        <>
          <View className="flex-row justify-between items-center px-5">
            <View className="flex-row gap-2 items-center">
              <View className={"flex-row items-center gap-2"}>
                <IconSymbol size={30} name="pin" color={""} />
                <Text className="text-2xl capitalize">Pinned Links</Text>
              </View>
            </View>
            <TouchableOpacity
              className="flex-row items-center text-sm gap-1"
              onPress={() => router.navigate("/(tabs)/dashboard/pinned-links")}
            >
              <Text className="text-[#3478f6]">View All</Text>
              <IconSymbol size={15} name="chevron.right" color={"#3478f6"} />
            </TouchableOpacity>
          </View>

          {dashboardData.isLoading ||
          links?.some((e: any) => e.pinnedBy && e.pinnedBy[0]) ? (
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={links.filter((e: any) => e.pinnedBy && e.pinnedBy[0]) || []}
              // onRefresh={() => data.refetch()}
              refreshing={dashboardData.isLoading}
              initialNumToRender={2}
              keyExtractor={(item) => item.id?.toString() || ""}
              renderItem={({ item }) => (
                <RenderItem item={item} key={item.id?.toString()} />
              )}
              ItemSeparatorComponent={() => <View style={{ width: 10 }} />}
              contentContainerStyle={{
                paddingHorizontal: 20,
              }}
            />
          ) : (
            <View className="flex-col gap-2 justify-center items-center h-40 p-10 rounded-xl bg-base-200 bg-white mx-5">
              <IconSymbol size={40} name="pin" color={""} />
              <Text className="text-center text-xl text-gray-500">
                No Pinned Links
              </Text>
            </View>
          )}
        </>
      );

    case DashboardSectionType.COLLECTION:
      return collection?.id ? (
        <>
          <View className="flex-row justify-between items-center px-5">
            <View className="flex-row gap-2 items-center max-w-[60%]">
              <View className={clsx("flex-row items-center gap-2")}>
                <IconSymbol
                  size={30}
                  name="folder.fill"
                  color={collection.color || "#0ea5e9"}
                />
                <Text className="text-2xl capitalize w-full" numberOfLines={1}>
                  {collection.name}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              className="flex-row items-center text-sm gap-1 whitespace-nowrap"
              onPress={() =>
                router.navigate(
                  `/(tabs)/dashboard/collection?collectionId=${collection.id}`
                )
              }
            >
              <Text className="text-[#3478f6]">View All</Text>
              <IconSymbol size={15} name="chevron.right" color={"#3478f6"} />
            </TouchableOpacity>
          </View>

          {dashboardData.isLoading || collectionLinks.length > 0 ? (
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={collectionLinks || []}
              // onRefresh={() => data.refetch()}
              refreshing={dashboardData.isLoading}
              initialNumToRender={2}
              keyExtractor={(item) => item.id?.toString() || ""}
              renderItem={({ item }) => (
                <RenderItem item={item} key={item.id?.toString()} />
              )}
              ItemSeparatorComponent={() => <View style={{ width: 10 }} />}
              contentContainerStyle={{
                paddingHorizontal: 20,
              }}
            />
          ) : (
            <View className="flex-col gap-2 justify-center items-center h-40 p-10 rounded-xl bg-base-200 bg-white mx-5">
              <Text className="text-center text-xl text-gray-500">
                Empty Collection
              </Text>
            </View>
          )}
        </>
      ) : null;

    default:
      return null;
  }
};

const RenderItem = React.memo(
  ({ item }: { item: LinkIncludingShortenedCollectionAndTags }) => {
    return <LinkListing link={item} dashboard />;
  }
);

const styles = StyleSheet.create({
  container: Platform.select({
    ios: {
      paddingBottom: 49,
    },
    default: {},
  }),
});
