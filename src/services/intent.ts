import * as IntentLauncher from "expo-intent-launcher";
import { Linking, Platform } from "react-native";

export const isAndroid = Platform.OS === "android";
export const isIos = Platform.OS === "ios";

async function startActivity(action: string, data?: string, extras?: Record<string, unknown>) {
  if (!isAndroid) return false;
  try {
    await IntentLauncher.startActivityAsync(action, {
      data,
      extra: extras,
    });
    return true;
  } catch {
    return false;
  }
}

export const intent = {
  isAndroid,
  isIos,

  async openTtsSettings(): Promise<boolean> {
    return startActivity("com.android.settings.TTS_SETTINGS");
  },

  async openVoiceDataSettings(): Promise<boolean> {
    return startActivity(
      "android.speech.tts.engine.INSTALL_TTS_DATA",
      undefined,
      { "android.speech.tts.engine.EXTRA_FLAG": true }
    );
  },

  async openBatteryOptimization(): Promise<boolean> {
    return startActivity(
      "android.settings.IGNORE_BATTERY_OPTIMIZATION_SETTINGS"
    );
  },

  async openGoogleTtsListing(): Promise<boolean> {
    if (!isAndroid) return false;
    const url = "market://details?id=com.google.android.tts";
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
        return true;
      }
      await Linking.openURL(
        "https://play.google.com/store/apps/details?id=com.google.android.tts"
      );
      return true;
    } catch {
      return false;
    }
  },
};
