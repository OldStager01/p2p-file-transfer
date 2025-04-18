import React from "react";
import { View, Text, Dimensions } from "react-native";
import { useAuth } from "@/providers/AuthProvider";
import { Redirect } from "expo-router";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";
import Internet from "./internet";
import Profile from "../profile";
import ExpirableLink from "./expirableLink";
import { SafeAreaView } from "react-native-safe-area-context";
import Local from "./local";
import { useTheme } from "@react-navigation/native";

const Tabs = createMaterialTopTabNavigator();
const screenWidth = Dimensions.get("window").width;
const tabCount = 4;
const tabWidth = screenWidth / tabCount - 5;

function CustomTabLabel({
  title,
  iconName,
  focused,
}: {
  title: string;
  iconName: any;
  focused: boolean;
}) {
  const { colors } = useTheme();
  return (
    <View
      style={{
        width: tabWidth,
        height: "100%",
        paddingHorizontal: 15,
        paddingVertical: 10,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: focused ? colors.text : colors.background,
        borderRadius: 10,
        marginHorizontal: 10,
      }}
    >
      <FontAwesome
        name={iconName}
        size={16}
        color={focused ? colors.background : colors.text}
      />
      <Text
        style={{
          fontSize: 12,
          color: focused ? colors.background : colors.text,
          marginTop: 4,
        }}
      >
        {title}
      </Text>
    </View>
  );
}

export default function _layout() {
  const { colors } = useTheme();
  return (
    <SafeAreaView
      edges={["top"]}
      style={{
        flex: 1,
        backgroundColor: colors.background,
        paddingHorizontal: 5,
      }}
    >
      <Tabs.Navigator
        screenOptions={{
          tabBarStyle: {
            backgroundColor: colors.background,
            paddingTop: 10,
            justifyContent: "space-between", // optional spacing control
          },
          tabBarIndicatorStyle: {
            backgroundColor: "transparent",
          },
          swipeEnabled: false,
        }}
        initialRouteName="local"
      >
        <Tabs.Screen
          name="local"
          component={Local}
          options={{
            tabBarLabel: ({ focused }) => (
              <CustomTabLabel title="Local" iconName="wifi" focused={focused} />
            ),
          }}
        />
        <Tabs.Screen
          name="internet"
          component={Internet}
          options={{
            tabBarLabel: ({ focused }) => (
              <CustomTabLabel
                title="Internet"
                iconName="globe"
                focused={focused}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="expirableLink"
          component={ExpirableLink}
          options={{
            tabBarLabel: ({ focused }) => (
              <CustomTabLabel title="Links" iconName="link" focused={focused} />
            ),
          }}
        />
      </Tabs.Navigator>
    </SafeAreaView>
  );
}
