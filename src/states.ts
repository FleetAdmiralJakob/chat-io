import { observable } from "@legendapp/state";
import { ObservablePersistLocalStorage } from "@legendapp/state/persist-plugins/local-storage";
import { configureObservableSync, syncObservable } from "@legendapp/state/sync";

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

// Create a persistent state for notification settings
export const notificationSettings$ = observable({
  isEnabled: false,
  hasPrompted: false,
  subscription: null as PushSubscription | null,
});

syncObservable(notificationSettings$, {
  persist: {
    name: "notificationSettings",
  },
});
