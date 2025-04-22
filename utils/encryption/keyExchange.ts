export async function generateECDHKeypair(): Promise<{
  publicKey: string;
  privateKey: string;
}> {
  const keyPair = await crypto.subtle.generateKey(
    {
      name: "ECDH",
      namedCurve: "P-256",
    },
    true,
    ["deriveKey", "deriveBits"]
  );

  const exportedPublicKey = await crypto.subtle.exportKey(
    "raw",
    keyPair.publicKey
  );
  const exportedPrivateKey = await crypto.subtle.exportKey(
    "pkcs8",
    keyPair.privateKey
  );

  return {
    publicKey: Buffer.from(exportedPublicKey).toString("base64"),
    privateKey: Buffer.from(exportedPrivateKey).toString("base64"),
  };
}

export async function deriveSharedKey(
  base64PrivateKey: string,
  base64PeerPublicKey: string
): Promise<string> {
  const privateKey = await crypto.subtle.importKey(
    "pkcs8",
    Buffer.from(base64PrivateKey, "base64"),
    { name: "ECDH", namedCurve: "P-256" },
    false,
    ["deriveBits"]
  );

  const peerPublicKey = await crypto.subtle.importKey(
    "raw",
    Buffer.from(base64PeerPublicKey, "base64"),
    { name: "ECDH", namedCurve: "P-256" },
    false,
    []
  );

  const sharedSecret = await crypto.subtle.deriveBits(
    { name: "ECDH", public: peerPublicKey },
    privateKey,
    256
  );

  return Buffer.from(sharedSecret).toString("base64");
}
