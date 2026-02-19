/**
 * StatusBar Component
 *
 * A thin status bar at the bottom of the app showing contextual info:
 * - Note ID (when editing a note)
 * - Font size
 * - Zoom level
 * - Word count (when editing a note)
 * - Cursor position (line, column)
 */

import { useAtomValue } from "jotai";
import { editorSettingsAtom } from "@/atoms/settings";
import { editorStatsAtom } from "@/atoms/editor-stats";
import { pane0ActiveTabAtom, pane1TabsAtom, pane0TabsAtom, pane1ActiveTabAtom, paneStateAtom } from "@/atoms/panes";
import { useMemo, useCallback } from "react";
import { writeText } from "@tauri-apps/plugin-clipboard-manager";

const isDev = import.meta.env.DEV;

export function StatusBar() {
	const settings = useAtomValue(editorSettingsAtom);
	const editorStats = useAtomValue(editorStatsAtom);
	const fontSize = settings?.fontSize ?? 14;
	const zoom = settings?.zoom ?? 1;
	const zoomPercent = Math.round(zoom * 100);

	// Get active note info
	const pane0Tabs = useAtomValue(pane0TabsAtom);
	const pane1Tabs = useAtomValue(pane1TabsAtom);
	const pane0ActiveTab = useAtomValue(pane0ActiveTabAtom);
	const pane1ActiveTab = useAtomValue(pane1ActiveTabAtom);
	const paneState = useAtomValue(paneStateAtom);
	const focusedPane = paneState.activePane;

	const { isEditorActive, activeNoteId } = useMemo(() => {
		const activeInPane0 = pane0Tabs.find((t) => t.id === pane0ActiveTab);
		const activeInPane1 = pane1Tabs.find((t) => t.id === pane1ActiveTab);
		
		// Check if any editor view is active
		const isEditor = 
			activeInPane0?.viewType === "editor-rich-view" ||
			activeInPane0?.viewType === "editor-source-view" ||
			activeInPane1?.viewType === "editor-rich-view" ||
			activeInPane1?.viewType === "editor-source-view";
		
		// Get the active note ID from the focused pane (stored in viewData.noteId)
		let noteId: string | null = null;
		if (focusedPane === 0 && (activeInPane0?.viewType === "editor-rich-view" || activeInPane0?.viewType === "editor-source-view")) {
			noteId = activeInPane0?.viewData?.noteId ?? null;
		} else if (focusedPane === 1 && (activeInPane1?.viewType === "editor-rich-view" || activeInPane1?.viewType === "editor-source-view")) {
			noteId = activeInPane1?.viewData?.noteId ?? null;
		} else if (activeInPane0?.viewType === "editor-rich-view" || activeInPane0?.viewType === "editor-source-view") {
			noteId = activeInPane0?.viewData?.noteId ?? null;
		} else if (activeInPane1?.viewType === "editor-rich-view" || activeInPane1?.viewType === "editor-source-view") {
			noteId = activeInPane1?.viewData?.noteId ?? null;
		}
		
		return { isEditorActive: isEditor, activeNoteId: noteId };
	}, [pane0Tabs, pane1Tabs, pane0ActiveTab, pane1ActiveTab, paneState.activePane]);

	const handleCopyId = useCallback(async () => {
		if (activeNoteId) {
			try {
				await writeText(activeNoteId);
				console.log("Copied note ID to clipboard:", activeNoteId);
			} catch (err) {
				console.error("Failed to copy to clipboard:", err);
			}
		}
	}, [activeNoteId]);

	// Format word count with commas
	const formatNumber = (num: number) => num.toLocaleString();

	return (
		<div className="flex-shrink-0 h-5 px-3 flex items-center justify-between gap-4 text-[11px] text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 select-none">
			{/* Left side - editor stats */}
			<div className="flex items-center gap-3 tabular-nums">
				{isDev && (
					<>
						<span className="px-1.5 rounded font-semibold text-[10px] bg-amber-400 text-amber-900 dark:bg-amber-500 dark:text-amber-950">
							DEV
						</span>
						<span className="text-gray-300 dark:text-gray-600">|</span>
					</>
				)}
				{isEditorActive && activeNoteId && (
					<>
						<button
							type="button"
							onClick={handleCopyId}
							className="hover:text-gray-700 dark:hover:text-gray-200 select-text cursor-pointer"
							title="Click to copy note ID"
						>
							ID: {activeNoteId}
						</button>
						<span className="text-gray-300 dark:text-gray-600">|</span>
					</>
				)}
				{isEditorActive && (
					<>
						<span title="Cursor position">
							Ln {editorStats.line}, Col {editorStats.column}
						</span>
						<span className="text-gray-300 dark:text-gray-600">|</span>
						<span title="Word count">
							Words: {formatNumber(editorStats.wordCount)}
						</span>
					</>
				)}
			</div>

			{/* Right side - display settings */}
			<div className="flex items-center gap-3 tabular-nums">
				<span title="Base font size (Ctrl+Alt+Up/Down to adjust)">
					{fontSize}px
				</span>
				<span className="text-gray-300 dark:text-gray-600">|</span>
				<span title="Zoom level (Ctrl+scroll or Ctrl+Plus/Minus)">
					{zoomPercent}%
				</span>
			</div>
		</div>
	);
}
