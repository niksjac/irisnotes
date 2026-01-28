import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { useCallback, useEffect, useState } from "react";
import { DEFAULT_HOTKEYS } from "@/config/default-hotkeys";
import { updateAppHotkeyPatterns } from "@/utils/app-hotkeys";
import type { HotkeyMapping } from "@/types";

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

	const loadHotkeys = useCallback(async () => {
		try {
			// Backend handles .toml/.json extension - just pass base name
			const hotkeyString = await invoke<string>("read_config", {
				filename: "hotkeys",
			});
			const parsedHotkeys = JSON.parse(hotkeyString) as Partial<HotkeyMapping>;

			// Merge user hotkeys with defaults
			const mergedHotkeys: HotkeyMapping = {
				...DEFAULT_HOTKEYS,
				...parsedHotkeys,
			};

			// Update CodeMirror app hotkey patterns
			updateAppHotkeyPatterns(mergedHotkeys);
			setHotkeys(mergedHotkeys);
		} catch {
			// Failed to load hotkeys.toml - use defaults
			updateAppHotkeyPatterns(DEFAULT_HOTKEYS);
			setHotkeys(DEFAULT_HOTKEYS);
		} finally {
			setLoading(false);
		}
	}, []);

	const saveHotkeys = useCallback(
		async (newHotkeys: Partial<HotkeyMapping>) => {
			try {
				// Backend converts JSON to TOML and saves as hotkeys.toml
				await invoke("write_config", {
					filename: "hotkeys",
					content: JSON.stringify(newHotkeys, null, 2),
				});

				// Merge with defaults for immediate use
				const mergedHotkeys: HotkeyMapping = {
					...DEFAULT_HOTKEYS,
					...newHotkeys,
				};
				// Update CodeMirror app hotkey patterns
				updateAppHotkeyPatterns(mergedHotkeys);
				setHotkeys(mergedHotkeys);
			} catch (error) {
				console.error("Failed to save hotkeys:", error);
			}
		},
		[]
	);

	const updateHotkeys = useCallback(
		async (updates: Partial<HotkeyMapping>) => {
			// Only save the user's custom hotkeys, not the defaults
			const currentCustomHotkeys: Partial<HotkeyMapping> = {};

			// Extract only the customized hotkeys
			Object.entries(hotkeys).forEach(([action, config]) => {
				const defaultConfig = DEFAULT_HOTKEYS[action as keyof HotkeyMapping];
				if (JSON.stringify(config) !== JSON.stringify(defaultConfig)) {
					currentCustomHotkeys[action as keyof HotkeyMapping] = config;
				}
			});

			const newCustomHotkeys = {
				...currentCustomHotkeys,
				...updates,
			};

			await saveHotkeys(newCustomHotkeys);
		},
		[hotkeys, saveHotkeys]
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
		updateHotkeys,
		loadHotkeys,
		saveHotkeys,
	};
}
