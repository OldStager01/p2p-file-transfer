import {
  Pressable,
  Text,
  View,
  StyleSheet,
  ScrollView,
  Platform,
  ToastAndroid,
} from "react-native";
import React, { useState } from "react";
import { useTheme } from "@react-navigation/native";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import SelectItems from "@/components/SelectItems";
import SelectedItems from "@/components/SelectedItems";
import Clipboard from "@react-native-clipboard/clipboard";

export default function Internet() {
  const { colors } = useTheme();
  const [connectionCode, setConnectionCode] = useState<string>("659875");

  const codeCopy = () => {
    Clipboard.setString(connectionCode);
    if (Platform.OS === "android") {
      ToastAndroid.show("Connection Code Copied", ToastAndroid.SHORT);
    }
  };
  return (
    <ScrollView style={styles.container}>
      {/* SELECT */}
      <View style={styles.sectionContainer}>
        <Text style={{ ...styles.sectionHeading, color: colors.text }}>
          Pick
        </Text>
        <SelectItems />
      </View>
      <View style={styles.sectionContainer}>
        <Text style={{ ...styles.sectionHeading, color: colors.text }}>
          Selected
        </Text>
        <SelectedItems />
      </View>
      <View style={styles.sectionContainer}>
        <Text style={{ ...styles.sectionHeading, color: colors.text }}>
          Connection Code
        </Text>
        <View style={styles.codeContainer}>
          <Pressable
            onLongPress={codeCopy}
            style={{ ...styles.code, borderColor: colors.border }}
          >
            <Text style={{ ...styles.codeText, color: colors.text }}>
              {connectionCode}
            </Text>
          </Pressable>
          <Pressable
            onPress={codeCopy}
            style={{ ...styles.copyIconWrapper, borderColor: colors.border }}
          >
            <FontAwesome name="clone" color={colors.text} size={22} />
          </Pressable>
        </View>
      </View>
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: 20,
  },
  sectionContainer: {
    marginBottom: 20,
  },
  sectionHeading: {
    fontSize: 16,
    marginBottom: 5,
    marginLeft: 5,
  },
  sendHeadingContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  codeContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 2,
  },
  code: {
    borderWidth: 1,
    borderRadius: 5,
    flex: 0.8,
    paddingHorizontal: 10,
    paddingVertical: 15,
    height: 60,
  },
  codeText: {
    fontSize: 16,
    textAlign: "center",
    letterSpacing: 5,
  },
  copyIconWrapper: {
    flex: 0.2,
    borderWidth: 1,
    borderRadius: 5,
    height: 60,
    justifyContent: "center",
    alignItems: "center",
  },
});
