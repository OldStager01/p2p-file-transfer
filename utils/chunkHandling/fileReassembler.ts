import * as FileSystem from "expo-file-system";
import { Platform } from "react-native";
// import * as Sharing from "expo-sharing";
// import { Alert } from "react-native";
import { decryptChunk } from "../encryption/decryptor";
import * as MediaLibrary from "expo-media-library";
// import * as Permissions from "expo-permissions";
import * as mime from "react-native-mime-types";
// import * as path from "path-browserify";

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
  private async checkAndProcessCompletedFile(
    sessionId: string,
    force: boolean = false
  ): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    const isKnownComplete =
      session.totalChunks !== undefined &&
      session.receivedChunks >= session.totalChunks;

    // Single chunk file detection
    const isSingleChunk = session.receivedChunks === 1;

    // If we know the file is complete, or forcing completion, or it's a single chunk
    if (
      force ||
      isKnownComplete ||
      (session.receivedChunks > 100 && !session.totalChunks) ||
      isSingleChunk
    ) {
      if (isSingleChunk && !force) {
        console.log(
          `[FileReassembler] Single chunk file detected for session ${sessionId}`
        );
      }

      if (force) {
        console.log(
          `[FileReassembler] Forcing completion of session ${sessionId}`
        );
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

      // Generate a file name with appropriate extension based on MIME type
      const fileName = this.generateFileName(session);

      let fileUri;

      // First save to app's cache directory (always works on both platforms)
      const tempDir = `${FileSystem.cacheDirectory}downloads/`;
      await FileSystem.makeDirectoryAsync(tempDir, { intermediates: true });
      const tempFileUri = `${tempDir}${fileName}`;

      console.log(`[FileReassembler] Saving temporary file to: ${tempFileUri}`);

      // Create and write to temp file
      await this.writeChunksToFile(tempFileUri, sortedIndices, session);

      console.log(`[FileReassembler] Temp file written successfully`);

      // Now save to the actual device downloads folder based on platform
      if (Platform.OS === "android") {
        fileUri = await this.saveToAndroidDownloads(tempFileUri, fileName);
      } else {
        // On iOS, we'll use MediaLibrary
        fileUri = await this.saveToIOSDownloads(tempFileUri, fileName);
      }

      console.log(`[FileReassembler] File saved to downloads: ${fileUri}`);

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
    tempFileUri: string,
    fileName: string
  ): Promise<string> {
    try {
      console.log(`[FileReassembler] Saving to Android Downloads: ${fileName}`);

      // Get permissions first (needed for Android 10+)
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== "granted") {
        throw new Error("Media library permission not granted");
      }

      // Save the file to media library
      const asset = await MediaLibrary.createAssetAsync(tempFileUri);

      // Get the album for Downloads
      const album = await MediaLibrary.getAlbumAsync("Download");
      if (album) {
        await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
      } else {
        // If Download album doesn't exist, create it
        await MediaLibrary.createAlbumAsync("Download", asset, false);
      }

      console.log(`[FileReassembler] File saved to Downloads: ${asset.uri}`);
      return asset.uri;
    } catch (error) {
      console.error(`[FileReassembler] Failed to save to Downloads:`, error);
      // Return the temp file as a fallback
      return tempFileUri;
    }
  }

  private async saveToIOSDownloads(
    tempFileUri: string,
    fileName: string
  ): Promise<string> {
    try {
      console.log(`[FileReassembler] Saving to iOS library: ${fileName}`);

      // Get permissions first
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== "granted") {
        throw new Error("Media library permission not granted");
      }

      // Save the file to media library
      const asset = await MediaLibrary.createAssetAsync(tempFileUri);
      console.log(`[FileReassembler] File saved to iOS library: ${asset.uri}`);
      return asset.uri;
    } catch (error) {
      console.error(`[FileReassembler] Failed to save to iOS library:`, error);
      // Return the temp file as a fallback
      return tempFileUri;
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
      if (!savedInfo.exists) {
        console.error(`[FileReassembler] File not found: ${fileUri}`);
        throw new Error(`File not found: ${fileUri}`);
      }
      console.log(`[FileReassembler] File written to: ${fileUri}`);
      console.log(`[FileReassembler] File size: ${savedInfo.size} bytes`);
    } catch (error) {
      console.error(`[FileReassembler] Error writing chunks to file:`, error);
      throw error;
    }
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
  public forceCompleteSession(sessionId: string): void {
    console.log(`[FileReassembler] Force completing session ${sessionId}`);
    this.checkAndProcessCompletedFile(sessionId, true);
  }

  // Update the checkAndProcessCompletedFile method to accept a force parameter

  private getFileExtensionFromData(data: string): string | null {
    // Detect file type from the base64 data signature
    // Most file formats have magic bytes at the beginning that can identify them

    // Check if it's a PNG
    if (data.startsWith("iVBORw0KGgo")) {
      return "png";
    }

    // Check if it's a JPEG
    if (data.startsWith("/9j/") || data.startsWith("JVBERi0x")) {
      return "jpg";
    }

    // Check if it's a PDF
    if (data.startsWith("JVBERi0x")) {
      return "pdf";
    }

    // Check if it's a GIF
    if (data.startsWith("R0lGODlh") || data.startsWith("R0lGODdh")) {
      return "gif";
    }

    // Add more signatures as needed

    // If none matched, return null
    return null;
  }

  // Update the generateFileName method to be more robust
  private generateFileName(session: FileSession): string {
    // Start with the provided name or a timestamp
    let fileName = session.fileName || `file_${Date.now()}`;
    let extension = null;

    // First attempt: Get extension from the provided fileName
    const lastDot = fileName.lastIndexOf(".");
    if (lastDot > 0) {
      // Filename already has extension
      return fileName;
    }

    // Second attempt: Get extension from mimeType
    if (session.mimeType) {
      extension = mime.extension(session.mimeType);
    }

    // Third attempt: Try to detect from the first chunk content
    if (!extension && session.chunks.has(0)) {
      const firstChunkData = session.chunks.get(0) || "";
      extension = this.getFileExtensionFromData(firstChunkData);
    }
    // Fourth attempt: Check original file path if available
    // if (!extension && session.originalPath) {
    //   const pathExt = path.extname(session.originalPath);
    //   if (pathExt && pathExt.length > 1) {
    //     extension = pathExt.substring(1); // Remove the dot
    //   }
    // }

    // If we found an extension, add it
    if (extension) {
      fileName = `${fileName}.${extension}`;
    }

    // Sanitize file name
    return fileName.replace(/[/\\?%*:|"<>]/g, "_");
  }
}
