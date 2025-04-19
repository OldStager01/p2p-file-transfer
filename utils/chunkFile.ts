import * as FileSystem from "expo-file-system";

const chunkFile = async (fileUri: string, chunkSize: number) => {
  const fileInfo = await FileSystem.getInfoAsync(fileUri);
  if (!fileInfo.exists) {
    throw new Error("File does not exist");
  }
  const fileSize = fileInfo.size;
  const chunks = [];

  for (let i = 0; i < fileSize; i += chunkSize) {
    const chunk = await FileSystem.readAsStringAsync(fileUri, {
      encoding: FileSystem.EncodingType.Base64,
      position: i,
      length: chunkSize,
    });
    chunks.push(chunk);
  }
  return chunks;
};
