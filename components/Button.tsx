import { Pressable, StyleSheet, Text, View } from "react-native";
import Colors from "../constants/Colors";
import { forwardRef } from "react";
import { useTheme } from "@react-navigation/native";

type ButtonProps = {
  text: string;
} & React.ComponentPropsWithoutRef<typeof Pressable>;

const Button = forwardRef<View | null, ButtonProps>(
  ({ text, style, ...pressableProps }, ref) => {
    const { colors } = useTheme();
    return (
      <Pressable
        ref={ref}
        {...pressableProps}
        style={{
          ...styles.container,
          backgroundColor: colors.text,
          ...(style as object),
        }}
      >
        <Text style={{ ...styles.text, color: colors.background }}>{text}</Text>
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
  },
  text: {
    fontSize: 16,
    fontWeight: "600",
    color: "white",
  },
});

export default Button;
