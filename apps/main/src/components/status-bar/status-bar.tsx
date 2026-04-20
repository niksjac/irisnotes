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

import { useAtomValue, useSetAtom } from "jotai";
import { editorSettingsAtom } from "@/atoms/settings";
import { editorStatsAtom } from "@/atoms/editor-stats";
import { pane0ActiveTabAtom, pane1TabsAtom, pane0TabsAtom, pane1ActiveTabAtom, paneStateAtom, closeAllTabsAtom } from "@/atoms/panes";
import { statusBarVisibleAtom } from "@/atoms";
import { useMemo, useCallback } from "react";
import { writeText } from "@tauri-apps/plugin-clipboard-manager";

const isDev = import.meta.env.DEV;

export function StatusBar() {
	const statusBarVisible = useAtomValue(statusBarVisibleAtom);
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
	const closeAllTabs = useSetAtom(closeAllTabsAtom);
	const focusedPane = paneState.activePane;
	const totalTabCount = pane0Tabs.length + pane1Tabs.length;

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

	// Hide status bar when not visible (e.g., in zen mode)
	if (!statusBarVisible) return null;

	return (
		<div className="flex-shrink-0 h-5 px-3 flex items-center justify-between gap-4 text-[11px] text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 select-none overflow-hidden">
			{/* Left side - editor stats */}
			<div className="flex items-center gap-3 tabular-nums overflow-hidden min-w-0">
				{isDev && (
					<>
						<span className="px-1.5 rounded font-semibold text-[10px] bg-amber-400 text-amber-900 dark:bg-amber-500 dark:text-amber-950 flex-shrink-0">
							DEV
						</span>
						<span className="text-gray-300 dark:text-gray-600 flex-shrink-0">|</span>
					</>
				)}
				{isEditorActive && activeNoteId && (
					<>
						<button
							type="button"
							onClick={handleCopyId}
							className="hover:text-gray-700 dark:hover:text-gray-200 select-text cursor-pointer truncate max-w-[120px] flex-shrink min-w-0 hidden sm:inline"
							title="Click to copy note ID"
						>
							ID: {activeNoteId}
						</button>
						<span className="text-gray-300 dark:text-gray-600 flex-shrink-0 hidden sm:inline">|</span>
					</>
				)}
				{isEditorActive && (
					<>
						<span title="Cursor position" className="whitespace-nowrap flex-shrink-0">
							Ln {editorStats.line}, Col {editorStats.column}
						</span>
						<span className="text-gray-300 dark:text-gray-600 flex-shrink-0">|</span>
						<span title="Word count" className="whitespace-nowrap flex-shrink-0">
							Words: {formatNumber(editorStats.wordCount)}
						</span>
					</>
				)}
			</div>

			{/* Right side - display settings */}
			<div className="flex items-center gap-3 tabular-nums flex-shrink-0">
				{totalTabCount > 0 && (
					<>
						<span className="flex items-center gap-1" title={`${totalTabCount} open tab${totalTabCount !== 1 ? "s" : ""}`}>
							Tabs: {totalTabCount}
							<button
								type="button"
								onClick={() => closeAllTabs()}
								className="ml-0.5 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
								title="Close all tabs"
							>
								<svg width="10" height="10" viewBox="0 0 12 12" fill="currentColor">
									<path d="M6 4.586L10.293.293a1 1 0 011.414 1.414L7.414 6l4.293 4.293a1 1 0 01-1.414 1.414L6 7.414l-4.293 4.293a1 1 0 01-1.414-1.414L4.586 6 .293 1.707A1 1 0 011.707.293L6 4.586z" />
								</svg>
							</button>
						</span>
						<span className="text-gray-300 dark:text-gray-600">|</span>
					</>
				)}
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
