import { useEffect, useRef } from "react";
import { listen } from "@tauri-apps/api/event";
import { useTabManagement } from "./use-tab-management";
import { useAtomValue } from "jotai";
import { itemsAtom } from "@/atoms";

/**
 * Hook to listen for events from the quick app (IrisNotes Quick Search)
 * 
 * When user selects a note in the quick app, it launches main app with --open-note arg.
 * The main app's single-instance plugin receives this and emits an event.
 * This hook listens for that event and opens the note in a tab.
 */
export const useQuickAppListener = () => {
	const { openItemInTab } = useTabManagement();
	const items = useAtomValue(itemsAtom);
	
	// Use refs to avoid stale closure issues
	const itemsRef = useRef(items);
	const openItemInTabRef = useRef(openItemInTab);
	
	// Keep refs updated
	useEffect(() => {
		itemsRef.current = items;
	}, [items]);
	
	useEffect(() => {
		openItemInTabRef.current = openItemInTab;
	}, [openItemInTab]);

	useEffect(() => {
		let unlisten: (() => void) | null = null;
		let isCancelled = false;

		const setupListener = async () => {
			try {
				const unlistenFn = await listen<string>("open-note-from-quick", (event) => {
					// Guard against StrictMode double-mounting
					if (isCancelled) {
						return;
					}
					
					const noteId = event.payload;

					// Find the note in items (using ref to get current value)
					const currentItems = itemsRef.current;
					const note = currentItems.find((item) => item.id === noteId);
					if (note) {
						openItemInTabRef.current({
							id: note.id,
							title: note.title,
							type: "note",
						});
					} else {
						// Note might exist but items not loaded yet - open with default title
						openItemInTabRef.current({
							id: noteId,
							title: "Note",
							type: "note",
						});
					}
				});
				
				// Only set unlisten if not cancelled during async setup
				if (!isCancelled) {
					unlisten = unlistenFn;
				} else {
					// Clean up immediately if we were cancelled during setup
					unlistenFn();
				}
			} catch {
				// Not in Tauri context - ignore
			}
		};

		setupListener();

		return () => {
			isCancelled = true;
			if (unlisten) {
				unlisten();
			}
		};
	}, []); // Empty deps - only setup once
};
