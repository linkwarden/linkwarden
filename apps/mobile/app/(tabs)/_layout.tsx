import { Tabs } from "expo-router";
import React from "react";
import { Platform } from "react-native";
import HapticTab from "@/components/HapticTab";
import TabBarBackground from "@/components/ui/TabBarBackground";
import { useColorScheme } from "nativewind";
import { rawTheme, ThemeName } from "@/lib/colors";
import { Folder, Hash, House, Link, Settings } from "lucide-react-native";

export default function TabLayout() {
  const { colorScheme } = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarBackground: TabBarBackground,
        tabBarActiveTintColor: rawTheme[colorScheme as ThemeName].primary,
        tabBarInactiveTintColor: rawTheme[colorScheme as ThemeName].neutral,
        tabBarButton: HapticTab,
        tabBarStyle: Platform.select({
          ios: {
            position: "absolute",
            borderTopWidth: 0,
            elevation: 0,
            backgroundColor: rawTheme[colorScheme as ThemeName]["base-200"],
            paddingLeft: 5,
            paddingRight: 5,
          },
          default: {
            borderTopWidth: 0,
            backgroundColor: rawTheme[colorScheme as ThemeName]["base-200"],
            elevation: 0,
            paddingLeft: 5,
            paddingRight: 5,
          },
        }),
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: "Dashboard",
          headerShown: false,
          tabBarIcon: ({ color }) => <House size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="links"
        options={{
          title: "Links",
          headerShown: false,
          tabBarIcon: ({ color }) => <Link size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="collections"
        options={{
          title: "Collections",
          headerShown: false,
          tabBarIcon: ({ color }) => <Folder size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="tags"
        options={{
          title: "Tags",
          headerShown: false,
          tabBarIcon: ({ color }) => <Hash size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          headerShown: false,
          tabBarIcon: ({ color }) => <Settings size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}
