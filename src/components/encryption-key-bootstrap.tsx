"use client";

import * as Sentry from "@sentry/nextjs";
import { api } from "#convex/_generated/api";
import { useQueryWithStatus } from "~/app/convex-client-provider";
import {
  exportPublicKey,
  generateKeyPair,
  getStoredKeyPair,
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

      isInitializingKeyPair.current = true;
      try {
        let keyPair = await getStoredKeyPair();
        if (cancelled) return;

        keyPair ??= await generateKeyPair();
        if (cancelled) return;

        if (!userInfo.data.publicKey) {
          const exported = await exportPublicKey(keyPair.publicKey);
          if (cancelled) return;
          await updatePublicKey({ publicKey: exported });
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
