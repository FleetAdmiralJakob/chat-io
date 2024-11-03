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
