import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { Serwist } from "serwist";
import { z } from "zod";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    // Change this attribute's name to your `injectionPoint`.
    // `injectionPoint` is an InjectManifest option.
    // See https://serwist.pages.dev/docs/build/configuring
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: defaultCache,
});

const messageSchema = z.object({
  title: z.string(),
  message: z.string(),
  chatId: z.string(),
});

self.addEventListener("push", (event) => {
  const message = JSON.parse(event.data?.text() ?? "");

  const parsedMessage = messageSchema.parse(message);

  event.waitUntil(
    self.registration.showNotification(parsedMessage.title, {
      body: parsedMessage.message,
      icon: "/icons/icon-512x-512-any.png",
      data: {
        chatId: parsedMessage.chatId,
      },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const chatId = event.notification.data.chatId;

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        if (clientList.length > 0) {
          let client = clientList[0]!;
          for (let i = 0; i < clientList.length; i++) {
            if (clientList && clientList[i]!.focused) {
              client = clientList[i]!;
            }
          }
          return client.focus().then(() => client.navigate(`/chats/${chatId}`));
        }
        return self.clients.openWindow(`/chats/${chatId}`);
      }),
  );
});

serwist.addEventListeners();
