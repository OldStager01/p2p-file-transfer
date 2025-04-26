import { Pressable, StyleSheet, Text, View } from "react-native";
import Colors from "../constants/Colors";
import { forwardRef } from "react";
import { useTheme } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";

type ButtonProps = {
  text: string;
  textStyle?: object;
  icon?: string;
} & React.ComponentPropsWithoutRef<typeof Pressable>;

const Button = forwardRef<View | null, ButtonProps>(
  ({ text, style, icon, textStyle, ...pressableProps }, ref) => {
    const { colors } = useTheme();
    return (
      <Pressable
        ref={ref}
        {...pressableProps}
        style={[
          {
            ...styles.container,
            backgroundColor: colors.text,
            ...(style as object),
          },
        ]}
      >
        {icon && (
          <Ionicons name={icon as any} size={24} color={colors.background} />
        )}
        <Text style={[{ ...styles.text, color: colors.background }, textStyle]}>
          {text}
        </Text>
      </Pressable>
    );
  }
);

const styles = StyleSheet.create({
  container: {
    padding: 15,
    alignItems: "center",
    borderRadius: 100,
    marginVertical: 10,
    flexDirection: "row",
    justifyContent: "center",
  },
  text: {
    fontSize: 16,
    fontWeight: "600",
    color: "white",
    marginLeft: 8,
  },
});

export default Button;
