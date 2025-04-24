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

const SCREEN_WIDTH = Dimensions.get("window").width;

export default function FileChunkTester() {
  const [logs, setLogs] = useState<string[]>([]);
  const [progress, setProgress] = useState(0);
  const [totalSize, setTotalSize] = useState(1); // Prevent division by zero

  const appendLog = (msg: string) => {
    setLogs((prev) => [...prev, msg]);
  };

  const handlePickFile = async () => {
    const uri =
      "content://com.android.externalstorage.documents/document/primary%3ADownload%2Fapp-release.apk";

    setLogs([]);
    setProgress(0);

    try {
      const fileInfo = await FileSystem.getInfoAsync(uri, { size: true });
      if (!fileInfo.exists) throw new Error("File does not exist");

      const fileSize = fileInfo.size ?? 1;
      setTotalSize(fileSize);

      appendLog("📂 Starting chunked encryption & upload...");

      await processChunksOnTheFly(uri, (index, encryptedChunk) => {
        const chunkSize = encryptedChunk.length * (3 / 4); // Approx base64 decoded size
        setProgress((prev) => Math.min(prev + chunkSize / fileSize, 1));

        if (encryptedChunk === "⏳ started") {
          setLogs((prev) => [...prev, `🚀 Starting chunk #${index}`]);
        } else {
          setLogs((prev) => [...prev, `✅ Chunk #${index} sent`]);
        }
      });

      appendLog("✅ All chunks encrypted, sent & cleaned up.");
    } catch (err: any) {
      appendLog(`❌ Error: ${err.message}`);
    }
  };

  return (
    <View style={styles.container}>
      <Button title="Pick and Test File Upload" onPress={handlePickFile} />
      <View style={styles.progressBar}>
        <View
          style={[
            styles.progressFill,
            { width: `${(progress * 100).toFixed(2)}%` },
          ]}
        />
      </View>
      <Text style={styles.progressText}>
        Progress: {(progress * 100).toFixed(1)}%
      </Text>

      <Button title="Clear Logs" onPress={() => setLogs([])} />

      <ScrollView style={{ marginTop: 16 }}>
        {logs.map((log, index) => (
          <Text key={index} style={styles.logText}>
            {log}
          </Text>
        ))}
      </ScrollView>
    </View>
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
