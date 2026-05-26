import { useEffect } from "react";
import { ScrollView, Text } from "react-native";
import { SettingsRow } from "@/components/settings/SettingsRow";
import { SettingsSection } from "@/components/settings/SettingsSection";
import { useSourceStore } from "@/stores/sourceStore";

function hostOf(url: string): string {
  const m = url.match(/^https?:\/\/([^/]+)/i);
  return m ? m[1] : url;
}

function refreshedLabel(at: number | null, refreshing: boolean): string {
  if (refreshing) return "Refreshing…";
  if (!at) return "Pulls the latest adapter configs.";
  const mins = Math.round((Date.now() - at) / 60000);
  return mins <= 0 ? "Refreshed just now." : `Refreshed ${mins} min ago.`;
}

export default function SourcesScreen() {
  const sources = useSourceStore((s) => s.sources);
  const refreshing = useSourceStore((s) => s.refreshing);
  const lastRefreshedAt = useSourceStore((s) => s.lastRefreshedAt);
  const load = useSourceStore((s) => s.load);
  const refresh = useSourceStore((s) => s.refresh);
  const setEnabled = useSourceStore((s) => s.setEnabled);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <ScrollView
      className="flex-1 bg-slate-50 dark:bg-slate-950"
      contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
    >
      <Text className="text-3xl font-black text-slate-950 dark:text-slate-50">Sources</Text>
      <Text className="mb-6 mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
        Live sources let you search and read beyond the bundled catalogue. Content
        is fetched on your device for your personal reading and cached locally —
        nothing is uploaded. Sources are off by default.
      </Text>

      <SettingsSection title="Registry">
        <SettingsRow
          type="tap"
          label="Refresh from registry"
          subtitle={refreshedLabel(lastRefreshedAt, refreshing)}
          onPress={() => void refresh()}
        />
      </SettingsSection>

      <SettingsSection
        title="Available sources"
        subtitle={
          sources.length
            ? "Enable a source to browse and read from it."
            : "No sources installed yet. Pull from the registry above."
        }
      >
        {sources.map((source) => (
          <SettingsRow
            key={source.id}
            type="switch"
            label={source.name}
            subtitle={`v${source.version} · ${hostOf(source.config.baseUrl)}`}
            value={source.enabled}
            onChange={(enabled) => void setEnabled(source.id, enabled)}
          />
        ))}
      </SettingsSection>

      <Text className="px-1 text-xs leading-5 text-slate-400 dark:text-slate-500">
        Respect each source&apos;s terms of use. Some sites prohibit automated
        access; enabling a source is your choice and responsibility. Fetching is
        rate limited and honors robots.txt.
      </Text>
    </ScrollView>
  );
}
