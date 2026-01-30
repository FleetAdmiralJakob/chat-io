import React, { useEffect, useRef, useState } from "react";
import { decryptMessage, getStoredKeyPair } from "./crypto";

export function usePrevious<T>(value: T): T | undefined {
  const [current, setCurrent] = React.useState<T>(value);
  const [previous, setPrevious] = React.useState<T>();

  if (value !== current) {
    setPrevious(current);
    setCurrent(value);
  }

  return previous;
}

/**
 * Hook to decrypt an encrypted message.
 *
 * @param ciphertext - The encrypted message content
 * @param encryptedSessionKey - The encrypted session key (Base64-encoded JSON)
 * @param iv - The initialization vector
 * @param userId - The current user's Convex ID
 * @param enabled - Whether decryption should be attempted (default: true)
 * @returns The decrypted content, or null if not yet decrypted, or an error message
 */
export function useDecryptMessage(
  ciphertext: string | undefined,
  encryptedSessionKey: string | undefined,
  iv: string | undefined,
  userId: string | undefined,
  enabled = true,
): string | null {
  const [decryptedContent, setDecryptedContent] = useState<string | null>(null);
  const prevCiphertextRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    async function decrypt() {
      // Only reset if the actual ciphertext changed
      if (prevCiphertextRef.current !== ciphertext) {
        setDecryptedContent(null);
        prevCiphertextRef.current = ciphertext;
      }

      // Check if decryption should be attempted
      if (!enabled || !ciphertext || !encryptedSessionKey || !iv || !userId) {
        return;
      }

      try {
        const keyPair = await getStoredKeyPair();
        if (keyPair) {
          const decrypted = await decryptMessage(
            ciphertext,
            encryptedSessionKey,
            iv,
            keyPair.privateKey,
            userId,
          );
          setDecryptedContent(decrypted);
        } else {
          // If no local key, we can't decrypt.
          // This happens if the user logged in on a new device.
          setDecryptedContent("🔒 Encrypted message (key not found)");
        }
      } catch (e) {
        console.error("Decryption failed", e);
        setDecryptedContent("🔒 Decryption failed");
      }
    }
    void decrypt();
  }, [ciphertext, encryptedSessionKey, iv, userId, enabled]);

  return decryptedContent;
}
