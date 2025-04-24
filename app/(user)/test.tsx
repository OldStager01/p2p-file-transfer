import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Button,
  Text,
  ScrollView,
  Dimensions,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  Platform,
} from "react-native";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import { processChunksOnTheFly } from "@/utils/chunkHandling/chunkProcessor";
import { startTcpServer, stopTcpServer } from "@/services/lan/tcp/server";
import { useRoute, useNavigation } from "@react-navigation/native";
import { useSelectedItems } from "@/providers/SelectedItemsProvider";
import { Ionicons } from "@expo/vector-icons";

const SCREEN_WIDTH = Dimensions.get("window").width;

export default function FileChunkTester() {
  const [logs, setLogs] = useState<string[]>([]);
  const [progress, setProgress] = useState(0);
  const [totalSize, setTotalSize] = useState(1); // Prevent division by zero
  const [isServerRunning, setIsServerRunning] = useState(false);
  const [isTransferring, setIsTransferring] = useState(false);
  const [receivedFiles, setReceivedFiles] = useState<
    Array<{ uri: string; fileName: string; size?: number }>
  >([]);
  const scrollViewRef = useRef<ScrollView>(null);

  const route = useRoute();
  const navigation = useNavigation();
  const { device }: any = route?.params ?? {};

  // Auto-scroll logs when new entries are added
  useEffect(() => {
    if (scrollViewRef.current) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [logs]);

  // Auto-start server when component mounts
  useEffect(() => {
    startServer();
    return () => {
      if (isServerRunning) {
        stopServer();
      }
    };
  }, []);

  const appendLog = (msg: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs((prev) => [...prev, `[${timestamp}] ${msg}`]);
  };

  const startServer = () => {
    if (isServerRunning) {
      appendLog("📡 Server already running");
      return;
    }

    try {
      startTcpServer({
        port: 12345,
        host: "0.0.0.0",
        onConnection: (info) => {
          appendLog(`📱 Client connected: ${info.remoteAddress}`);
        },
        onChunkReceived: (chunk, info) => {
          appendLog(
            `📦 Received chunk ${chunk.index} from ${info.remoteAddress}`
          );
        },
        onFileComplete: (fileUri, fileName) => {
          appendLog(`✅ File downloaded: ${fileName}`);
          console.log(`[App] File saved to: ${fileUri}`);

          // Get the file extension for proper icon display
          const extension = fileName.split(".").pop()?.toLowerCase() || "";

          setReceivedFiles((prev) => [
            ...prev,
            {
              uri: fileUri,
              fileName,
              extension,
              size: fileUri ? getFileSizeFromUri(fileUri) : undefined,
            },
          ]);

          // Show notification
          Alert.alert(
            "File Downloaded",
            `Successfully downloaded: ${fileName}`,
            [
              { text: "OK" },
              {
                text: "Open",
                onPress: () => shareFile(fileUri),
              },
            ]
          );
        },
        onTransferProgress: (sessionId, receivedChunks, totalChunks) => {
          if (totalChunks) {
            const progressPercent = (receivedChunks / totalChunks) * 100;
            appendLog(`📊 Transfer progress: ${progressPercent.toFixed(0)}%`);
          } else {
            appendLog(`📊 Received chunk ${receivedChunks}`);
          }
        },
        onError: (err: any) => {
          appendLog(`❌ Error: ${err.message}`);
          console.error("[TCP Server Error]", err);
        },
        onClose: () => {
          appendLog("🔌 Connection closed");
        },
      });

      setIsServerRunning(true);
      appendLog("🟢 Server started on port 12345");
    } catch (error: any) {
      appendLog(`❌ Failed to start server: ${error.message}`);
      console.error("Server start error:", error);
    }
  };

  const stopServer = () => {
    try {
      stopTcpServer();
      setIsServerRunning(false);
      appendLog("🔴 Server stopped");
    } catch (error: any) {
      appendLog(`❌ Error stopping server: ${error.message}`);
    }
  };

  const getFileSizeFromUri = (uri: string): number | undefined => {
    try {
      const fileInfo = FileSystem.getInfoAsync(uri, { size: true });
      return fileInfo.then((info) => (info.exists ? info.size : undefined));
    } catch {
      return undefined;
    }
  };

  const shareFile = async (fileUri: string) => {
    try {
      await Sharing.shareAsync(fileUri, {
        mimeType: "*/*",
        dialogTitle: "Open file with...",
      });
    } catch (error: any) {
      appendLog(`❌ Error sharing file: ${error.message}`);
    }
  };

  const deleteReceivedFile = async (fileUri: string, index: number) => {
    try {
      const fileInfo = await FileSystem.getInfoAsync(fileUri);
      if (fileInfo.exists) {
        await FileSystem.deleteAsync(fileUri);
        appendLog(`🗑️ Deleted file: ${receivedFiles[index].fileName}`);
      }

      setReceivedFiles((files) => files.filter((_, i) => i !== index));
    } catch (error: any) {
      appendLog(`❌ Error deleting file: ${error.message}`);
    }
  };

  const { selectedItems } = useSelectedItems();

  const handleSendFile = async () => {
    if (!device?.ip) {
      Alert.alert("Error", "No device selected to send to");
      return;
    }

    if (!selectedItems || selectedItems.length === 0) {
      Alert.alert("Error", "No file selected to send");
      return;
    }

    const uri = selectedItems[0].data.uri;
    setLogs([]);
    setProgress(0);
    setIsTransferring(true);

    try {
      const fileInfo = await FileSystem.getInfoAsync(uri, { size: true });
      if (!fileInfo.exists) throw new Error("File does not exist");

      const fileSize = fileInfo.size ?? 1;
      setTotalSize(fileSize);

      appendLog("📂 Starting file transfer...");
      appendLog(`📄 File: ${uri.split("/").pop()}`);
      appendLog(`📊 Size: ${formatFileSize(fileSize)}`);

      await processChunksOnTheFly(
        uri,
        (index, status, chunkProgress) => {
          if (chunkProgress !== undefined) {
            setProgress(chunkProgress);
          }

          if (status.includes("started")) {
            appendLog(`🚀 Sending chunk #${index}`);
          } else if (status.includes("sent")) {
            appendLog(`✅ Chunk #${index} sent`);
          } else if (status.includes("retrying")) {
            appendLog(`⚠️ Retrying chunk #${index}`);
          } else if (status.includes("failed")) {
            appendLog(`❌ Failed to send chunk #${index}`);
          }
        },
        device
      );

      appendLog("✅ File successfully sent!");
    } catch (err: any) {
      appendLog(`❌ Error: ${err.message}`);
      console.error("File transfer error:", err);
    } finally {
      setIsTransferring(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + " B";
    else if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    else if (bytes < 1024 * 1024 * 1024)
      return (bytes / (1024 * 1024)).toFixed(1) + " MB";
    else return (bytes / (1024 * 1024 * 1024)).toFixed(1) + " GB";
  };

  const clearLogs = () => {
    setLogs([]);
  };

  const safeProgress =
    typeof progress === "number" && progress >= 0 ? progress : 0;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>File Transfer</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.container}>
        <View style={styles.serverControls}>
          <TouchableOpacity
            style={[
              styles.serverButton,
              isServerRunning
                ? styles.serverStopButton
                : styles.serverStartButton,
            ]}
            onPress={isServerRunning ? stopServer : startServer}
            disabled={isTransferring}
          >
            <Ionicons
              name={isServerRunning ? "stop-circle" : "play-circle"}
              size={24}
              color="#fff"
            />
            <Text style={styles.serverButtonText}>
              {isServerRunning ? "Stop Server" : "Start Server"}
            </Text>
          </TouchableOpacity>

          <View style={styles.serverStatus}>
            <View
              style={[
                styles.statusIndicator,
                { backgroundColor: isServerRunning ? "#4CAF50" : "#F44336" },
              ]}
            />
            <Text style={styles.statusText}>
              {isServerRunning ? "Server Running" : "Server Stopped"}
            </Text>
          </View>
        </View>

        <View style={styles.deviceInfo}>
          <Text style={styles.deviceTitle}>Connected Device:</Text>
          <Text style={styles.deviceText}>
            {device ? `${device.name} (${device.ip})` : "No device connected"}
          </Text>
        </View>

        <TouchableOpacity
          style={[
            styles.sendButton,
            isTransferring && styles.sendButtonDisabled,
          ]}
          onPress={handleSendFile}
          disabled={isTransferring || !device}
        >
          {isTransferring ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="cloud-upload" size={24} color="#fff" />
              <Text style={styles.sendButtonText}>Send File</Text>
            </>
          )}
        </TouchableOpacity>

        {isTransferring && (
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${safeProgress * 100}%` },
                ]}
              />
            </View>
            <Text style={styles.progressText}>
              {(safeProgress * 100).toFixed(0)}%
            </Text>
          </View>
        )}

        {receivedFiles.length > 0 && (
          <View style={styles.filesSection}>
            <Text style={styles.sectionTitle}>Received Files</Text>
            {receivedFiles.map((file, index) => (
              <View key={index} style={styles.fileItem}>
                <View style={styles.fileInfo}>
                  <Text style={styles.fileName}>{file.fileName}</Text>
                  <Text
                    style={styles.fileDetails}
                    numberOfLines={1}
                    ellipsizeMode="middle"
                  >
                    {file.size ? formatFileSize(file.size) : ""}
                  </Text>
                </View>
                <View style={styles.fileActions}>
                  <TouchableOpacity
                    style={styles.fileActionButton}
                    onPress={() => shareFile(file.uri)}
                  >
                    <Ionicons name="open-outline" size={22} color="#4CAF50" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.fileActionButton}
                    onPress={() => deleteReceivedFile(file.uri, index)}
                  >
                    <Ionicons name="trash-outline" size={22} color="#F44336" />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        <View style={styles.logsContainer}>
          <View style={styles.logsHeader}>
            <Text style={styles.sectionTitle}>Logs</Text>
            <TouchableOpacity style={styles.clearButton} onPress={clearLogs}>
              <Ionicons name="trash-outline" size={18} color="#fff" />
              <Text style={styles.clearButtonText}>Clear</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.logsScrollView} ref={scrollViewRef}>
            {logs.length === 0 ? (
              <Text style={styles.noLogsText}>No logs yet</Text>
            ) : (
              logs.map((log, index) => (
                <Text key={index} style={styles.logText}>
                  {log}
                </Text>
              ))
            )}
          </ScrollView>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#121212",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#1E1E1E",
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  headerTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
    flex: 1,
    textAlign: "center",
  },
  backButton: {
    position: "absolute",
    left: 16,
    zIndex: 10,
  },
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#121212",
  },
  serverControls: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  serverButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    flex: 1,
  },
  serverStartButton: {
    backgroundColor: "#2196F3",
  },
  serverStopButton: {
    backgroundColor: "#F44336",
  },
  serverButtonText: {
    color: "#fff",
    marginLeft: 8,
    fontWeight: "600",
  },
  serverStatus: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 16,
  },
  statusIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  statusText: {
    color: "#fff",
    fontSize: 14,
  },
  deviceInfo: {
    backgroundColor: "#1E1E1E",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  deviceTitle: {
    color: "#999",
    marginBottom: 4,
    fontSize: 14,
  },
  deviceText: {
    color: "#fff",
    fontSize: 16,
  },
  sendButton: {
    flexDirection: "row",
    backgroundColor: "#4CAF50",
    paddingVertical: 14,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  sendButtonDisabled: {
    backgroundColor: "#2E5A30",
  },
  sendButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  progressContainer: {
    marginBottom: 16,
  },
  progressBar: {
    height: 8,
    backgroundColor: "#333",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#4CAF50",
    borderRadius: 4,
  },
  progressText: {
    color: "#fff",
    marginTop: 8,
    textAlign: "right",
    fontSize: 14,
  },
  filesSection: {
    backgroundColor: "#1E1E1E",
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  sectionTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  fileItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  fileInfo: {
    flex: 1,
  },
  fileName: {
    color: "#fff",
    fontSize: 14,
  },
  fileDetails: {
    color: "#999",
    fontSize: 12,
    marginTop: 2,
  },
  fileActions: {
    flexDirection: "row",
  },
  fileActionButton: {
    padding: 8,
    marginLeft: 8,
  },
  logsContainer: {
    flex: 1,
    backgroundColor: "#1E1E1E",
    borderRadius: 8,
  },
  logsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  clearButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  clearButtonText: {
    color: "#fff",
    marginLeft: 4,
    fontSize: 14,
  },
  logsScrollView: {
    flex: 1,
    padding: 12,
  },
  logText: {
    color: "#ccc",
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
    fontSize: 12,
    marginBottom: 4,
  },
  noLogsText: {
    color: "#666",
    textAlign: "center",
    marginTop: 20,
    fontStyle: "italic",
  },
});
