import { Button, StyleSheet, Text, View } from "react-native";
import React, { useState, useCallback } from "react";
import { useRoute } from "@react-navigation/native";
import { startTcpServer } from "@/services/lan/tcp_old/server";
import { connectAndSendChunks } from "@/services/lan/tcp_old/client";
import { Buffer } from "buffer";

export default function Test() {
  const route = useRoute();
  const { device }: any = route?.params ?? {};
  const [data, setData] = useState<string>("");

  // Prepare test data buffer
  const testData = Buffer.from("Hello from Sender!");

  // Keep track of whether the server is already running
  const [isServerRunning, setIsServerRunning] = useState(false);

  const startServer = useCallback(() => {
    if (isServerRunning) {
      console.log("Server already running");
      return;
    }

    startTcpServer({
      port: 12345,
      onChunkReceived: (chunk: Buffer, info) => {
        console.log("Received chunk:", chunk.toString());
        setData(chunk.toString());
      },
      onConnection: () => {
        console.log("Client connected");
      },
      onError: (error: any) => {
        console.log("Error:", error);
        setIsServerRunning(false);
      },
      onClose: () => {
        console.log("Connection closed");
        setIsServerRunning(false); // Allow restart
      },
    });

    setIsServerRunning(true);
  }, [isServerRunning]);

  // Send test data to the TCP server (sender)
  const sendTestData = useCallback(() => {
    if (!device) {
      console.log("Device not found");
      return;
    }

    connectAndSendChunks({
      host: device.ip,
      port: device.port,
      chunks: [Buffer.from("Hello from Sender!")],
      onProgress: (i, total) => {
        console.log(`Sent ${i}/${total}`);
      },
      onConnected: () => console.log("Sender Connected"),
      onError: (err) => {
        console.log("TCP CLIENT ERROR:", err);
      },
    });
  }, [device, testData]); // Re-run if device or testData changes

  return (
    <View style={styles.container}>
      <Button title="Start Receiver (Server)" onPress={startServer} />
      <Button title="Send Test Data" onPress={sendTestData} />
      <Button title="Clear" onPress={() => setData("")} />

      <Text style={styles.dataText}>{data}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 20,
  },
  dataText: {
    color: "white",
    fontSize: 16,
    marginTop: 20,
  },
});
