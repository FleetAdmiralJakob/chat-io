import React, { useEffect, useState } from "react";
import { decryptMessage, getStoredKeyPair } from "./crypto";

const MAX_DECRYPTED_MESSAGE_CACHE_SIZE = 500;
const decryptedMessageCache = new Map<string, string>();

const getCachedDecryptedMessage = (
  ciphertext: string | undefined,
): string | null => {
  if (!ciphertext) {
    return null;
  }

  return decryptedMessageCache.get(ciphertext) ?? null;
};

export function cacheDecryptedMessage(ciphertext: string, plaintext: string) {
  if (!ciphertext || !plaintext) {
    return;
  }

  if (decryptedMessageCache.has(ciphertext)) {
    decryptedMessageCache.delete(ciphertext);
  }

  decryptedMessageCache.set(ciphertext, plaintext);

  if (decryptedMessageCache.size > MAX_DECRYPTED_MESSAGE_CACHE_SIZE) {
    const oldestCiphertext = decryptedMessageCache.keys().next().value;
    if (oldestCiphertext) {
      decryptedMessageCache.delete(oldestCiphertext);
    }
  }
}

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
  const [decryptedState, setDecryptedState] = useState<{
    ciphertext: string | undefined;
    content: string | null;
  }>(() => ({
    ciphertext,
    content: getCachedDecryptedMessage(ciphertext),
  }));

  useEffect(() => {
    let cancelled = false;

    async function decrypt() {
      const cachedContent = getCachedDecryptedMessage(ciphertext);

      // Prefer cached plaintext so encrypted messages don't flash "Decrypting..."
      // when server data replaces optimistic UI.
      setDecryptedState((previousState) => {
        if (
          previousState.ciphertext === ciphertext &&
          previousState.content === cachedContent
        ) {
          return previousState;
        }

        return {
          ciphertext,
          content: cachedContent,
        };
      });

      if (cachedContent !== null) {
        return;
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
          if (!cancelled) {
            cacheDecryptedMessage(ciphertext, decrypted);
            setDecryptedState((previousState) => {
              if (previousState.ciphertext !== ciphertext) {
                return previousState;
              }

              return {
                ciphertext,
                content: decrypted,
              };
            });
          }
        } else {
          // If no local key, we can't decrypt.
          // This happens if the user logged in on a new device.
          if (!cancelled) {
            setDecryptedState((previousState) => {
              if (previousState.ciphertext !== ciphertext) {
                return previousState;
              }

              return {
                ciphertext,
                content: "🔒 Encrypted message (key not found)",
              };
            });
          }
        }
      } catch (e) {
        console.error("Decryption failed", e);
        if (!cancelled) {
          setDecryptedState((previousState) => {
            if (previousState.ciphertext !== ciphertext) {
              return previousState;
            }

            return {
              ciphertext,
              content: "🔒 Decryption failed",
            };
          });
        }
      }
    }

    void decrypt();

    return () => {
      cancelled = true;
    };
  }, [ciphertext, encryptedSessionKey, iv, userId, enabled]);

  if (decryptedState.ciphertext !== ciphertext) {
    return getCachedDecryptedMessage(ciphertext);
  }

  return decryptedState.content;
}
