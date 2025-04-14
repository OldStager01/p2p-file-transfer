import { FontAwesomeIconName } from "@/types";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useTheme } from "@react-navigation/native";
import { Pressable, StyleSheet, Text } from "react-native";

export default function SelectTypeCard({
  type,
  icon,
  onPress,
}: {
  type: string;
  icon: FontAwesomeIconName;
  onPress: any;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      style={{ ...styles.selectItem, borderColor: colors.border }}
      onPress={onPress}
    >
      <FontAwesome name={icon} size={20} color={colors.text} />
      <Text style={{ ...styles.selectItemText, color: colors.text }}>
        {type}
      </Text>
    </Pressable>
  );
}
const styles = StyleSheet.create({
  selectItem: {
    borderWidth: 2,
    borderRadius: 5,
    paddingHorizontal: 20,
    paddingVertical: 15,
    flexDirection: "row",
    alignItems: "center",
    minWidth: 110,
    gap: 10,
  },
  selectItemText: {
    fontSize: 14,
  },
});
