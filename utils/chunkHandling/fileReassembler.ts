import * as FileSystem from "expo-file-system";
import { Platform } from "react-native";
import * as Sharing from "expo-sharing";
import { Alert } from "react-native";
import { decryptChunk } from "../encryption/decryptor";

type FileChunk = {
  sessionId: string;
  index: number;
  data: string; // Encrypted data
};

type FileSession = {
  chunks: Map<number, string>; // Map of index -> decrypted data
  fileName?: string;
  mimeType?: string;
  totalChunks?: number;
  receivedChunks: number;
};

export class FileReassembler {
  private sessions: Map<string, FileSession> = new Map();
  private fileCompletionCallbacks: Map<
    string,
    (fileUri: string, fileName: string) => void
  > = new Map();

  constructor(
    private onProgressUpdate?: (
      sessionId: string,
      received: number,
      total?: number
    ) => void
  ) {}

  // Register a callback for when a file is complete
  public onFileComplete(
    sessionId: string,
    callback: (fileUri: string, fileName: string) => void
  ): void {
    this.fileCompletionCallbacks.set(sessionId, callback);
  }

  // Process a new chunk
  public async processChunk(chunk: {
    sessionId: string;
    index: number;
    data: string;
    fileName?: string;
    mimeType?: string;
    totalChunks?: number;
    isLastChunk?: boolean;
  }): Promise<void> {
    const {
      sessionId,
      index,
      data,
      fileName,
      mimeType,
      totalChunks,
      isLastChunk,
    } = chunk;

    // Initialize session if it doesn't exist
    if (!this.sessions.has(sessionId)) {
      this.sessions.set(sessionId, {
        chunks: new Map(),
        fileName,
        mimeType,
        totalChunks,
        receivedChunks: 0,
      });
    }

    const session = this.sessions.get(sessionId)!;

    // Update session metadata if provided
    if (fileName && !session.fileName) session.fileName = fileName;
    if (mimeType && !session.mimeType) session.mimeType = mimeType;
    if (totalChunks && !session.totalChunks) session.totalChunks = totalChunks;

    try {
      // Decrypt chunk if not already decrypted
      const decryptedData = await decryptChunk(data, index);

      // Add to our chunks collection if not already present
      if (!session.chunks.has(index)) {
        session.chunks.set(index, decryptedData);
        session.receivedChunks++;

        // Notify about progress
        this.onProgressUpdate?.(
          sessionId,
          session.receivedChunks,
          session.totalChunks
        );

        console.log(
          `[FileReassembler] Processed chunk ${index} for session ${sessionId}. ` +
            `Progress: ${session.receivedChunks}/${session.totalChunks || "?"}`
        );
      }

      // If this is marked as the last chunk, update totalChunks if needed
      if (isLastChunk && !session.totalChunks) {
        session.totalChunks = index + 1;
        console.log(
          `[FileReassembler] Last chunk received, setting totalChunks to ${session.totalChunks}`
        );
      }

      // Check if file is complete
      await this.checkAndProcessCompletedFile(sessionId);
    } catch (error) {
      console.error(
        `[FileReassembler] Error processing chunk ${index} for session ${sessionId}:`,
        error
      );
    }
  }

  // Check if a file is complete and if so, reassemble it
  private async checkAndProcessCompletedFile(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    const isKnownComplete =
      session.totalChunks !== undefined &&
      session.receivedChunks >= session.totalChunks;

    // Single chunk file detection
    const isSingleChunk = session.receivedChunks === 1;

    // If we know the file is complete or we received a large number of chunks or it's a single chunk
    if (
      isKnownComplete ||
      (session.receivedChunks > 100 && !session.totalChunks) ||
      isSingleChunk
    ) {
      if (isSingleChunk) {
        console.log(
          `[FileReassembler] Single chunk file detected for session ${sessionId}`
        );
        // Small delay for single chunk files to ensure all data is received
        await new Promise((resolve) => setTimeout(resolve, 500));
      }

      try {
        console.log(
          `[FileReassembler] Starting file reassembly for session ${sessionId}`
        );

        // Reassemble the file
        const fileUri = await this.reassembleFile(sessionId);

        console.log(`[FileReassembler] File saved to: ${fileUri}`);

        // Invoke completion callback if registered
        const callback = this.fileCompletionCallbacks.get(sessionId);
        if (callback && fileUri) {
          console.log(
            `[FileReassembler] Calling completion callback for ${sessionId}`
          );
          callback(fileUri, session.fileName || `file_${sessionId}`);
          this.fileCompletionCallbacks.delete(sessionId);
        } else {
          console.log(
            `[FileReassembler] No completion callback found for ${sessionId}`
          );
        }

        // Clean up session after processing
        this.sessions.delete(sessionId);

        console.log(
          `[FileReassembler] File reassembly complete for session ${sessionId}`
        );
      } catch (error) {
        console.error(
          `[FileReassembler] Error reassembling file for session ${sessionId}:`,
          error
        );
      }
    } else {
      console.log(
        `[FileReassembler] File not yet complete: ${session.receivedChunks}/${
          session.totalChunks || "?"
        } chunks`
      );
    }
  }

  // Reassemble chunks into a file and save to disk
  private async reassembleFile(sessionId: string): Promise<string> {
    const session = this.sessions.get(sessionId);
    if (!session) throw new Error(`No session found for ID: ${sessionId}`);

    try {
      // Sort chunks by index
      const sortedIndices = Array.from(session.chunks.keys()).sort(
        (a, b) => a - b
      );

      // Generate a file name with appropriate extension
      const fileName = this.generateFileName(session);

      // Create a directory in the app's document directory
      const downloadDir = `${FileSystem.documentDirectory}downloads/`;
      await FileSystem.makeDirectoryAsync(downloadDir, { intermediates: true });
      const fileUri = `${downloadDir}${fileName}`;

      console.log(`[FileReassembler] Saving file to: ${fileUri}`);

      // Create and write to file
      await this.writeChunksToFile(fileUri, sortedIndices, session);

      console.log(`[FileReassembler] File written successfully`);

      // Save to downloads on Android
      if (Platform.OS === "android") {
        await this.saveToAndroidDownloads(fileUri, fileName);
      }

      return fileUri;
    } catch (error) {
      console.error(
        `[FileReassembler] Error writing file for session ${sessionId}:`,
        error
      );
      throw error;
    }
  }

  // Save to Android Downloads folder
  private async saveToAndroidDownloads(
    fileUri: string,
    fileName: string
  ): Promise<void> {
    try {
      console.log(`[FileReassembler] Sharing file to Downloads: ${fileName}`);

      // Show share dialog to save the file
      await Sharing.shareAsync(fileUri, {
        mimeType: "*/*",
        dialogTitle: `Save ${fileName}`,
        UTI: "public.item",
      });

      console.log(`[FileReassembler] Share dialog displayed for ${fileName}`);

      // Notify user
      Alert.alert(
        "File Downloaded",
        `${fileName} was downloaded successfully!`,
        [{ text: "OK" }]
      );
    } catch (error) {
      console.error(`[FileReassembler] Share error:`, error);

      // Still notify user where the file is
      Alert.alert("File Saved", `File saved to app storage: ${fileUri}`, [
        { text: "OK" },
      ]);
    }
  }

  // Write chunks to file
  private async writeChunksToFile(
    fileUri: string,
    sortedIndices: number[],
    session: FileSession
  ): Promise<void> {
    try {
      // Delete file if it already exists
      const fileInfo = await FileSystem.getInfoAsync(fileUri);
      if (fileInfo.exists) {
        await FileSystem.deleteAsync(fileUri);
      }

      // For base64 data, we need to write all at once
      // Combine all chunks
      let combinedData = "";
      for (const index of sortedIndices) {
        combinedData += session.chunks.get(index) || "";
      }

      // Write the combined data
      await FileSystem.writeAsStringAsync(fileUri, combinedData, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Get final file info for logging
      const savedInfo = await FileSystem.getInfoAsync(fileUri, { size: true });
      console.log(`[FileReassembler] File written to: ${fileUri}`);
      console.log(`[FileReassembler] File size: ${savedInfo.size} bytes`);
    } catch (error) {
      console.error(`[FileReassembler] Error writing chunks to file:`, error);
      throw error;
    }
  }

  // Generate a filename with appropriate extension
  private generateFileName(session: FileSession): string {
    let fileName = session.fileName || `file_${Date.now()}`;

    // Add extension based on mimeType if not already present
    if (session.mimeType && !fileName.includes(".")) {
      const extension = this.getExtensionFromMimeType(session.mimeType);
      if (extension) fileName = `${fileName}.${extension}`;
    }

    // Sanitize file name
    return fileName.replace(/[/\\?%*:|"<>]/g, "_");
  }

  // Helper to get extension from mime type
  private getExtensionFromMimeType(mimeType: string): string | null {
    const mimeToExt: Record<string, string> = {
      "image/jpeg": "jpg",
      "image/png": "png",
      "image/gif": "gif",
      "application/pdf": "pdf",
      "text/plain": "txt",
      "application/json": "json",
      "application/zip": "zip",
      "video/mp4": "mp4",
      "audio/mpeg": "mp3",
      // Add more as needed
    };

    return mimeToExt[mimeType] || null;
  }

  // Public method to get session status
  public getSessionStatus(sessionId: string) {
    const session = this.sessions.get(sessionId);
    if (!session) return null;

    return {
      receivedChunks: session.receivedChunks,
      totalChunks: session.totalChunks,
      fileName: session.fileName,
      isComplete:
        session.totalChunks !== undefined &&
        session.receivedChunks >= session.totalChunks,
    };
  }

  // Get active transfer sessions
  public getActiveSessions() {
    const sessions: Record<
      string,
      {
        receivedChunks: number;
        totalChunks?: number;
        fileName?: string;
        progress: number;
      }
    > = {};

    this.sessions.forEach((session, sessionId) => {
      sessions[sessionId] = {
        receivedChunks: session.receivedChunks,
        totalChunks: session.totalChunks,
        fileName: session.fileName,
        progress: session.totalChunks
          ? session.receivedChunks / session.totalChunks
          : 0,
      };
    });

    return sessions;
  }

  // Force check all sessions (for debugging)
  public forceCheckAllSessions(): void {
    console.log(
      `[FileReassembler] Force checking ${this.sessions.size} sessions`
    );

    this.sessions.forEach((_, sessionId) => {
      this.checkAndProcessCompletedFile(sessionId);
    });
  }
}
