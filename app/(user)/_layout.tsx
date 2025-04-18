import React, { useState } from "react";
import { router, Tabs } from "expo-router";
import { useTheme } from "@react-navigation/native";
import SelectedItemsProvider from "@/providers/SelectedItemsProvider";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import HistoryModal from "@/components/HistoryModal";
import { Pressable, Text, View } from "react-native";

export default function Layout() {
  const { colors } = useTheme();
  const [historyVisible, setHistoryVisible] = useState(false);
  return (
    <SelectedItemsProvider>
      <Tabs
        screenOptions={{
          title: "P2P Transfer",
          headerStyle: {
            backgroundColor: colors.background,
          },
          headerTitleStyle: {
            color: colors.text,
          },
          headerShadowVisible: false,

          headerRight: () => (
            <View style={{ flexDirection: "row", gap: 10, marginRight: 10 }}>
              <Pressable
                onPress={() => {
                  setHistoryVisible(true);
                }}
              >
                <FontAwesome
                  name="history"
                  size={24}
                  color={colors.text}
                  style={{ marginRight: 10 }}
                />
              </Pressable>
              <Pressable
                onPress={() => {
                  router.push("/profile");
                }}
              >
                <FontAwesome
                  name="user"
                  size={24}
                  color={colors.text}
                  style={{ marginRight: 10 }}
                />
              </Pressable>
            </View>
          ),
        }}
      >
        <Tabs.Screen
          name="(send)"
          options={{
            title: "Send",
            tabBarIcon: ({ color, size, focused }) => (
              <FontAwesome
                name="send"
                size={size}
                color={focused ? colors.text : color}
              />
            ),
            tabBarLabel: ({ focused, color }) => (
              <Text
                style={{ color: focused ? colors.text : color, fontSize: 10 }}
              >
                Send
              </Text>
            ),
          }}
        />
        <Tabs.Screen
          name="(receive)"
          options={{
            title: "Receive",
            tabBarIcon: ({ focused, color, size }) => (
              <FontAwesome
                name="download"
                size={size}
                color={focused ? colors.text : color}
              />
            ),
            tabBarLabel: ({ focused, color }) => (
              <Text
                style={{ color: focused ? colors.text : color, fontSize: 10 }}
              >
                Receive
              </Text>
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: "Profile",
            tabBarStyle: { display: "none" }, // Hide the tab
            tabBarIcon: ({ focused, color, size }) => (
              <FontAwesome
                name="user"
                size={size}
                color={focused ? colors.text : color}
              />
            ),
            tabBarLabel: ({ focused, color }) => (
              <Text
                style={{ color: focused ? colors.text : color, fontSize: 10 }}
              >
                Profile
              </Text>
            ),
          }}
        />
      </Tabs>
      <HistoryModal
        visible={historyVisible}
        onClose={() => setHistoryVisible(false)}
      />
    </SelectedItemsProvider>
  );
}
