import { useEffect, useRef } from "react";
import { useSetAtom, useAtomValue } from "jotai";
import { invoke } from "@tauri-apps/api/core";
import { itemsAtom } from "@/atoms/items";
import { syncStateAtom, syncNowRequestAtom } from "@/atoms/sync";
import { useConfig } from "./use-config";
import { useNotesStorage } from "./use-notes-storage";
import { runSync } from "@/storage/sync/sync-engine";

/**
 * Background sync loop. Local-first: the app always reads/writes the local DB;
 * this just reconciles with iris-server when enabled. Runs once on mount and
 * then every `intervalSeconds`, and on demand via syncNowRequestAtom.
 *
 * Reports progress into syncStateAtom (shown by the activity-bar indicator).
 * Disabled by default (config.sync.enabled). When re-enabled after working
 * offline, the persisted push cursor means the first cycle pushes everything
 * changed in the meantime — no special catch-up logic needed.
 *
 * Mounted once in the Layout.
 */
export function useSync() {
	const { config } = useConfig();
	const { storageAdapter } = useNotesStorage();
	const setItems = useSetAtom(itemsAtom);
	const setSyncState = useSetAtom(syncStateAtom);
	const syncNowRequest = useAtomValue(syncNowRequestAtom);

	const sync = config.sync;
	const enabled = Boolean(sync?.enabled && sync.serverUrl && sync.token);

	// Guard against overlapping cycles; hold the latest tick for manual triggers.
	const runningRef = useRef(false);
	const tickRef = useRef<null | (() => Promise<void>)>(null);

	useEffect(() => {
		if (!enabled || !sync || !storageAdapter) {
			tickRef.current = null;
			setSyncState((s) => ({ ...s, status: "disabled" }));
			return;
		}

		let cancelled = false;
		let intervalId: number | undefined;

		// Refresh the shared items atom after remote rows land locally.
		const refreshItems = () => {
			storageAdapter.getAllItems().then((res) => {
				if (res.success && res.data) setItems(res.data);
			});
		};

		(async () => {
			// Use the SAME resolved DB path the adapter opened (dev-vs-prod aware),
			// not the raw config string — otherwise the engine would sync a
			// different file and push nothing.
			const databasePath = await invoke<string>("get_database_path");
			if (cancelled) return;

			const tick = async () => {
				if (runningRef.current) return;
				runningRef.current = true;
				setSyncState((s) => ({ ...s, status: "syncing" }));
				try {
					const result = await runSync({ ...sync, databasePath }, refreshItems);
					setSyncState({
						status: "idle",
						lastSyncedAt: Date.now(),
						lastError: null,
						lastResult: result,
					});
				} catch (e) {
					setSyncState((s) => ({
						...s,
						status: "error",
						lastError: e instanceof Error ? e.message : String(e),
					}));
					console.warn("[sync] cycle failed:", e);
				} finally {
					runningRef.current = false;
				}
			};
			tickRef.current = tick;

			void tick();
			const intervalMs = Math.max(5, sync.intervalSeconds ?? 30) * 1000;
			intervalId = window.setInterval(tick, intervalMs);
		})();

		return () => {
			cancelled = true;
			tickRef.current = null;
			if (intervalId) window.clearInterval(intervalId);
		};
	}, [enabled, sync, storageAdapter, setItems, setSyncState]);

	// Manual "Sync now" requests from the settings view.
	useEffect(() => {
		if (syncNowRequest > 0) void tickRef.current?.();
	}, [syncNowRequest]);
}
