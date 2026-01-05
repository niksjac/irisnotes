import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { useCallback, useEffect, useRef, useState } from "react";
import type { AppConfig } from "../types";

/**
 * Configuration Hook
 *
 * The Rust backend handles config file format transparently:
 * - Primary: config.toml (human-readable, preferred)
 * - Fallback: config.json (only if TOML doesn't exist)
 *
 * The backend automatically:
 * - Reads TOML and converts to JSON for the frontend
 * - Converts JSON back to TOML when writing
 *
 * So while this hook uses JSON for data exchange, the actual
 * config file on disk is TOML (dev/config.toml in development).
 */

const DEFAULT_CONFIG: AppConfig = {
	editor: {
		lineWrapping: false,
		toolbarVisible: true,
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
	theme: "dark",
};

export const useConfig = () => {
	const [config, setConfig] = useState<AppConfig>(DEFAULT_CONFIG);
	const [loading, setLoading] = useState(true);
	
	// Track if we triggered the last write (to ignore our own file watcher events)
	const isWritingRef = useRef(false);
	const writeTimeoutRef = useRef<number | null>(null);

	const loadConfig = useCallback(async () => {
		try {
			const isDevelopment = import.meta.env.DEV;
			
			// Note: The filename is just a hint for the backend.
			// The Rust backend prioritizes config.toml over config.json.
			// If config.toml exists, it reads that and converts to JSON.
			const configPath = "config.json";

			if (isDevelopment) {
				// In dev mode, config is at ./dev/config.toml
				try {
					const localConfigString = await invoke<string>("read_config", {
						filename: "config.json", // Backend converts TOML→JSON transparently
					});
					const parsedConfig = JSON.parse(localConfigString) as AppConfig;

					// Merge with defaults to ensure all required fields exist
					const mergedConfig: AppConfig = {
						...DEFAULT_CONFIG,
						...parsedConfig,
						editor: { ...DEFAULT_CONFIG.editor, ...parsedConfig.editor },

						debug: { ...DEFAULT_CONFIG.debug, ...parsedConfig.debug },
						storage: { ...DEFAULT_CONFIG.storage, ...parsedConfig.storage },
						hotkeys: parsedConfig.hotkeys, // Use user hotkeys if provided, otherwise undefined (falls back to defaults)
						development: {
							...parsedConfig.development,
						},
						production: {
							...DEFAULT_CONFIG.production,
							...parsedConfig.production,
						},
					};

					setConfig(mergedConfig);
					return;
				} catch {
					// Fall back to system config in dev mode
				}
			}

			const configString = await invoke<string>("read_config", {
				filename: configPath,
			});
			const parsedConfig = JSON.parse(configString) as AppConfig;

			// Merge with defaults to ensure all required fields exist
			const mergedConfig: AppConfig = {
				...DEFAULT_CONFIG,
				...parsedConfig,
				editor: { ...DEFAULT_CONFIG.editor, ...parsedConfig.editor },
				debug: { ...DEFAULT_CONFIG.debug, ...parsedConfig.debug },
				storage: { ...DEFAULT_CONFIG.storage, ...parsedConfig.storage },
				hotkeys: parsedConfig.hotkeys, // Use user hotkeys if provided, otherwise undefined (falls back to defaults)
				development: {
					...DEFAULT_CONFIG.development,
					...parsedConfig.development,
				},
				production: {
					...DEFAULT_CONFIG.production,
					...parsedConfig.production,
				},
			};

			setConfig(mergedConfig);
		} catch {
			// Failed to load config - use defaults
			const isDevelopment = import.meta.env.DEV;
			const defaultConfig: AppConfig = isDevelopment
				? {
						...DEFAULT_CONFIG,
						development: {
							useLocalConfig: true,
							configPath: "./dev/",
						},
					}
				: DEFAULT_CONFIG;

			setConfig(defaultConfig);
		} finally {
			setLoading(false);
		}
	}, []);

	const saveConfig = useCallback(async (newConfig: AppConfig) => {
		try {
			// Mark that we're writing (to ignore our own file watcher event)
			isWritingRef.current = true;
			
			// Clear any pending timeout
			if (writeTimeoutRef.current) {
				clearTimeout(writeTimeoutRef.current);
			}
			
			// Note: We send JSON, but the backend converts to TOML if config.toml exists.
			// This keeps the config file human-readable on disk.
			await invoke("write_config", {
				filename: "config.json", // Backend converts JSON→TOML transparently
				content: JSON.stringify(newConfig, null, 2),
			});
			
			// Reset the writing flag after a delay (longer than file watcher debounce)
			writeTimeoutRef.current = window.setTimeout(() => {
				isWritingRef.current = false;
			}, 200);
		} catch (error) {
			console.error("Failed to save config:", error);
			// On error, reload from file to restore correct state
			loadConfig();
		}
	}, [loadConfig]);

	const updateConfig = useCallback(
		async (updates: Partial<AppConfig>) => {
			const newConfig = {
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
			
			// OPTIMISTIC UPDATE: Update state immediately for instant UI response
			setConfig(newConfig);
			
			// Then persist to file in background
			await saveConfig(newConfig);
		},
		[config, saveConfig]
	);

	useEffect(() => {
		loadConfig();

		// Set up file watcher
		const setupWatcher = async () => {
			try {
				// Initialize the file watcher
				await invoke("setup_config_watcher");

				// Listen for config file changes
				const unlisten = await listen("config-file-changed", () => {
					// Ignore events triggered by our own writes
					if (isWritingRef.current) {
						return;
					}
					// External change - reload config
					loadConfig();
				});

				return unlisten;
			} catch (error) {
				console.error("Failed to setup config file watcher:", error);
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
			// Clean up timeout on unmount
			if (writeTimeoutRef.current) {
				clearTimeout(writeTimeoutRef.current);
			}
		};
	}, [loadConfig]);

	return {
		config,
		loading,
		updateConfig,
		loadConfig,
	};
};
