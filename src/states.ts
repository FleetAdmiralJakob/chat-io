import { observable } from "@legendapp/state";
import { configureObservableSync, syncObservable } from "@legendapp/state/sync";
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
