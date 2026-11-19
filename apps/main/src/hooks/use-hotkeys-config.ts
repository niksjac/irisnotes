import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { useCallback, useEffect, useState } from "react";
import { useSetAtom } from "jotai";
import { DEFAULT_HOTKEYS } from "@/config/default-hotkeys";
import { mergeEditorKeybindings } from "@/config/default-editor-keybindings";
import type { EditorKeybindingOverrides } from "@/config/default-editor-keybindings";
import { editorKeybindingsAtom } from "@/atoms/editor-keybindings";
import { hotkeysAtom } from "@/atoms/hotkeys";
import { updateAppHotkeyPatterns } from "@/utils/app-hotkeys";
import type { HotkeyConfig, HotkeyMapping } from "@/types";

/**
 * Hook for loading hotkeys from hotkeys.toml config file
 */
export function useHotkeysConfig() {
	const [hotkeys, setHotkeys] = useState<HotkeyMapping>(() => {
		// Initialize with defaults and update CodeMirror patterns
		updateAppHotkeyPatterns(DEFAULT_HOTKEYS);
		return DEFAULT_HOTKEYS;
	});
	const [loading, setLoading] = useState(true);
	const setEditorKeybindings = useSetAtom(editorKeybindingsAtom);
	const setHotkeysAtom = useSetAtom(hotkeysAtom);

	const loadHotkeys = useCallback(async () => {
		try {
			// Backend handles .toml/.json extension - just pass base name
			const hotkeyString = await invoke<string>("read_config", {
				filename: "hotkeys",
			});
			const parsed = JSON.parse(hotkeyString);

			// Extract [editor] section for ProseMirror keybinding overrides
			const editorOverrides = (parsed.editor || {}) as EditorKeybindingOverrides;
			delete parsed.editor;

			// Apply editor keybinding overrides
			if (Object.keys(editorOverrides).length > 0) {
				setEditorKeybindings(mergeEditorKeybindings(editorOverrides));
			}

			// Ignore overrides for actions that no longer exist (e.g. removed hotkeys).
			// An override may set only `key`; the rest comes from the default.
			const parsedHotkeys = Object.fromEntries(
				Object.entries(parsed)
					.filter(([action]) => action in DEFAULT_HOTKEYS)
					.map(([action, override]) => [
						action,
						{ ...DEFAULT_HOTKEYS[action as keyof HotkeyMapping], ...(override as Partial<HotkeyConfig>) },
					]),
			) as Partial<HotkeyMapping>;

			// Merge user hotkeys with defaults
			const mergedHotkeys: HotkeyMapping = {
				...DEFAULT_HOTKEYS,
				...parsedHotkeys,
				showQuickHotkeys: parsedHotkeys.showQuickHotkeys?.key?.toLowerCase() === "f1"
					? DEFAULT_HOTKEYS.showQuickHotkeys
					: parsedHotkeys.showQuickHotkeys ?? DEFAULT_HOTKEYS.showQuickHotkeys,
			};

			// Update CodeMirror app hotkey patterns
			updateAppHotkeyPatterns(mergedHotkeys);
			setHotkeys(mergedHotkeys);
			setHotkeysAtom(mergedHotkeys);
		} catch {
			// Failed to load hotkeys.toml - use defaults
			updateAppHotkeyPatterns(DEFAULT_HOTKEYS);
			setHotkeys(DEFAULT_HOTKEYS);
			setHotkeysAtom(DEFAULT_HOTKEYS);
		} finally {
			setLoading(false);
		}
	}, []);

	/**
	 * Set the key for one app action and rewrite hotkeys.toml (comments are not
	 * kept). `null` or the default key removes the override. The [editor] section
	 * is kept; overrides for actions that no longer exist are dropped.
	 */
	const setHotkeyKey = useCallback(
		async (action: keyof HotkeyMapping, key: string | null) => {
			let file: Record<string, unknown> = {};
			try {
				file = JSON.parse(await invoke<string>("read_config", { filename: "hotkeys" }));
			} catch (error) {
				// A missing file starts empty; never overwrite one that failed to parse
				if (!String(error).includes("does not exist")) throw error;
			}

			const next: Record<string, unknown> = {};
			for (const [id, value] of Object.entries(file)) {
				if (id === "editor" || (id in DEFAULT_HOTKEYS && id !== action)) next[id] = value;
			}
			if (key && key !== DEFAULT_HOTKEYS[action].key) next[action] = { key };

			// Backend converts JSON to TOML and saves as hotkeys.toml
			await invoke("write_config", {
				filename: "hotkeys",
				content: JSON.stringify(next, null, 2),
			});
			// The file watcher reloads every other user; reload this one right away
			await loadHotkeys();
		},
		[loadHotkeys]
	);

	useEffect(() => {
		loadHotkeys();

		// Set up file watcher for hotkeys.toml
		const setupWatcher = async () => {
			try {
				// Listen for hotkey file changes
				const unlisten = await listen("config-file-changed", (event) => {
					// Check if the changed file is hotkeys.toml (or hotkeys.json for backwards compat)
					const payload = event.payload as any;
					if (
						payload?.filename === "hotkeys.toml" ||
						payload?.filename === "hotkeys.json" ||
						!payload?.filename
					) {
						loadHotkeys();
					}
				});

				return unlisten;
			} catch (error) {
				console.error("Failed to setup hotkeys file watcher:", error);
				return null;
			}
		};

		let unlisten: (() => void) | null = null;
		setupWatcher().then((unlistenFn) => {
			unlisten = unlistenFn;
		});

		return () => {
			if (unlisten) {
				unlisten();
			}
		};
	}, [loadHotkeys]);

	return {
		hotkeys,
		loading,
		loadHotkeys,
		setHotkeyKey,
	};
}
