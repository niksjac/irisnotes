import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { useCallback, useEffect, useState } from "react";
import type { AppConfig } from "../types";

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
};

export const useConfig = () => {
	const [config, setConfig] = useState<AppConfig>(DEFAULT_CONFIG);
	const [loading, setLoading] = useState(true);

	const loadConfig = useCallback(async () => {
		try {
			// Check if we're in development mode by checking for local config
			const isDevelopment = import.meta.env.DEV;
			const configPath = "config.json";

			if (isDevelopment) {
				// Try to use local config first in dev mode
				try {
					const localConfigString = await invoke<string>("read_config", {
						filename: "config.json",
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
							...DEFAULT_CONFIG.development,
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
			await invoke("write_config", {
				filename: "config.json",
				content: JSON.stringify(newConfig, null, 2),
			});
			setConfig(newConfig);
		} catch (error) {
			console.error("Failed to save config:", error);
		}
	}, []);

	const updateConfig = useCallback(
		async (updates: Partial<AppConfig>) => {
					const newConfig = {
			...config,
			...updates,
			editor: { ...config.editor, ...updates.editor },
			debug: { ...config.debug, ...updates.debug },
			storage: { ...config.storage, ...updates.storage },
			hotkeys: updates.hotkeys ? { ...config.hotkeys, ...updates.hotkeys } : config.hotkeys,
			development: { ...config.development, ...updates.development },
			production: { ...config.production, ...updates.production },
		};
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
		};
	}, [loadConfig]);

	return {
		config,
		loading,
		updateConfig,
		loadConfig,
	};
};
