import React from "react";
import { useAuth } from "@/providers/AuthProvider";
import { Redirect, Stack } from "expo-router";

export default function _layout() {
  const { session } = useAuth();
  if (session) {
    return <Redirect href={"/"} />;
  }
  return <Stack />;
}
