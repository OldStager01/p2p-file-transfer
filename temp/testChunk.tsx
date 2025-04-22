import React, { useState } from "react";
import { View, Button, Text, ScrollView, Dimensions } from "react-native";
import * as FileSystem from "expo-file-system";
import { streamFileInChunks } from "@/utils/chunkHandling/fileChunker";

const SCREEN_WIDTH = Dimensions.get("window").width;

export default function FileChunkTester() {
  const [logs, setLogs] = useState<string[]>([]);
  const [progress, setProgress] = useState(0);
  const [totalSize, setTotalSize] = useState(1); // Prevent division by zero

  const handlePickFile = async () => {
    const uri =
      "content://com.android.externalstorage.documents/document/primary%3ADownload%2Fapplication-529d5991-4ab7-4066-bd72-b2f3f6ffc226.apk";

    setLogs([]);
    setProgress(0);

    try {
      const fileInfo = await FileSystem.getInfoAsync(uri, { size: true });
      if (!fileInfo.exists) {
        throw new Error("File does not exist");
      }
      const fileSize = fileInfo.size ?? 1;
      setTotalSize(fileSize);

      let offset = 0;
      let newLogs: string[] = [];

      for await (const chunk of streamFileInChunks(uri)) {
        offset += chunk.base64Chunk.length * (3 / 4); // Estimate decoded size
        const percentage = Math.min(offset / fileSize, 1);
        setProgress(percentage);
        newLogs.push(
          `Chunk #${chunk.index}: ${chunk.base64Chunk.slice(0, 50)}...`
        );
        setLogs([...newLogs]);
      }

      newLogs.push("✅ Finished streaming file.");
      setLogs([...newLogs]);
    } catch (err: any) {
      setLogs([`❌ Error: ${err.message}`]);
    }
  };

  return (
    <View
      style={{
        flex: 1,
        padding: 16,
        marginTop: 50,
        backgroundColor: "#121212",
      }}
    >
      <Button title="Pick and Stream File" onPress={handlePickFile} />
      <View
        style={{
          height: 10,
          marginTop: 16,
          backgroundColor: "#444",
          borderRadius: 5,
        }}
      >
        <View
          style={{
            height: "100%" as string,
            width: `${(progress * 100).toFixed(2)}%` as string,
            backgroundColor: "#4CAF50",
            borderRadius: 5,
          }}
        />
      </View>
      <Text style={{ color: "white", marginTop: 8 }}>
        Progress: {(progress * 100).toFixed(1)}%
      </Text>

      <Button title="Clear Logs" onPress={() => setLogs([])} />

      <ScrollView style={{ marginTop: 16 }}>
        {logs.map((log, index) => (
          <Text key={index} style={{ marginBottom: 8, color: "white" }}>
            {log}
          </Text>
        ))}
      </ScrollView>
    </View>
  );
}
