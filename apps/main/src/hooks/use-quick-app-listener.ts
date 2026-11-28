import { useEffect, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { useAtomValue } from "jotai";
import { useTabManagement } from "./use-tab-management";
import { itemsAtom } from "@/atoms";
import { keepRunningInBackgroundAtom } from "@/atoms/settings";

/** What another launch asked for (see LaunchAction in src-tauri/src/lib.rs) */
type LaunchAction = { kind: "open"; id: string } | { kind: "new"; title: string };

interface QuickAppListenerOptions {
	/** Storage is open and items are loaded, so notes can be opened and created */
	isReady: boolean;
	createNoteInRootWithTitle: (title: string) => Promise<unknown>;
	/** Reload the items atom from the database */
	reloadItems: () => Promise<unknown>;
	/** Cheap "did notes get added elsewhere?" check, e.g. count + newest created_at */
	itemsFingerprint: () => Promise<string | null>;
}

/**
 * Handle launches from the quick launcher (IrisNotes Quick) and the CLI.
 *
 * `irisnotes --open-note=<id>` / `--new-note=<title>` reach the backend (as a
 * second instance, or on a cold start). The backend queues them until this
 * hook calls `launch_ready`, then sends later ones as `launch-action` events.
 *
 * Also: quick capture writes notes straight into the database. When the
 * window gets focus and notes were added elsewhere, the items are reloaded.
 *
 * And mirrors the "keep running when the window is closed" setting to the
 * backend, which handles the close.
 */
export const useQuickAppListener = ({
	isReady,
	createNoteInRootWithTitle,
	reloadItems,
	itemsFingerprint,
}: QuickAppListenerOptions) => {
	const { openItemInTab } = useTabManagement();
	const items = useAtomValue(itemsAtom);
	const keepRunning = useAtomValue(keepRunningInBackgroundAtom);

	// Refs so the long-lived listeners always see current values
	const itemsRef = useRef(items);
	const openItemInTabRef = useRef(openItemInTab);
	const createRef = useRef(createNoteInRootWithTitle);
	const reloadRef = useRef(reloadItems);
	const fingerprintRef = useRef(itemsFingerprint);
	useEffect(() => {
		itemsRef.current = items;
		openItemInTabRef.current = openItemInTab;
		createRef.current = createNoteInRootWithTitle;
		reloadRef.current = reloadItems;
		fingerprintRef.current = itemsFingerprint;
	});

	useEffect(() => {
		invoke("set_keep_running", { keep: keepRunning }).catch(() => {});
	}, [keepRunning]);

	useEffect(() => {
		if (!isReady) return;
		let cancelled = false;
		const cleanups: (() => void)[] = [];

		const run = (action: LaunchAction) => {
			if (cancelled) return;
			if (action.kind === "new") {
				void createRef.current(action.title);
				return;
			}
			const note = itemsRef.current.find((item) => item.id === action.id);
			openItemInTabRef.current({ id: action.id, title: note?.title ?? "Note", type: "note" });
		};

		(async () => {
			try {
				const unlisten = await listen<LaunchAction>("launch-action", (event) => run(event.payload));
				// Unmounted meanwhile (StrictMode): leave the queue for the next mount
				if (cancelled) {
					unlisten();
					return;
				}
				cleanups.push(unlisten);

				// Anything that arrived before we were ready
				const pending = await invoke<LaunchAction[]>("launch_ready");
				pending.forEach(run);

				// Reload when notes were added elsewhere (quick capture, sync off)
				let lastFingerprint = await fingerprintRef.current();
				const unlistenFocus = await getCurrentWindow().onFocusChanged(async ({ payload: focused }) => {
					if (!focused || cancelled) return;
					const fingerprint = await fingerprintRef.current();
					if (fingerprint !== null && fingerprint !== lastFingerprint) {
						lastFingerprint = fingerprint;
						await reloadRef.current();
					}
				});
				if (cancelled) unlistenFocus();
				else cleanups.push(unlistenFocus);
			} catch {
				// Not in Tauri context - ignore
			}
		})();

		return () => {
			cancelled = true;
			cleanups.forEach((fn) => fn());
		};
	}, [isReady]);
};
