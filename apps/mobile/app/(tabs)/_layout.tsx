import { Tabs } from "expo-router";
import React from "react";
import { Platform, TouchableOpacity, useColorScheme } from "react-native";
import HapticTab from "@/components/HapticTab";
import { IconSymbol } from "@/components/ui/IconSymbol";
import * as DropdownMenu from "zeego/dropdown-menu";
import TabBarBackground from "@/components/ui/TabBarBackground";

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        // tabBarActiveTintColor: colorScheme === "dark" ? "white" : "black",
        tabBarButton: HapticTab,
        // headerShown: false,
        // tabBarBackground: TabBarBackground,
        tabBarStyle: Platform.select({
          ios: {
            // Use a transparent background on iOS to show the blur effect
            position: "absolute",
          },
          default: {},
        }),
        headerLeftContainerStyle: {
          paddingLeft: 20, // Padding for left content
        },
        headerRightContainerStyle: {
          paddingRight: 20, // Padding for right content
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Dashboard",
          headerRight: ({ tintColor }) => (
            <DropdownMenu.Root>
              <DropdownMenu.Trigger>
                <TouchableOpacity>
                  <IconSymbol size={20} name="plus" color={""} />
                </TouchableOpacity>
              </DropdownMenu.Trigger>

              <DropdownMenu.Content>
                <DropdownMenu.Item
                  key="new-link"
                  onSelect={() => alert("Item 1 selected")}
                >
                  <DropdownMenu.ItemTitle>New Link</DropdownMenu.ItemTitle>
                </DropdownMenu.Item>
                <DropdownMenu.Item
                  key="new-collection"
                  onSelect={() => alert("Item 2 selected")}
                >
                  <DropdownMenu.ItemTitle>
                    New Collection
                  </DropdownMenu.ItemTitle>
                </DropdownMenu.Item>
                <DropdownMenu.Item
                  key="upload-file"
                  onSelect={() => alert("Item 3 selected")}
                >
                  <DropdownMenu.ItemTitle>Upload File</DropdownMenu.ItemTitle>
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu.Root>
          ),
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="house.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="links"
        options={{
          title: "Links",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="link" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="gearshape.fill" color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
