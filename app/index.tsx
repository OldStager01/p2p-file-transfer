import useZeroconfService from "@/hooks/useZeroconf";
import ZeroconfService from "@/services/lan/zeroconfService";
import { Redirect } from "expo-router";
import { useEffect } from "react";
import { StatusBar } from "expo-status-bar";
export default function Index() {
  const { startAdvertising, stopAdvertising } = useZeroconfService();
  useEffect(() => {
    startAdvertising();
    return () => {
      stopAdvertising();
    };
  }, []);

  return <Redirect href={"/(user)/(send)/local"} />;
}
