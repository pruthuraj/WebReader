import { ScrollView, Text, View } from "react-native";
import { Link } from "expo-router";

interface NavLinkProps {
  href: string;
  title: string;
  subtitle: string;
}

function NavTile({ href, title, subtitle }: NavLinkProps) {
  return (
    <Link href={href as never} asChild>
      <View className="mb-3 rounded-2xl border border-slate-200 bg-white p-4 active:opacity-70 dark:border-slate-700 dark:bg-slate-800">
        <Text className="text-base font-semibold text-slate-900 dark:text-slate-100">
          {title}
        </Text>
        <Text className="mt-1 text-sm text-slate-500 dark:text-slate-400">{subtitle}</Text>
      </View>
    </Link>
  );
}

export default function HomeScreen() {
  return (
    <ScrollView className="flex-1 bg-slate-50 dark:bg-slate-900" contentContainerStyle={{ padding: 16 }}>
      <Text className="mb-1 text-3xl font-bold text-slate-900 dark:text-slate-50">WebReader</Text>
      <Text className="mb-6 text-sm text-slate-500 dark:text-slate-400">
        Read, listen, and collect web novels — offline first.
      </Text>

      <NavTile href="/search" title="Search novels" subtitle="Find something new to read" />
      <NavTile href="/downloads" title="Downloads" subtitle="Manage offline chapters" />
      <NavTile href="/settings" title="Settings" subtitle="Reader, TTS, and app preferences" />
      <NavTile href="/dashboard" title="Dashboard" subtitle="Your reading activity" />

      <Text className="mt-6 text-xs uppercase tracking-wider text-slate-400">Phase A</Text>
      <Text className="text-xs text-slate-400">
        Foundation scaffolding. Search, library rows, and reader come in Phase B.
      </Text>
    </ScrollView>
  );
}
