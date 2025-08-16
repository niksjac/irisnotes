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
	useHotkeys(hotkeyMapping.toggleSidebar.key, createHandler(handlers.onToggleSidebar), createHotkeyOptions(hotkeyMapping.toggleSidebar.global));
	useHotkeys(hotkeyMapping.toggleActivityBar.key, createHandler(handlers.onToggleActivityBar), createHotkeyOptions(hotkeyMapping.toggleActivityBar.global));

	// Tab hotkeys
	useHotkeys(hotkeyMapping.closeTab.key, createHandler(handlers.onCloseTab), createHotkeyOptions(hotkeyMapping.closeTab.global));
	useHotkeys(hotkeyMapping.newTab.key, createHandler(handlers.onNewTab), createHotkeyOptions(hotkeyMapping.newTab.global));
	useHotkeys(hotkeyMapping.moveTabLeft.key, createHandler(handlers.onMoveTabLeft), createHotkeyOptions(hotkeyMapping.moveTabLeft.global));
	useHotkeys(hotkeyMapping.moveTabRight.key, createHandler(handlers.onMoveTabRight), createHotkeyOptions(hotkeyMapping.moveTabRight.global));

	// Pane hotkeys (mobile disabled)
	useHotkeys(hotkeyMapping.toggleDualPane.key, createHandler(handlers.onToggleDualPane, true), createHotkeyOptions(hotkeyMapping.toggleDualPane.global));
	useHotkeys(hotkeyMapping.paneResizeLeft.key, createHandler(handlers.onPaneResizeLeft, true), createHotkeyOptions(hotkeyMapping.paneResizeLeft.global));
	useHotkeys(hotkeyMapping.paneResizeRight.key, createHandler(handlers.onPaneResizeRight, true), createHotkeyOptions(hotkeyMapping.paneResizeRight.global));

	// Sidebar resizing hotkeys
	useHotkeys(hotkeyMapping.sidebarResizeLeft.key, createHandler(handlers.onSidebarResizeLeft), createHotkeyOptions(hotkeyMapping.sidebarResizeLeft.global));
	useHotkeys(hotkeyMapping.sidebarResizeRight.key, createHandler(handlers.onSidebarResizeRight), createHotkeyOptions(hotkeyMapping.sidebarResizeRight.global));

	// Pane focus hotkeys
	useHotkeys(hotkeyMapping.focusPane1.key, createHandler(handlers.onFocusPane1), createHotkeyOptions(hotkeyMapping.focusPane1.global));
	useHotkeys(hotkeyMapping.focusPane2.key, createHandler(handlers.onFocusPane2), createHotkeyOptions(hotkeyMapping.focusPane2.global));

	// Tab movement between panes
	useHotkeys(hotkeyMapping.moveTabToPaneLeft.key, createHandler(handlers.onMoveTabToPaneLeft), createHotkeyOptions(hotkeyMapping.moveTabToPaneLeft.global));
	useHotkeys(hotkeyMapping.moveTabToPaneRight.key, createHandler(handlers.onMoveTabToPaneRight), createHotkeyOptions(hotkeyMapping.moveTabToPaneRight.global));

	// Tab focus by number
	useHotkeys(hotkeyMapping.focusTab1.key, createHandler(handlers.onFocusTab1), createHotkeyOptions(hotkeyMapping.focusTab1.global));
	useHotkeys(hotkeyMapping.focusTab2.key, createHandler(handlers.onFocusTab2), createHotkeyOptions(hotkeyMapping.focusTab2.global));
	useHotkeys(hotkeyMapping.focusTab3.key, createHandler(handlers.onFocusTab3), createHotkeyOptions(hotkeyMapping.focusTab3.global));
	useHotkeys(hotkeyMapping.focusTab4.key, createHandler(handlers.onFocusTab4), createHotkeyOptions(hotkeyMapping.focusTab4.global));
	useHotkeys(hotkeyMapping.focusTab5.key, createHandler(handlers.onFocusTab5), createHotkeyOptions(hotkeyMapping.focusTab5.global));
	useHotkeys(hotkeyMapping.focusTab6.key, createHandler(handlers.onFocusTab6), createHotkeyOptions(hotkeyMapping.focusTab6.global));
	useHotkeys(hotkeyMapping.focusTab7.key, createHandler(handlers.onFocusTab7), createHotkeyOptions(hotkeyMapping.focusTab7.global));
	useHotkeys(hotkeyMapping.focusTab8.key, createHandler(handlers.onFocusTab8), createHotkeyOptions(hotkeyMapping.focusTab8.global));
	useHotkeys(hotkeyMapping.focusTab9.key, createHandler(handlers.onFocusTab9), createHotkeyOptions(hotkeyMapping.focusTab9.global));

	// Tab navigation
	useHotkeys(hotkeyMapping.focusNextTab.key, createHandler(handlers.onFocusNextTab), createHotkeyOptions(hotkeyMapping.focusNextTab.global));
	useHotkeys(hotkeyMapping.focusPreviousTab.key, createHandler(handlers.onFocusPreviousTab), createHotkeyOptions(hotkeyMapping.focusPreviousTab.global));

	// App hotkeys
	useHotkeys(hotkeyMapping.refreshApp.key, createHandler(handlers.onRefreshApp), createHotkeyOptions(hotkeyMapping.refreshApp.global));

	// Future hotkey categories can be added here:

	// Editor hotkeys - Use restrictedHotkeyOptions to avoid conflicts with text editing
	// useHotkeys('ctrl+s', () => onSave?.(), restrictedHotkeyOptions);
	// useHotkeys('ctrl+z', () => onUndo?.(), restrictedHotkeyOptions);
	// useHotkeys('ctrl+y', () => onRedo?.(), restrictedHotkeyOptions);

	// Navigation hotkeys - Can be global since they're not text-editing related
	// useHotkeys('ctrl+1', () => onFocusEditor?.(), globalHotkeyOptions);
	// useHotkeys('ctrl+shift+e', () => onFocusSidebar?.(), globalHotkeyOptions);

	// Notes hotkeys - Usually safe to be global
	// useHotkeys('ctrl+n', () => onNewNote?.(), globalHotkeyOptions);
	// useHotkeys('delete', () => onDeleteNote?.(), restrictedHotkeyOptions); // Avoid accidental deletions while typing
}
