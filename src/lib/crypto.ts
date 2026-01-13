import { db, type KeyPair } from "./db";

export const KEY_PAIR_ID = "primary";

export async function generateKeyPair(): Promise<KeyPair> {
  const keyPair = await window.crypto.subtle.generateKey(
    {
      name: "RSA-OAEP",
      modulusLength: 4096,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: "SHA-256",
    },
    true,
    ["encrypt", "decrypt"],
  );

  const storedKey: KeyPair = {
    id: KEY_PAIR_ID,
    privateKey: keyPair.privateKey,
    publicKey: keyPair.publicKey,
    createdAt: Date.now(),
  };

  await db.keys.put(storedKey);

  return storedKey;
}

export async function getStoredKeyPair() {
  return await db.keys.get(KEY_PAIR_ID);
}

export async function exportPublicKey(key: CryptoKey): Promise<string> {
  const exported = await window.crypto.subtle.exportKey("spki", key);
  const exportedAsBase64 = window.btoa(
    String.fromCharCode(...new Uint8Array(exported)),
  );
  return exportedAsBase64;
}

export async function importPublicKey(pem: string): Promise<CryptoKey> {
  const binaryDerString = window.atob(pem);
  const binaryDer = new Uint8Array(binaryDerString.length);
  for (let i = 0; i < binaryDerString.length; i++) {
    binaryDer[i] = binaryDerString.charCodeAt(i);
  }

  return await window.crypto.subtle.importKey(
    "spki",
    binaryDer,
    {
      name: "RSA-OAEP",
      hash: "SHA-256",
    },
    true,
    ["encrypt"],
  );
}

export async function encryptMessage(text: string) {
  // 1. Generate a random AES session key
  const sessionKey = await window.crypto.subtle.generateKey(
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"],
  );

  // 2. Encrypt the message text with the AES key
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const encodedText = new TextEncoder().encode(text);
  const ciphertextBuffer = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    sessionKey,
    encodedText,
  );

  // 3. Export the AES key so we can encrypt it
  const exportedSessionKey = await window.crypto.subtle.exportKey(
    "raw",
    sessionKey,
  );

  return {
    ciphertext: bufferToBase64(ciphertextBuffer),
    iv: bufferToBase64(iv.buffer),
    exportedSessionKey, // Raw key bytes, caller needs to encrypt this for each participant
  };
}

export async function encryptSessionKeyFor(
  sessionKeyBytes: ArrayBuffer,
  publicKey: CryptoKey,
) {
  const encrypted = await window.crypto.subtle.encrypt(
    { name: "RSA-OAEP" },
    publicKey,
    sessionKeyBytes,
  );
  return bufferToBase64(encrypted);
}

export async function decryptMessage(
  ciphertext: string,
  encryptedSessionKey: string,
  iv: string,
  privateKey: CryptoKey,
  userId: string,
) {
  try {
    // 1. Parse the JSON-packed session keys and extract our key
    let myEncryptedKey: string;
    try {
      // Decode Base64 to string
      const decodedJson = atob(encryptedSessionKey);
      const keysJson = JSON.parse(decodedJson) as Record<string, string>;
      const extractedKey = keysJson[userId];

      if (!extractedKey) {
        console.warn(`No encrypted key found for user ${userId}`);
        return "Could not decrypt message (no key for user)";
      }
      myEncryptedKey = extractedKey;
    } catch {
      // Fallback: treat as raw key for backwards compatibility or single-key testing
      console.warn("Failed to parse session key JSON, treating as raw key");
      myEncryptedKey = encryptedSessionKey;
    }

    // 2. Decrypt the AES session key using our Private Key
    const sessionKeyBuffer = base64ToBuffer(myEncryptedKey);
    const decryptedSessionKeyRaw = await window.crypto.subtle.decrypt(
      { name: "RSA-OAEP" },
      privateKey,
      sessionKeyBuffer,
    );

    // 3. Import the AES key
    const sessionKey = await window.crypto.subtle.importKey(
      "raw",
      decryptedSessionKeyRaw,
      { name: "AES-GCM" },
      true,
      ["decrypt"],
    );

    // 4. Decrypt the message content
    const ciphertextBuffer = base64ToBuffer(ciphertext);
    const ivBuffer = base64ToBuffer(iv);

    const decryptedContentBuffer = await window.crypto.subtle.decrypt(
      { name: "AES-GCM", iv: ivBuffer },
      sessionKey,
      ciphertextBuffer,
    );

    return new TextDecoder().decode(decryptedContentBuffer);
  } catch (error) {
    console.error("Decryption failed:", error);
    return "Could not decrypt message";
  }
}

function bufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  return window.btoa(String.fromCharCode(...bytes));
}

function base64ToBuffer(base64: string): ArrayBuffer {
  const binaryString = window.atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}
