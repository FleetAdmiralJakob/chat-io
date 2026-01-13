import { db } from "./db";

export const KEY_PAIR_ID = "primary";

export async function generateKeyPair(): Promise<{
  publicKey: CryptoKey;
  privateKey: CryptoKey;
}> {
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

  await db.keys.put({
    id: KEY_PAIR_ID,
    privateKey: keyPair.privateKey,
    publicKey: keyPair.publicKey,
    createdAt: Date.now(),
  });

  return keyPair;
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

export async function encryptMessage(
  text: string,
  recipientPublicKey: CryptoKey,
  senderPublicKey: CryptoKey,
) {
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

  // 4. Encrypt the AES key with the Recipient's Public Key
  const encryptedSessionKeyBuffer = await window.crypto.subtle.encrypt(
    { name: "RSA-OAEP" },
    recipientPublicKey,
    exportedSessionKey,
  );

  // 5. Encrypt the AES key with the Sender's Public Key (so they can read it too)
  // NOTE: For now, we will store a simplified structure where we might need to store multiple encrypted keys
  // or just encrypt it once if we are sending to self.
  // Real implementation for 1:1 chat usually duplicates the encrypted key payload for each participant.
  // To keep our schema simple for this MVP, we will rely on the "encryptedSessionKey" field being
  // the one for the RECIPIENT.
  //
  // WAIT: If we only store ONE encryptedSessionKey, the sender cannot read their own message history
  // on a different device or even this device if they don't cache the plaintext.
  //
  // BETTER APPROACH for MVP:
  // Since we have a single `encryptedSessionKey` field in the DB schema for now,
  // we will encrypt the content for the RECIPIENT.
  // The sender will see "Encrypted Message" in history unless we store a second key?
  //
  // FIX: The standard way is to have a map of `userId -> encryptedKey`.
  // But our schema has `encryptedSessionKey: v.optional(v.string())`.
  //
  // Let's pack JSON into that string:
  // {
  //   [recipientId]: "...",
  //   [senderId]: "..."
  // }
  //
  // For this specific helper function, let's just return the raw buffers/arrays
  // and let the caller construct the final payload.

  return {
    ciphertext: bufferToBase64(ciphertextBuffer),
    iv: bufferToBase64(iv),
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
) {
  try {
    // 1. Decrypt the AES session key using our Private Key
    const sessionKeyBuffer = base64ToBuffer(encryptedSessionKey);
    const decryptedSessionKeyRaw = await window.crypto.subtle.decrypt(
      { name: "RSA-OAEP" },
      privateKey,
      sessionKeyBuffer,
    );

    // 2. Import the AES key
    const sessionKey = await window.crypto.subtle.importKey(
      "raw",
      decryptedSessionKeyRaw,
      { name: "AES-GCM" },
      true,
      ["decrypt"],
    );

    // 3. Decrypt the message content
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

function bufferToBase64(buffer: ArrayBuffer): string {
  return window.btoa(String.fromCharCode(...new Uint8Array(buffer)));
}

function base64ToBuffer(base64: string): ArrayBuffer {
  const binaryString = window.atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}
