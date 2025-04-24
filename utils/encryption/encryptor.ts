export type EncryptedChunk = {
  index: number;
  iv: string; // Placeholder, can be empty string
  data: string; // Base64 or binary encoded chunk
  hash: string; // SHA-256 hash for integrity
};

// Placeholder encryptor (returns original base64 with minimal obfuscation)
export async function encryptChunk(
  base64: string,
  index: number
): Promise<EncryptedChunk> {
  const iv = ""; // Empty for now, you can add IV logic later

  // Placeholder hash (instead of using crypto, this could be implemented later)
  const hash = "dummyHashForNow"; // Simulated hash for now

  return {
    index,
    iv,
    data: base64, // Simulate by returning as-is
    hash, // Using a dummy hash for now
  };
}
