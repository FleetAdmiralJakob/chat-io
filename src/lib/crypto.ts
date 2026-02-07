import { db, type KeyPair } from "./db";
import { reportSafeError } from "./safe-error-reporting";

const LEGACY_KEY_PAIR_ID = "primary";
const USER_KEY_PAIR_PREFIX = "primary:";
const MIN_KEY_DISTRIBUTION_MAP_LENGTH = 8;

const getUserScopedKeyPairId = (userId: string) => {
  return `${USER_KEY_PAIR_PREFIX}${userId}`;
};

export class EncryptedSessionKeyNotFoundError extends Error {
  constructor(userId: string) {
    super(`Missing encrypted session key for user ${userId}`);
    this.name = "EncryptedSessionKeyNotFoundError";
  }
}

export class StoredKeyPairNotFoundError extends Error {
  constructor(userId: string) {
    super(`No stored key pair found for user ${userId}`);
    this.name = "StoredKeyPairNotFoundError";
  }
}

export async function generateKeyPair(userId: string): Promise<KeyPair> {
  /**
   * NOTE: RSA-OAEP is not post-quantum resistant. This is a known limitation
   * until the Web Crypto API supports modern PQ algorithms (e.g. ML-KEM).
   */
  const keyPair = await window.crypto.subtle.generateKey(
    {
      name: "RSA-OAEP",
      modulusLength: 4096,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: "SHA-256",
    },
    false,
    ["encrypt", "decrypt"],
  );

  const storedKey: KeyPair = {
    id: getUserScopedKeyPairId(userId),
    privateKey: keyPair.privateKey,
    publicKey: keyPair.publicKey,
    createdAt: Date.now(),
  };

  await db.keys.put(storedKey);

  return storedKey;
}

export async function getStoredKeyPair(userId: string) {
  return await db.keys.get(getUserScopedKeyPairId(userId));
}

export async function getStoredKeyPairsForDecryption(
  userId: string,
): Promise<Array<KeyPair>> {
  const [userScopedKeyPair, legacyKeyPair] = await Promise.all([
    getStoredKeyPair(userId),
    getLegacyStoredKeyPair(),
  ]);

  if (
    userScopedKeyPair &&
    legacyKeyPair &&
    userScopedKeyPair.id !== legacyKeyPair.id
  ) {
    return [userScopedKeyPair, legacyKeyPair];
  }

  if (userScopedKeyPair) {
    return [userScopedKeyPair];
  }

  if (legacyKeyPair) {
    return [legacyKeyPair];
  }

  return [];
}

export async function getLegacyStoredKeyPair() {
  return await db.keys.get(LEGACY_KEY_PAIR_ID);
}

export async function migrateLegacyKeyPairToUser(
  userId: string,
  keyPair: KeyPair,
) {
  await db.keys.put({
    ...keyPair,
    id: getUserScopedKeyPairId(userId),
  });
  await db.keys.delete(LEGACY_KEY_PAIR_ID);
}

export async function exportPublicKey(key: CryptoKey): Promise<string> {
  const exported = await window.crypto.subtle.exportKey("spki", key);
  return bufferToBase64(exported);
}

export async function importPublicKey(spkiBase64: string): Promise<CryptoKey> {
  const binaryDerString = window.atob(spkiBase64);
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
    const myEncryptedKey = extractEncryptedSessionKeyForUser(
      encryptedSessionKey,
      userId,
    );

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
    if (error instanceof EncryptedSessionKeyNotFoundError) {
      throw error;
    }

    reportSafeError("Decryption failed", error);
    throw new Error("Could not decrypt message");
  }
}

export async function decryptMessageWithStoredKeys(
  ciphertext: string,
  encryptedSessionKey: string,
  iv: string,
  userId: string,
): Promise<string> {
  const candidateKeyPairs = await getStoredKeyPairsForDecryption(userId);

  if (candidateKeyPairs.length === 0) {
    throw new StoredKeyPairNotFoundError(userId);
  }

  let lastDecryptionError: unknown = null;

  for (const keyPair of candidateKeyPairs) {
    try {
      return await decryptMessage(
        ciphertext,
        encryptedSessionKey,
        iv,
        keyPair.privateKey,
        userId,
      );
    } catch (error) {
      if (error instanceof EncryptedSessionKeyNotFoundError) {
        throw error;
      }

      lastDecryptionError = error;
    }
  }

  if (lastDecryptionError instanceof Error) {
    throw lastDecryptionError;
  }

  throw new Error("Could not decrypt message");
}

function extractEncryptedSessionKeyForUser(
  encryptedSessionKey: string,
  userId: string,
): string {
  const packedSessionKeys = decodePackedSessionKeys(encryptedSessionKey);

  if (!packedSessionKeys) {
    return encryptedSessionKey;
  }

  const userEncryptedKey = packedSessionKeys[userId];
  if (!userEncryptedKey) {
    throw new EncryptedSessionKeyNotFoundError(userId);
  }

  return userEncryptedKey;
}

function decodePackedSessionKeys(
  encryptedSessionKey: string,
): Record<string, string> | null {
  if (encryptedSessionKey.length < MIN_KEY_DISTRIBUTION_MAP_LENGTH) {
    return null;
  }

  try {
    const decodedJson = window.atob(encryptedSessionKey);
    const parsed = JSON.parse(decodedJson);

    if (!parsed || typeof parsed !== "object") {
      return null;
    }

    const keysMap = Object.entries(parsed as Record<string, unknown>);
    if (keysMap.length === 0) {
      return null;
    }

    const sessionKeysByUserId: Record<string, string> = {};
    for (const [recipientUserId, wrappedSessionKey] of keysMap) {
      if (typeof wrappedSessionKey !== "string") {
        return null;
      }
      sessionKeysByUserId[recipientUserId] = wrappedSessionKey;
    }

    return sessionKeysByUserId;
  } catch {
    // Backward compatibility: previous messages may store a single wrapped key string.
    return null;
  }
}

function bufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return window.btoa(binary);
}

function base64ToBuffer(base64: string): ArrayBuffer {
  const chunkSize = 8192; // Must be a multiple of 4 for base64 chunks
  const chunks: Array<Uint8Array> = [];
  let totalLength = 0;

  for (let i = 0; i < base64.length; i += chunkSize) {
    const chunk = base64.slice(i, i + chunkSize);
    const binaryString = window.atob(chunk);
    const bytes = new Uint8Array(binaryString.length);
    let offset = 0;
    for (const char of binaryString) {
      bytes[offset] = char.charCodeAt(0);
      offset += 1;
    }
    chunks.push(bytes);
    totalLength += bytes.length;
  }

  const result = new Uint8Array(totalLength);
  let position = 0;
  for (const bytes of chunks) {
    result.set(bytes, position);
    position += bytes.length;
  }

  return result.buffer;
}
