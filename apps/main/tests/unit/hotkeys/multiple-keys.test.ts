import { describe, expect, it } from "vitest";
import { formatHotkeyKey, splitHotkeyKeys } from "@/utils/format-hotkey-key";
import { isAppHotkey, updateAppHotkeyPatterns } from "@/utils/app-hotkeys";
import { DEFAULT_HOTKEYS } from "@/config/default-hotkeys";

function keydown(code: string, mods: { ctrl?: boolean; shift?: boolean; alt?: boolean } = {}): KeyboardEvent {
	return new KeyboardEvent("keydown", { code, ctrlKey: !!mods.ctrl, shiftKey: !!mods.shift, altKey: !!mods.alt });
}

describe("several keys for one action", () => {
	it("splits on commas and trims", () => {
		expect(splitHotkeyKeys("ctrl+3, ctrl+g")).toEqual(["ctrl+3", "ctrl+g"]);
		expect(splitHotkeyKeys("ctrl+comma")).toEqual(["ctrl+comma"]);
		expect(splitHotkeyKeys("")).toEqual([]);
	});

	it("formats each key", () => {
		expect(formatHotkeyKey("ctrl+3,ctrl+g")).toBe("Ctrl+3 / Ctrl+G");
		expect(formatHotkeyKey("ctrl+shift+comma")).toBe("Ctrl+Shift+,");
	});

	it("lets editors pass every key of an action through to the app", () => {
		updateAppHotkeyPatterns({ ...DEFAULT_HOTKEYS, toggleSidebar: { ...DEFAULT_HOTKEYS.toggleSidebar, key: "ctrl+3,ctrl+g" } });
		expect(isAppHotkey(keydown("Digit3", { ctrl: true }))).toBe(true);
		expect(isAppHotkey(keydown("KeyG", { ctrl: true }))).toBe(true);
		updateAppHotkeyPatterns(DEFAULT_HOTKEYS);
	});
});
