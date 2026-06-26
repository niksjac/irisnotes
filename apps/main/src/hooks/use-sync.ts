import { useEffect, useRef } from "react";
import { useSetAtom } from "jotai";
import { itemsAtom } from "@/atoms/items";
import { useConfig } from "./use-config";
import { useNotesStorage } from "./use-notes-storage";
import { runSync } from "@/storage/sync/sync-engine";

/**
 * Background sync loop. Local-first: the app always reads/writes the local DB;
 * this just reconciles with iris-server when enabled. Runs once on mount and
 * then every `intervalSeconds`. Disabled by default (config.sync.enabled).
 *
 * Mounted once in the Layout.
 */
export function useSync() {
	const { config } = useConfig();
	const { storageAdapter } = useNotesStorage();
	const setItems = useSetAtom(itemsAtom);

	const sync = config.sync;
	const enabled = Boolean(sync?.enabled && sync.serverUrl && sync.token);

	// Guard against overlapping cycles (interval + reconnect could both fire).
	const runningRef = useRef(false);

	useEffect(() => {
		if (!enabled || !sync || !storageAdapter) return;

		const databasePath = config.storage?.sqlite?.database_path ?? "notes.db";

		// Refresh the shared items atom after remote rows land locally.
		const refreshItems = () => {
			storageAdapter.getAllItems().then((res) => {
				if (res.success && res.data) setItems(res.data);
			});
		};

		const tick = async () => {
			if (runningRef.current) return;
			runningRef.current = true;
			try {
				const result = await runSync({ ...sync, databasePath }, refreshItems);
				if (result.pulled || result.pushed) {
					console.info(
						`[sync] pulled ${result.pulled} (applied ${result.applied}), pushed ${result.pushed}`,
					);
				}
			} catch (e) {
				console.warn("[sync] cycle failed:", e);
			} finally {
				runningRef.current = false;
			}
		};

		void tick();
		const intervalMs = Math.max(5, sync.intervalSeconds ?? 30) * 1000;
		const id = window.setInterval(tick, intervalMs);
		return () => window.clearInterval(id);
	}, [
		enabled,
		sync,
		storageAdapter,
		setItems,
		config.storage?.sqlite?.database_path,
	]);
}
