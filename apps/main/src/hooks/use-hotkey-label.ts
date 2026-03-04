import { useAtomValue } from "jotai";
import { hotkeysAtom } from "@/atoms/hotkeys";
import { formatHotkeyKey } from "@/utils/format-hotkey-key";
import type { HotkeyMapping } from "@/types";

/**
 * Returns a human-readable label for a hotkey action, reflecting
 * the current live configuration (user overrides + defaults).
 *
 * Example: useHotkeyLabel("toggleSidebar") → "Ctrl+G"
 */
export function useHotkeyLabel(action: keyof HotkeyMapping): string {
	const hotkeys = useAtomValue(hotkeysAtom);
	const config = hotkeys[action];
	if (!config?.key) return "";
	return formatHotkeyKey(config.key);
}
