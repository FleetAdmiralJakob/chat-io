"use client";

import { api } from "#convex/_generated/api";
import { useQueryWithStatus } from "~/app/convex-client-provider";
import {
  exportPublicKey,
  generateKeyPair,
  getLegacyStoredKeyPair,
  getStoredKeyPair,
  migrateLegacyKeyPairToUser,
} from "~/lib/crypto";
import { reportSafeError } from "~/lib/safe-error-reporting";
import { useMutation } from "convex/react";
import { useEffect, useRef } from "react";

export function EncryptionKeyBootstrap() {
  const userInfo = useQueryWithStatus(api.users.getUserData, {});
  const updatePublicKey = useMutation(api.users.updatePublicKey);
  const isInitializingKeyPair = useRef(false);

  useEffect(() => {
    let cancelled = false;

    async function ensureEncryptionKeys() {
      if (!userInfo.data || isInitializingKeyPair.current) return;

      const currentUserId = userInfo.data._id;
      const serverPublicKey = userInfo.data.publicKey;

      isInitializingKeyPair.current = true;
      try {
        let keyPair = await getStoredKeyPair(currentUserId);
        if (cancelled) return;

        const legacyKeyPair = await getLegacyStoredKeyPair();
        if (cancelled) return;

        if (!keyPair && legacyKeyPair) {
          await migrateLegacyKeyPairToUser(currentUserId, legacyKeyPair);
          if (cancelled) return;

          keyPair = await getStoredKeyPair(currentUserId);
          if (cancelled) return;
        }

        if (keyPair && legacyKeyPair && serverPublicKey) {
          const [storedPublicKey, legacyPublicKey] = await Promise.all([
            exportPublicKey(keyPair.publicKey),
            exportPublicKey(legacyKeyPair.publicKey),
          ]);
          if (cancelled) return;

          if (
            serverPublicKey === legacyPublicKey &&
            serverPublicKey !== storedPublicKey
          ) {
            await migrateLegacyKeyPairToUser(currentUserId, legacyKeyPair);
            if (cancelled) return;

            keyPair = await getStoredKeyPair(currentUserId);
            if (cancelled) return;
          }
        }

        keyPair ??= await generateKeyPair(currentUserId);
        if (cancelled) return;

        const exportedPublicKey = await exportPublicKey(keyPair.publicKey);
        if (cancelled) return;

        if (!serverPublicKey || serverPublicKey !== exportedPublicKey) {
          await updatePublicKey({ publicKey: exportedPublicKey });
        }
      } catch (error) {
        if (!cancelled) {
          reportSafeError("Failed to initialize encryption keys", error);
        }
      } finally {
        isInitializingKeyPair.current = false;
      }
    }

    void ensureEncryptionKeys();

    return () => {
      cancelled = true;
    };
  }, [updatePublicKey, userInfo.data]);

  return null;
}
