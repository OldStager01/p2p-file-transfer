import { useAuth } from "@/providers/AuthProvider";
import { useRouter } from "expo-router";
import { ActivityIndicator, Text, View } from "react-native";
import { useEffect } from "react";

export default function Index() {
  const { session, loading, error } = useAuth();
  const router = useRouter();
  useEffect(() => {
    if (!loading) {
      if (session) {
        router.replace("/(user)/(transfer)/local");
      } else {
        router.replace("/signIn");
      }
    }
  }, [session, loading]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator />
      </View>
    );
  }

  if (error) {
    return <Text>{error.message}</Text>;
  }

  return null;
}
