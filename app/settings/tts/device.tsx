import { Alert, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { DetailScreen } from "@/components/ui/DetailScreen";
import { SettingsGroup, SettingLinkRow, ToggleRow } from "@/components/ui/settings";
import { intent } from "@/services/intent";
import { useSettingsStore } from "@/stores/settingsStore";

export default function TtsDeviceScreen() {
  const settings = useSettingsStore((s) => s.settings);
  const updateSettings = useSettingsStore((s) => s.update);
  const ttsDefaults = settings.ttsDefaults;

  const runIntent = (action: () => Promise<boolean>, failure: string) => {
    if (!intent.isAndroid) {
      Alert.alert("Not available", "Available on Android only.");
      return;
    }
    void action().then((ok) => {
      if (!ok) Alert.alert("Couldn't open", failure);
    });
  };

  return (
    <DetailScreen title="Device Support">
      <SettingsGroup
        title="Background"
        footnote={
          intent.isIos
            ? "iOS needs a prebuild with UIBackgroundModes: audio to actually keep playing."
            : "Android needs a foreground-service module (not in Expo Go) to keep playing when locked."
        }
      >
        <ToggleRow
          label="Background Playback"
          sub="Keep speaking when the app is in the background."
          value={ttsDefaults.backgroundPlayback}
          onChange={(v) => void updateSettings({ ttsDefaults: { ...ttsDefaults, backgroundPlayback: v } })}
        />
      </SettingsGroup>

      <SettingsGroup title="Engine (Android)">
        <SettingLinkRow
          label="Open TTS engine settings"
          accent
          chevron
          onPress={() => runIntent(intent.openTtsSettings, "Could not open TTS engine settings.")}
        />
        <SettingLinkRow
          label="Download more voices"
          accent
          chevron
          onPress={() => runIntent(intent.openVoiceDataSettings, "Could not open voice data installer.")}
        />
        <SettingLinkRow
          label="Update Google TTS engine"
          accent
          chevron
          onPress={() => runIntent(intent.openGoogleTtsListing, "Could not open the Play Store listing.")}
        />
        <SettingLinkRow
          label="Disable Battery Optimization"
          sub="Stops the OS from killing long playback sessions."
          accent
          chevron
          onPress={() => runIntent(intent.openBatteryOptimization, "Could not open battery settings.")}
        />
      </SettingsGroup>

      <SettingsGroup title="Bluetooth">
        <View className="px-3.5 py-3">
          <View className="flex-row" style={{ gap: 10 }}>
            <Feather name="bluetooth" size={16} color="#FFB454" />
            <Text className="flex-1 text-xs leading-5 text-app-text-muted">
              Pause / resume on Bluetooth disconnect requires a native Bluetooth-state module not
              available in Expo Go. Enable after switching to a prebuild.
            </Text>
          </View>
        </View>
      </SettingsGroup>
    </DetailScreen>
  );
}
