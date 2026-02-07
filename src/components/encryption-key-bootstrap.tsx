"use client";

import * as Sentry from "@sentry/nextjs";
import { api } from "#convex/_generated/api";
import { useQueryWithStatus } from "~/app/convex-client-provider";
import {
  exportPublicKey,
  generateKeyPair,
  getLegacyStoredKeyPair,
  getStoredKeyPair,
  migrateLegacyKeyPairToUser,
} from "~/lib/crypto";
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

      isInitializingKeyPair.current = true;
      try {
        let keyPair = await getStoredKeyPair(currentUserId);
        if (cancelled) return;

        if (!keyPair) {
          const legacyKeyPair = await getLegacyStoredKeyPair();
          if (cancelled) return;

          if (legacyKeyPair && userInfo.data.publicKey) {
            const legacyPublicKey = await exportPublicKey(
              legacyKeyPair.publicKey,
            );
            if (cancelled) return;

            if (legacyPublicKey === userInfo.data.publicKey) {
              await migrateLegacyKeyPairToUser(currentUserId, legacyKeyPair);
              if (cancelled) return;
              keyPair = await getStoredKeyPair(currentUserId);
              if (cancelled) return;
            }
          }
        }

        keyPair ??= await generateKeyPair(currentUserId);
        if (cancelled) return;

        const exportedPublicKey = await exportPublicKey(keyPair.publicKey);
        if (cancelled) return;

        const serverPublicKey = userInfo.data.publicKey;
        if (!serverPublicKey || serverPublicKey !== exportedPublicKey) {
          await updatePublicKey({ publicKey: exportedPublicKey });
        }
      } catch (error) {
        Sentry.captureException(error);
        if (!cancelled) {
          console.error("Failed to initialize encryption keys:", error);
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
