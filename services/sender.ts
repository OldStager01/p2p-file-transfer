import { EncryptedChunk } from "../utils/encryption/encryptor";
export async function sender(index: number, encryptedData: EncryptedChunk) {
  console.log(`📦 Sending Chunk #${index}`);
  // Simulate latency
  await new Promise((res) => setTimeout(res, 500));
}
