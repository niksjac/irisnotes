import { useCallback, useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { createStorageAdapter } from "@/storage";
import type { StorageAdapter } from "@/storage";

export const useNotesStorage = () => {
	const [storageAdapter, setStorageAdapter] = useState<StorageAdapter | null>(
		null
	);
	const [isInitialized, setIsInitialized] = useState(false);

	// Initialize storage once
	useEffect(() => {
		// Prevent multiple initialization attempts
		if (isInitialized) {
			return;
		}

		const initializeStorage = async () => {
			try {
				// SQLite only; the backend resolves the path (dev/ vs ~/.config/irisnotes/)
				const databasePath = await invoke<string>("get_database_path");
				const adapter = createStorageAdapter({
					backend: "sqlite",
					sqlite: { database_path: databasePath },
				});

				// Initialize the adapter
				const result = await adapter.init();

				if (!result.success) {
					console.error("❌ Failed to initialize storage:", result.error);
					// Don't throw on init failure, let the adapter fall back to sample data
					console.warn("🔄 Storage will use fallback data");
				}

				setStorageAdapter(adapter);
				setIsInitialized(true);
			} catch (err) {
				console.error("❌ Failed to initialize storage:", err);
				// Don't throw to prevent app crash, allow fallback behavior
				console.warn("🔄 Storage initialization failed, using fallback");
			}
		};

		initializeStorage();
	}, [isInitialized]);

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
