import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { atom, useAtom } from "jotai";
import { useCallback } from "react";
import type { AppConfig } from "../types";
import { DEFAULT_THEME } from "@/config/themes";

/**
 * Configuration Hook — Singleton via Jotai atom
 *
 * Config state lives in a module-level atom so ALL consumers share a single
 * instance. One load on boot, one re-render pass on any update — no redundant
 * disk reads or cascading state updates across hooks.
 *
 * The Rust backend handles config file format transparently:
 * - Primary: config.toml (human-readable, preferred)
 * - Fallback: config.json (only if TOML doesn't exist)
 */

export const DEFAULT_CONFIG: AppConfig = {
	theme: DEFAULT_THEME,
	editor: {
		lineWrapping: false,
		toolbarVisible: true,
		titleBarVisible: true,
	},
	debug: {
		enableExampleNote: false,
	},
	storage: {
		backend: "sqlite",
		sqlite: {
			database_path: "notes.db",
		},
	},
	development: {
		useLocalConfig: false,
		configPath: "./dev/",
	},
	production: {},
};

// ─── Module-level singletons ───────────────────────────────────────────────

const configAtom = atom<AppConfig>(DEFAULT_CONFIG);
const loadingAtom = atom<boolean>(true);

// True while we are writing so the file-watcher can ignore our own events.
let isWriting = false;
let writeTimeoutId: number | null = null;

// Initialised once (first useConfig mount).
let initialized = false;

// ─── Helpers ──────────────────────────────────────────────────────────────

function mergeWithDefaults(parsed: AppConfig): AppConfig {
	return {
		...DEFAULT_CONFIG,
		...parsed,
		editor: { ...DEFAULT_CONFIG.editor, ...parsed.editor },
		debug: { ...DEFAULT_CONFIG.debug, ...parsed.debug },
		storage: { ...DEFAULT_CONFIG.storage, ...parsed.storage },
		hotkeys: parsed.hotkeys ?? DEFAULT_CONFIG.hotkeys,
		development: { ...DEFAULT_CONFIG.development, ...parsed.development },
		production: { ...DEFAULT_CONFIG.production, ...parsed.production },
	};
}

async function loadConfigFromDisk(): Promise<AppConfig> {
	const isDevelopment = import.meta.env.DEV;
	if (isDevelopment) {
		try {
			const raw = await invoke<string>("read_config", { filename: "config" });
			return mergeWithDefaults(JSON.parse(raw) as AppConfig);
		} catch {
			// fall through to system config
		}
	}
	try {
		const raw = await invoke<string>("read_config", { filename: "config" });
		return mergeWithDefaults(JSON.parse(raw) as AppConfig);
	} catch {
		const isDev = import.meta.env.DEV;
		return isDev
			? { ...DEFAULT_CONFIG, development: { useLocalConfig: true, configPath: "./dev/" } }
			: DEFAULT_CONFIG;
	}
}

// ─── Hook ─────────────────────────────────────────────────────────────────

export const useConfig = () => {
	const [config, setConfig] = useAtom(configAtom);
	const [loading, setLoading] = useAtom(loadingAtom);

	const loadConfig = useCallback(async () => {
		const merged = await loadConfigFromDisk();
		setConfig(merged);
		setLoading(false);
	}, [setConfig, setLoading]);

	// Initialise once on first mount.
	if (!initialized) {
		initialized = true;

		// Load config immediately (no useEffect delay).
		loadConfigFromDisk().then((merged) => {
			setConfig(merged);
			setLoading(false);
		});

		// Set up file watcher once (singleton — never unlistens).
		invoke("setup_config_watcher")
			.then(() =>
				listen("config-file-changed", () => {
					if (isWriting) return; // our own write — skip
					loadConfigFromDisk().then((merged) => setConfig(merged));
				}),
			)
			.catch((err) => console.error("Failed to setup config watcher:", err));
	}

	const saveConfig = useCallback(async (newConfig: AppConfig) => {
		try {
			isWriting = true;
			if (writeTimeoutId !== null) clearTimeout(writeTimeoutId);

			await invoke("write_config", {
				filename: "config",
				content: JSON.stringify(newConfig, null, 2),
			});

			writeTimeoutId = window.setTimeout(() => {
				isWriting = false;
			}, 200);
		} catch (error) {
			console.error("Failed to save config:", error);
			loadConfigFromDisk().then((merged) => setConfig(merged));
		}
	}, [setConfig]);

	const updateConfig = useCallback(
		async (updates: Partial<AppConfig>) => {
			const newConfig: AppConfig = {
				...config,
				...updates,
				editor: { ...config.editor, ...updates.editor },
				debug: { ...config.debug, ...updates.debug },
				storage: { ...config.storage, ...updates.storage },
				hotkeys: updates.hotkeys
					? { ...config.hotkeys, ...updates.hotkeys }
					: config.hotkeys,
				layout: updates.layout
					? { ...config.layout, ...updates.layout }
					: config.layout,
				development: { ...config.development, ...updates.development },
				production: { ...config.production, ...updates.production },
			};

			// Optimistic update — all consumers re-render in one pass.
			setConfig(newConfig);

			// Persist in background — does NOT trigger re-renders on completion.
			saveConfig(newConfig);
		},
		[config, setConfig, saveConfig],
	);

	return { config, loading, updateConfig, loadConfig };
};
