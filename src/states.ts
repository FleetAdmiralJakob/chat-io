import { observable } from "@legendapp/state";
import {
  configureObservableSync,
  synced,
  syncObservable,
} from "@legendapp/state/sync";
import { ObservablePersistLocalStorage } from "@legendapp/state/persist-plugins/local-storage";

configureObservableSync({
  persist: {
    plugin: ObservablePersistLocalStorage,
  },
});

export const devMode$ = observable<boolean>(false);

syncObservable(devMode$, {
  persist: {
    name: "devMode",
  },
});

export const registration$ = observable<ServiceWorkerRegistration | null>(null);

export const subscription$ = observable<PushSubscription | null>(null);

export const isFirstVisit = observable<boolean>(
  synced({
    initial: true,
    persist: {
      name: "isFirstVisit",
    },
  }),
);
