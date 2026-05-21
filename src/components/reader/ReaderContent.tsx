import { Text } from "react-native";
import { readerPalettes } from "@/theme/readerThemes";
import type { ReaderAppearance } from "@/stores/readerStore";

function fontFamily(fontStyle: ReaderAppearance["fontStyle"]) {
  switch (fontStyle) {
    case "mono":
      return "Courier New";
    case "serif":
      return "Georgia";
    case "sans":
    case "system":
    default:
      return undefined;
  }
}

interface ReaderContentProps {
  text: string;
  appearance: ReaderAppearance;
}

export function ReaderContent({ text, appearance }: ReaderContentProps) {
  const palette = readerPalettes[appearance.theme];

  return (
    <Text
      selectable
      style={{
        color: palette.fg,
        fontSize: appearance.fontSize,
        lineHeight: appearance.fontSize * appearance.lineHeight,
        fontFamily: fontFamily(appearance.fontStyle),
        textAlign: appearance.alignment,
      }}
    >
      {text}
    </Text>
  );
}
