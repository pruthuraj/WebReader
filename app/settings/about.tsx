import { Text, View } from "react-native";
import { DetailScreen } from "@/components/ui/DetailScreen";
import { SettingsGroup, SettingLinkRow } from "@/components/ui/settings";
import { Chip } from "@/components/ui/controls";
import { readerFontFamily } from "@/theme/readerFonts";

export default function AboutSettingsScreen() {
  return (
    <DetailScreen title="About">
      <View className="items-center px-4 pt-6">
        <View
          className="h-[72px] w-[72px] items-center justify-center rounded-[18px]"
          style={{ backgroundColor: "#8B95FF" }}
        >
          <Text
            style={{ fontFamily: readerFontFamily("lora", "bold"), fontSize: 30, color: "#0B1220" }}
          >
            NR
          </Text>
        </View>
        <Text className="mt-2.5 text-[22px] font-bold text-app-text">NovelReader</Text>
        <Text className="mt-1 text-[13px] text-app-text-muted">Version 1.0.0 · Build 2026.05.27</Text>
      </View>

      <SettingsGroup>
        <View className="px-3.5 py-3.5">
          <Text className="text-[13.5px] leading-5 text-app-text-dim">
            NovelReader is an offline-first reading and listening app for web novels. Search,
            read, download for offline use, and listen with your device&apos;s text-to-speech engine.
          </Text>
        </View>
      </SettingsGroup>

      <SettingsGroup title="Privacy" footnote="On-device by default. The dashboard never phones home.">
        <View className="px-3.5 py-3.5">
          <Text className="text-[13.5px] leading-5 text-app-text-dim">
            No account is required. Your reading progress, settings, downloads, and local activity
            are stored on this device.
          </Text>
          <View className="mt-3 flex-row flex-wrap">
            <Chip>Local-first</Chip>
            <Chip>No account</Chip>
            <Chip>Offline TTS</Chip>
          </View>
        </View>
      </SettingsGroup>

      <SettingsGroup title="More">
        <SettingLinkRow label="Open-source Licenses" accent chevron />
        <SettingLinkRow label="Privacy Policy" accent chevron />
        <SettingLinkRow label="Contact Support" accent chevron />
      </SettingsGroup>

      <Text className="px-5 pt-6 text-center text-[11px] leading-5 text-app-text-muted">
        Made with care for slow, focused reading.{"\n"}© 2026 NovelReader
      </Text>
    </DetailScreen>
  );
}
