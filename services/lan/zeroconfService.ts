import { EventEmitter } from "events";
import Zeroconf from "react-native-zeroconf";
import DeviceInfo from "react-native-device-info";
import { PermissionsAndroid, NativeModules, Platform } from "react-native";
// Define a type for discovered devices
export type DiscoveredDevice = {
  ip: string;
  name: string;
  port: number;
  txt?: Record<string, any>;
  host?: string;
};

const config = {
  type: "http",
  protocol: "tcp",
  domain: "local",
  // name: String(Math.floor(Math.random() * 1000000)),
  name: DeviceInfo.getDeviceNameSync(),
  port: 8081,
};

class ZeroconfService {
  private static instance: ZeroconfService | null = null;
  private zeroconf: Zeroconf;
  private discoveredDevices: Record<string, DiscoveredDevice> = {};
  private eventEmitter: EventEmitter;
  private intervalId: NodeJS.Timeout | null = null;

  private constructor() {
    this.zeroconf = new Zeroconf();
    this.eventEmitter = new EventEmitter();
    this.init();
  }

  private init() {
    this.zeroconf.on("start", () => console.log("Zeroconf scan started"));
    this.zeroconf.on("stop", () => console.log("Zeroconf scan stopped"));
    this.zeroconf.on("published", () => console.log("Service advertised"));
    this.zeroconf.on("unpublished", () =>
      console.log("Service stopped advertising")
    );

    // Event listeners for device discovery
    this.zeroconf.on("found", (serviceName: string) => {
      console.log(`Found service: ${serviceName}`);
      this.emitDevicesUpdate();
    });

    this.zeroconf.on("resolved", (service) => {
      console.log(`Resolved service: ${service}`);
      const key = `${service.host}:${service.port}`;
      this.discoveredDevices[key] = {
        name: service.name,
        ip: service.addresses[0],
        port: service.port,
        txt: service.txt,
      };
      this.emitDevicesUpdate();
    });

    this.zeroconf.on("remove", (name: string) => {
      console.log(`Removed service: ${name}`);
      const keyToRemove = Object.keys(this.discoveredDevices).find(
        (key) => this.discoveredDevices[key].name === name
      );
      if (keyToRemove) {
        delete this.discoveredDevices[keyToRemove];
      }
      this.emitDevicesUpdate();
    });

    this.zeroconf.on("error", (err: any) => {
      console.error(`Zeroconf Error: ${err}`);
    });
  }

  // Static method to get the singleton instance
  public static getInstance(): ZeroconfService {
    if (!ZeroconfService.instance) {
      ZeroconfService.instance = new ZeroconfService();
    }
    return ZeroconfService.instance;
  }

  // Start discovering devices
  startDiscovery() {
    console.log("Starting device discovery...");
    this.zeroconf.scan(config.type, config.protocol, config.domain);

    // Polling mechanism to periodically check for devices
    if (!this.intervalId) {
      this.intervalId = setInterval(() => this.checkForNewDevices(), 5000); // Check every 5 seconds
    }
  }

  // Stop discovering devices
  stopDiscovery() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.zeroconf.stop();
    console.log("Discovery stopped.");
  }

  // Periodically check for new devices
  private checkForNewDevices() {
    console.log("Checking for new devices...");
    if (Object.keys(this.discoveredDevices).length > 0) {
      console.log("Devices found:", this.discoveredDevices);
    } else {
      console.log("No devices found yet.");
    }
  }

  // Emit update of devices to listeners
  private emitDevicesUpdate() {
    const devices = Object.values(this.discoveredDevices);
    this.eventEmitter.emit("devicesUpdated", devices);
  }

  // Listen for devices update
  onDevicesUpdate(listener: (devices: DiscoveredDevice[]) => void) {
    this.eventEmitter.on("devicesUpdated", listener);
  }

  // Advertisement
  advertise() {
    console.log("Advertising device...");
    console.log("Name of device", config.name);
    this.zeroconf.publishService(
      config.type,
      config.protocol,
      config.domain,
      config.name || "Device",
      config.port
    );
  }

  stopAdvertising() {
    console.log("Stopping device advertising...");
    this.zeroconf.unpublishService(config.name);
  }
  // Cleanup resources when the service is no longer needed
  cleanup() {
    this.stopDiscovery();
    this.discoveredDevices = {}; // Clear the discovered devices
    console.log("ZeroconfService cleaned up.");
  }
}

export default ZeroconfService;
