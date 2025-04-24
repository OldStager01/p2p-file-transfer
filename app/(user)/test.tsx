import React, { useState } from "react";
import {
  View,
  Button,
  Text,
  ScrollView,
  Dimensions,
  StyleSheet,
} from "react-native";
import * as FileSystem from "expo-file-system";
import { processChunksOnTheFly } from "@/utils/chunkHandling/chunkProcessor";
import { startTcpServer, stopTcpServer } from "@/services/lan/tcp/server";
import { useRoute } from "@react-navigation/native";
import { useSelectedItems } from "@/providers/SelectedItemsProvider";

const SCREEN_WIDTH = Dimensions.get("window").width;

export default function FileChunkTester() {
  const [logs, setLogs] = useState<string[]>([]);
  const [progress, setProgress] = useState(0);
  const [totalSize, setTotalSize] = useState(1); // Prevent division by zero
  const [received, setReceived] = useState("");
  const safeProgress =
    typeof progress === "number" && progress >= 0 ? progress : 0;

  const route = useRoute();
  const { device }: any = route?.params ?? {};
  console.log("Device", device);
  const appendLog = (msg: string) => {
    setLogs((prev) => [...prev, msg]);
  };

  const startReceiverServer = () => {
    startTcpServer({
      port: 12345,
      host: "0.0.0.0",
      onConnection: (info) =>
        console.log("[TCP Server] Client connected:", info.remoteAddress),
      onChunkReceived: (chunk, info) => {
        setReceived((prev) => prev + chunk.toString());
        console.log(
          "[TCP Server Received Chunk]",
          chunk.toString().slice(0, 20)
        );
      },
      onError: (err) => console.error("[TCP Server Error]", err),
      onClose: () => console.log("[TCP Server] Connection closed"),
    });
  };

  const stopReceiverServer = () => {
    stopTcpServer();
  };

  const { selectedItems } = useSelectedItems();
  const handlePickFile = async () => {
    const uri = selectedItems[0].data.uri;
    console.log(uri);
    setLogs([]);
    setProgress(0);

    try {
      const fileInfo = await FileSystem.getInfoAsync(uri, { size: true });
      if (!fileInfo.exists) throw new Error("File does not exist");

      const fileSize = fileInfo.size ?? 1;
      setTotalSize(fileSize);

      appendLog("📂 Starting chunked encryption & upload...");

      await processChunksOnTheFly(
        uri,
        (index, encryptedChunk) => {
          const chunkSize = encryptedChunk.length * (3 / 4); // Approx base64 decoded size
          setProgress((prev) => Math.min(prev + chunkSize / fileSize, 1));

          if (encryptedChunk === "⏳ started") {
            setLogs((prev) => [...prev, `🚀 Starting chunk #${index}`]);
          } else {
            setLogs((prev) => [...prev, `✅ Chunk #${index} sent`]);
          }
        },
        device
      );

      appendLog("✅ All chunks encrypted, sent & cleaned up.");
    } catch (err: any) {
      console.log(err);
      appendLog(`❌ Error: ${err.message}`);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Button title="Start Receiver Server" onPress={startReceiverServer} />
      <Button title="Stop Receiver Server" onPress={stopReceiverServer} />
      <Button title="Pick and Test File Upload" onPress={handlePickFile} />
      <View style={styles.progressBar}>
        <View
          style={[
            styles.progressFill,
            { width: safeProgress * SCREEN_WIDTH }, // Update to pixel-based width
          ]}
        />
      </View>

      <Text style={styles.progressText}>
        Progress: {(progress * 100).toFixed(1)}%
      </Text>

      <Button
        title="Clear Logs"
        onPress={() => {
          setLogs([]);
          setReceived("");
        }}
      />

      <ScrollView style={{ marginTop: 16 }}>
        {logs.map((log, index) => (
          <Text key={index} style={styles.logText}>
            {log}
          </Text>
        ))}
      </ScrollView>

      <View
        style={{
          marginTop: 16,
          height: 10,
          width: SCREEN_WIDTH,
          backgroundColor: "#444",
        }}
      ></View>
      <View>
        <Text style={styles.logText}>Received:</Text>
        <Text style={{ marginTop: 16, color: "white" }}>
          {/* {received.map((log, index) => (
            <Text key={index} style={styles.logText}>
              {log}
            </Text>
          ))} */}
          {JSON.stringify(received)}
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    marginTop: 50,
    backgroundColor: "#121212",
  },
  progressBar: {
    height: 10,
    marginTop: 16,
    backgroundColor: "#444",
    borderRadius: 5,
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#4CAF50",
    borderRadius: 5,
  },
  progressText: {
    color: "white",
    marginTop: 8,
  },
  logText: {
    color: "white",
    marginBottom: 8,
  },
});
