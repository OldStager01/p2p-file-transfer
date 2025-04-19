import { useEffect, useState, useCallback } from "react";
import ZeroconfService, {
  DiscoveredDevice,
} from "@/services/lan/zeroconfService"; // Path to your custom service
import { PermissionsAndroid } from "react-native";

async function requestPermissions() {
  await PermissionsAndroid.requestMultiple([
    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
    PermissionsAndroid.PERMISSIONS.ACCESS_WIFI_STATE,
  ]);
}
export default function useZeroconfService() {
  requestPermissions();
  const [devices, setDevices] = useState<DiscoveredDevice[]>([]);
  const [isAdvertising, setIsAdvertising] = useState(false);

  // Initialize the ZeroconfService singleton
  const service = ZeroconfService.getInstance();

  // Handle device updates
  const handleDevicesUpdated = useCallback(
    (updatedDevices: DiscoveredDevice[]) => {
      setDevices(updatedDevices);
    },
    []
  );

  useEffect(() => {
    // Subscribe to device updates
    service.onDevicesUpdate(handleDevicesUpdated);
    // Cleanup on component unmount
    return () => {
      service.cleanup();
    };
  }, [handleDevicesUpdated]);

  // Start Advertising
  const startAdvertising = () => {
    service.advertise();
    setIsAdvertising(true);
  };

  // Stop Advertising
  const stopAdvertising = () => {
    service.stopAdvertising();
    setIsAdvertising(false);
  };

  // Start discovery
  const startDiscovery = () => {
    service.startDiscovery();
  };

  // Stop discovery
  const stopDiscovery = () => {
    service.stopDiscovery();
  };

  // Refresh devices (trigger a re-scan)
  const refreshDevices = () => {
    service.stopDiscovery(); // Stop the current discovery
    service.startDiscovery(); // Start discovery again
  };

  return {
    devices,
    startAdvertising,
    stopAdvertising,
    startDiscovery,
    stopDiscovery,
    refreshDevices,
  };
}
