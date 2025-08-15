import { useCallback, useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useConfig } from "./use-config";
import { createStorageAdapter } from "@/storage";
import type { StorageAdapter } from "@/storage";

export const useNotesStorage = () => {
	const { config, loading: configLoading } = useConfig();
	const [storageAdapter, setStorageAdapter] = useState<StorageAdapter | null>(null);
	const [isInitialized, setIsInitialized] = useState(false);

	// Initialize storage when config loads or changes
	useEffect(() => {
		const initializeStorage = async () => {
			if (configLoading) {
				return;
			}

			try {
				// Create storage config based on backend type
				let storageConfig = { ...config.storage };

				if (config.storage.backend === "sqlite") {
					// Get the actual database path from Tauri backend (handles dev vs prod)
					const databasePath = await invoke<string>("get_database_path");
					storageConfig = {
						...storageConfig,
						sqlite: {
							...config.storage.sqlite,
							database_path: databasePath,
						},
					};
				}

				const adapter = createStorageAdapter(storageConfig);

				// Initialize the adapter
				const result = await adapter.init();

				if (!result.success) {
					console.error("❌ Failed to initialize storage:", result.error);
					throw new Error(result.error);
				}

				setStorageAdapter(adapter);
				setIsInitialized(true);
			} catch (err) {
				console.error("❌ Failed to initialize storage:", err);
				throw err;
			}
		};

		initializeStorage();
	}, [configLoading, config.storage]);

	const syncStorage = useCallback(async () => {
		if (!storageAdapter?.sync) {
			return { success: true }; // No-op if sync not supported
		}

		try {
			const result = await storageAdapter.sync();
			return result;
		} catch (err) {
			const errorMsg = `Failed to sync storage: ${err}`;
			return { success: false, error: errorMsg };
		}
	}, [storageAdapter]);

	const getStorageInfo = useCallback(async () => {
		if (!storageAdapter) {
			return { success: false, error: "No storage adapter available" };
		}

		try {
			return await storageAdapter.getStorageInfo();
		} catch (err) {
			return { success: false, error: `Failed to get storage info: ${err}` };
		}
	}, [storageAdapter]);

	const getActiveStorageConfig = useCallback(() => {
		return storageAdapter?.getConfig() || null;
	}, [storageAdapter]);

	return {
		storageAdapter,
		isInitialized,
		syncStorage,
		getStorageInfo,
		getActiveStorageConfig,

		// Legacy compatibility - expose adapter as storageManager for now
		storageManager: storageAdapter,
	};
};
