import * as Network from "expo-network";

type Listener = (allowed: boolean) => void;

const listeners = new Set<Listener>();
let subscription: { remove: () => void } | null = null;

async function currentState() {
  return Network.getNetworkStateAsync();
}

export const network = {
  start() {
    if (subscription) return;
    subscription = Network.addNetworkStateListener(() => {
      void this.shouldAllowDownload(false).then((allowed) => {
        for (const listener of listeners) listener(allowed);
      });
    });
  },

  stop() {
    subscription?.remove();
    subscription = null;
  },

  subscribe(listener: Listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  async isOnline() {
    const state = await currentState();
    return Boolean(state.isConnected && state.isInternetReachable !== false);
  },

  async isWifi() {
    const state = await currentState();
    return state.type === Network.NetworkStateType.WIFI;
  },

  async shouldAllowDownload(wifiOnly: boolean) {
    const state = await currentState();
    const online = Boolean(state.isConnected && state.isInternetReachable !== false);
    if (!online) return false;
    if (!wifiOnly) return true;
    return state.type === Network.NetworkStateType.WIFI;
  },
};

