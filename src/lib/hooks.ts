import {
  decryptMessageWithStoredKeys,
  EncryptedSessionKeyNotFoundError,
  StoredKeyPairNotFoundError,
} from "~/lib/crypto";
import { reportSafeError } from "~/lib/safe-error-reporting";
import React, { useEffect, useState } from "react";

const MAX_DECRYPTED_MESSAGE_CACHE_SIZE = 500;
const decryptedMessageCache = new Map<string, string>();
let activeCacheUserId: string | null = null;

export const clearDecryptedMessageCache = () => {
  decryptedMessageCache.clear();
  activeCacheUserId = null;
};

const getCacheKey = (
  userId: string | undefined,
  ciphertext: string | undefined,
): string | undefined => {
  if (!userId || !ciphertext) {
    return undefined;
  }

  return `${userId}:${ciphertext}`;
};

const ensureCacheUserContext = (userId: string | undefined): void => {
  if (!userId) {
    return;
  }

  if (!activeCacheUserId) {
    activeCacheUserId = userId;
    return;
  }

  if (activeCacheUserId !== userId) {
    clearDecryptedMessageCache();
    activeCacheUserId = userId;
  }
};

const getCachedDecryptedMessage = (
  userId: string | undefined,
  ciphertext: string | undefined,
): string | null => {
  const cacheKey = getCacheKey(userId, ciphertext);
  if (!cacheKey) {
    return null;
  }

  ensureCacheUserContext(userId);

  return decryptedMessageCache.get(cacheKey) ?? null;
};

export function cacheDecryptedMessage(
  userId: string | undefined,
  ciphertext: string,
  plaintext: string,
) {
  const cacheKey = getCacheKey(userId, ciphertext);

  if (!cacheKey || !plaintext) {
    return;
  }

  ensureCacheUserContext(userId);

  if (decryptedMessageCache.has(cacheKey)) {
    decryptedMessageCache.delete(cacheKey);
  }

  decryptedMessageCache.set(cacheKey, plaintext);

  if (decryptedMessageCache.size > MAX_DECRYPTED_MESSAGE_CACHE_SIZE) {
    const oldestCacheKey = decryptedMessageCache.keys().next().value;
    if (oldestCacheKey) {
      decryptedMessageCache.delete(oldestCacheKey);
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
  const cacheKey = getCacheKey(userId, ciphertext);

  useEffect(() => {
    if (!userId) {
      if (activeCacheUserId) {
        clearDecryptedMessageCache();
      }
      return;
    }

    ensureCacheUserContext(userId);
  }, [userId]);

  const [decryptedState, setDecryptedState] = useState<{
    cacheKey: string | undefined;
    content: string | null;
  }>(() => ({
    cacheKey,
    content: getCachedDecryptedMessage(userId, ciphertext),
  }));

  useEffect(() => {
    let cancelled = false;

    async function decrypt() {
      const currentCacheKey = getCacheKey(userId, ciphertext);
      const cachedContent = getCachedDecryptedMessage(userId, ciphertext);

      // Prefer cached plaintext so encrypted messages don't flash "Decrypting..."
      // when server data replaces optimistic UI.
      if (!cancelled) {
        setDecryptedState((previousState) => {
          if (
            previousState.cacheKey === currentCacheKey &&
            previousState.content === cachedContent
          ) {
            return previousState;
          }

          return {
            cacheKey: currentCacheKey,
            content: cachedContent,
          };
        });
      }

      if (cachedContent !== null) {
        return;
      }

      // Check if decryption should be attempted
      if (!enabled || !ciphertext || !encryptedSessionKey || !iv || !userId) {
        return;
      }

      try {
        const decrypted = await decryptMessageWithStoredKeys(
          ciphertext,
          encryptedSessionKey,
          iv,
          userId,
        );
        if (cancelled) {
          return;
        }

        if (!cancelled) {
          cacheDecryptedMessage(userId, ciphertext, decrypted);
          setDecryptedState((previousState) => {
            if (previousState.cacheKey !== currentCacheKey) {
              return previousState;
            }

            return {
              cacheKey: currentCacheKey,
              content: decrypted,
            };
          });
        }
      } catch (e) {
        if (e instanceof StoredKeyPairNotFoundError) {
          if (cancelled) {
            return;
          }

          setDecryptedState((previousState) => {
            if (previousState.cacheKey !== currentCacheKey) {
              return previousState;
            }

            return {
              cacheKey: currentCacheKey,
              content: "🔒 Encrypted message (key not found)",
            };
          });
          return;
        }

        if (!(e instanceof EncryptedSessionKeyNotFoundError)) {
          reportSafeError("Decryption failed", e);
        }
        if (!cancelled) {
          const decryptionFallbackMessage =
            e instanceof EncryptedSessionKeyNotFoundError
              ? "🔒 Encrypted message (not encrypted for this device)"
              : "🔒 Decryption failed";

          setDecryptedState((previousState) => {
            if (previousState.cacheKey !== currentCacheKey) {
              return previousState;
            }

            return {
              cacheKey: currentCacheKey,
              content: decryptionFallbackMessage,
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

  if (decryptedState.cacheKey !== cacheKey) {
    return getCachedDecryptedMessage(userId, ciphertext);
  }

  return decryptedState.content;
}
