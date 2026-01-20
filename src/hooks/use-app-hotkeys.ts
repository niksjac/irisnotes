import { useHotkeys } from "react-hotkeys-hook";
import { useHotkeysConfig } from "./use-hotkeys-config";
import type { AppHotkeysProps } from "@/types";

/**
 * Centralized app-wide hotkeys hook
 * Uses loop-based registration for cleaner code
 */
export function useAppHotkeys(handlers: AppHotkeysProps) {
	const { hotkeys: hotkeyMapping } = useHotkeysConfig();

	// Create hotkey options based on global setting
	const createHotkeyOptions = (global: boolean = true) => ({
		preventDefault: true,
		enableOnContentEditable: global,
		enableOnFormTags: global,
	});

	// Mobile check for pane operations
	const isMobile = () => window.innerWidth < 768;

	// Helper to create mobile-aware handlers
	const createHandler = (handler?: () => void, mobileDisabled?: boolean) => {
		if (!handler) return () => {}; // No-op handler
		return () => {
			if (mobileDisabled && isMobile()) return;
			handler();
		};
	};

	// Register all hotkeys individually (React hooks requirement)
	// Layout hotkeys
	useHotkeys(
		hotkeyMapping.toggleSidebar.key,
		createHandler(handlers.onToggleSidebar),
		createHotkeyOptions(hotkeyMapping.toggleSidebar.global)
	);
	useHotkeys(
		hotkeyMapping.toggleActivityBar.key,
		createHandler(handlers.onToggleActivityBar),
		createHotkeyOptions(hotkeyMapping.toggleActivityBar.global)
	);

	// Tab hotkeys
	useHotkeys(
		hotkeyMapping.closeTab.key,
		createHandler(handlers.onCloseTab),
		createHotkeyOptions(hotkeyMapping.closeTab.global)
	);
	useHotkeys(
		hotkeyMapping.newTab.key,
		createHandler(handlers.onNewTab),
		createHotkeyOptions(hotkeyMapping.newTab.global)
	);
	useHotkeys(
		hotkeyMapping.moveTabLeft.key,
		createHandler(handlers.onMoveTabLeft),
		createHotkeyOptions(hotkeyMapping.moveTabLeft.global)
	);
	useHotkeys(
		hotkeyMapping.moveTabRight.key,
		createHandler(handlers.onMoveTabRight),
		createHotkeyOptions(hotkeyMapping.moveTabRight.global)
	);

	// Pane hotkeys (mobile disabled)
	useHotkeys(
		hotkeyMapping.toggleDualPane.key,
		createHandler(handlers.onToggleDualPane, true),
		createHotkeyOptions(hotkeyMapping.toggleDualPane.global)
	);
	useHotkeys(
		hotkeyMapping.paneResizeLeft.key,
		createHandler(handlers.onPaneResizeLeft, true),
		createHotkeyOptions(hotkeyMapping.paneResizeLeft.global)
	);
	useHotkeys(
		hotkeyMapping.paneResizeRight.key,
		createHandler(handlers.onPaneResizeRight, true),
		createHotkeyOptions(hotkeyMapping.paneResizeRight.global)
	);

	// Sidebar resizing hotkeys
	useHotkeys(
		hotkeyMapping.sidebarResizeLeft.key,
		createHandler(handlers.onSidebarResizeLeft),
		createHotkeyOptions(hotkeyMapping.sidebarResizeLeft.global)
	);
	useHotkeys(
		hotkeyMapping.sidebarResizeRight.key,
		createHandler(handlers.onSidebarResizeRight),
		createHotkeyOptions(hotkeyMapping.sidebarResizeRight.global)
	);

	// Pane focus hotkeys
	useHotkeys(
		hotkeyMapping.focusPane1.key,
		createHandler(handlers.onFocusPane1),
		createHotkeyOptions(hotkeyMapping.focusPane1.global)
	);
	useHotkeys(
		hotkeyMapping.focusPane2.key,
		createHandler(handlers.onFocusPane2),
		createHotkeyOptions(hotkeyMapping.focusPane2.global)
	);

	// Tab movement between panes
	useHotkeys(
		hotkeyMapping.moveTabToPaneLeft.key,
		createHandler(handlers.onMoveTabToPaneLeft),
		createHotkeyOptions(hotkeyMapping.moveTabToPaneLeft.global)
	);
	useHotkeys(
		hotkeyMapping.moveTabToPaneRight.key,
		createHandler(handlers.onMoveTabToPaneRight),
		createHotkeyOptions(hotkeyMapping.moveTabToPaneRight.global)
	);

	// Tab focus by number
	useHotkeys(
		hotkeyMapping.focusTab1.key,
		createHandler(handlers.onFocusTab1),
		createHotkeyOptions(hotkeyMapping.focusTab1.global)
	);
	useHotkeys(
		hotkeyMapping.focusTab2.key,
		createHandler(handlers.onFocusTab2),
		createHotkeyOptions(hotkeyMapping.focusTab2.global)
	);
	useHotkeys(
		hotkeyMapping.focusTab3.key,
		createHandler(handlers.onFocusTab3),
		createHotkeyOptions(hotkeyMapping.focusTab3.global)
	);
	useHotkeys(
		hotkeyMapping.focusTab4.key,
		createHandler(handlers.onFocusTab4),
		createHotkeyOptions(hotkeyMapping.focusTab4.global)
	);
	useHotkeys(
		hotkeyMapping.focusTab5.key,
		createHandler(handlers.onFocusTab5),
		createHotkeyOptions(hotkeyMapping.focusTab5.global)
	);
	useHotkeys(
		hotkeyMapping.focusTab6.key,
		createHandler(handlers.onFocusTab6),
		createHotkeyOptions(hotkeyMapping.focusTab6.global)
	);
	useHotkeys(
		hotkeyMapping.focusTab7.key,
		createHandler(handlers.onFocusTab7),
		createHotkeyOptions(hotkeyMapping.focusTab7.global)
	);
	useHotkeys(
		hotkeyMapping.focusTab8.key,
		createHandler(handlers.onFocusTab8),
		createHotkeyOptions(hotkeyMapping.focusTab8.global)
	);
	useHotkeys(
		hotkeyMapping.focusTab9.key,
		createHandler(handlers.onFocusTab9),
		createHotkeyOptions(hotkeyMapping.focusTab9.global)
	);

	// Tab navigation
	useHotkeys(
		hotkeyMapping.focusNextTab.key,
		createHandler(handlers.onFocusNextTab),
		createHotkeyOptions(hotkeyMapping.focusNextTab.global)
	);
	useHotkeys(
		hotkeyMapping.focusPreviousTab.key,
		createHandler(handlers.onFocusPreviousTab),
		createHotkeyOptions(hotkeyMapping.focusPreviousTab.global)
	);
	useHotkeys(
		hotkeyMapping.focusNextSpawnedTab.key,
		createHandler(handlers.onFocusNextSpawnedTab),
		createHotkeyOptions(hotkeyMapping.focusNextSpawnedTab.global)
	);
	useHotkeys(
		hotkeyMapping.focusPreviousSpawnedTab.key,
		createHandler(handlers.onFocusPreviousSpawnedTab),
		createHotkeyOptions(hotkeyMapping.focusPreviousSpawnedTab.global)
	);

	// App hotkeys
	useHotkeys(
		hotkeyMapping.refreshApp.key,
		createHandler(handlers.onRefreshApp),
		createHotkeyOptions(hotkeyMapping.refreshApp.global)
	);

	// Editor hotkeys
	useHotkeys(
		hotkeyMapping.toggleEditorView.key,
		createHandler(handlers.onToggleEditorView),
		createHotkeyOptions(hotkeyMapping.toggleEditorView.global)
	);
	useHotkeys(
		hotkeyMapping.toggleLineWrapping.key,
		createHandler(handlers.onToggleLineWrapping),
		createHotkeyOptions(hotkeyMapping.toggleLineWrapping.global)
	);
	useHotkeys(
		hotkeyMapping.toggleToolbar.key,
		createHandler(handlers.onToggleToolbar),
		createHotkeyOptions(hotkeyMapping.toggleToolbar.global)
	);
	useHotkeys(
		hotkeyMapping.increaseFontSize.key,
		createHandler(handlers.onIncreaseFontSize),
		createHotkeyOptions(hotkeyMapping.increaseFontSize.global)
	);
	useHotkeys(
		hotkeyMapping.decreaseFontSize.key,
		createHandler(handlers.onDecreaseFontSize),
		createHotkeyOptions(hotkeyMapping.decreaseFontSize.global)
	);

	// Focus hotkeys
	useHotkeys(
		hotkeyMapping.focusTreeView.key,
		createHandler(handlers.onFocusTreeView),
		createHotkeyOptions(hotkeyMapping.focusTreeView.global)
	);

	// Notes hotkeys
	useHotkeys(
		hotkeyMapping.newNote.key,
		createHandler(handlers.onNewNote),
		createHotkeyOptions(hotkeyMapping.newNote.global)
	);
	useHotkeys(
		hotkeyMapping.newNoteWithLocation.key,
		createHandler(handlers.onNewNoteWithLocation),
		createHotkeyOptions(hotkeyMapping.newNoteWithLocation.global)
	);

	// Views hotkeys
	useHotkeys(
		hotkeyMapping.openSettings.key,
		createHandler(handlers.onOpenSettings),
		createHotkeyOptions(hotkeyMapping.openSettings.global)
	);
	useHotkeys(
		hotkeyMapping.openHotkeys.key,
		createHandler(handlers.onOpenHotkeys),
		createHotkeyOptions(hotkeyMapping.openHotkeys.global)
	);

	// Search hotkeys
	useHotkeys(
		hotkeyMapping.quickSearch.key,
		createHandler(handlers.onQuickSearch),
		createHotkeyOptions(hotkeyMapping.quickSearch.global)
	);
	useHotkeys(
		hotkeyMapping.fullTextSearch.key,
		createHandler(handlers.onFullTextSearch),
		createHotkeyOptions(hotkeyMapping.fullTextSearch.global)
	);
}
