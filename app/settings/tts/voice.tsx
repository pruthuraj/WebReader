import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import type { Voice } from "expo-speech";
import { DetailScreen } from "@/components/ui/DetailScreen";
import { SettingsGroup, SelectRow } from "@/components/ui/settings";
import { tts } from "@/services/tts";
import { useSettingsStore } from "@/stores/settingsStore";
import { useTtsStore } from "@/stores/ttsStore";

const LANGUAGE_OPTIONS = ["en-US", "en-GB", "en-AU", "hi-IN"];

export default function TtsVoiceScreen() {
  const settings = useSettingsStore((s) => s.settings);
  const updateSettings = useSettingsStore((s) => s.update);
  const language = useTtsStore((s) => s.language);
  const voiceId = useTtsStore((s) => s.voiceId);
  const setLanguage = useTtsStore((s) => s.setLanguage);
  const setVoice = useTtsStore((s) => s.setVoice);
  const [voices, setVoices] = useState<Voice[]>([]);

  useEffect(() => {
    void tts.getVoices().then(setVoices);
  }, []);

  const filtered = voices
    .filter((v) => v.language?.toLowerCase().startsWith(language.toLowerCase().slice(0, 2)))
    .slice(0, 12);

  const VoiceRow = ({ voice, selected }: { voice: Voice | null; selected: boolean }) => {
    const name = voice ? voice.name : "System default";
    const enhanced = (voice?.quality ?? "").toLowerCase().includes("enhanced");
    return (
      <View className="min-h-[44px] flex-row items-center justify-between px-3.5 py-3">
        <View className="flex-1 pr-3">
          <Text className="text-sm text-app-text">{name}</Text>
          <View className="mt-1 flex-row items-center" style={{ gap: 8 }}>
            {voice ? (
              <Text className="text-[11px] text-app-text-muted" style={{ fontFamily: "monospace" }}>
                {voice.language}
              </Text>
            ) : null}
            {enhanced ? (
              <Text className="text-[10px] font-bold tracking-wide text-app-warn">HQ</Text>
            ) : voice ? (
              <Text className="text-[10px] font-bold tracking-wide text-app-success">OFFLINE</Text>
            ) : null}
          </View>
        </View>
        <Pressable
          onPress={() => setVoice(voice ? voice.identifier : null)}
          className={`rounded-lg px-3 py-1.5 active:opacity-75 ${selected ? "bg-app-accent" : "bg-app-surface-2"}`}
        >
          <Text className={`text-xs font-semibold ${selected ? "text-app-on-accent" : "text-app-text"}`}>
            {selected ? "Selected" : "Use"}
          </Text>
        </Pressable>
      </View>
    );
  };

  return (
    <DetailScreen title="Voice">
      <SettingsGroup
        title="Current"
        footnote="Higher-quality voices may require Wi-Fi the first time. Offline reading falls back to a local voice."
      >
        <SelectRow
          label="Language"
          value={language}
          options={LANGUAGE_OPTIONS}
          onChange={(l) => {
            setLanguage(l);
            void updateSettings({ ttsDefaults: { ...settings.ttsDefaults, language: l } });
          }}
        />
      </SettingsGroup>

      <SettingsGroup title="Available Voices">
        <VoiceRow voice={null} selected={!voiceId} />
        {filtered.map((v) => (
          <VoiceRow key={v.identifier} voice={v} selected={voiceId === v.identifier} />
        ))}
      </SettingsGroup>
    </DetailScreen>
  );
}
