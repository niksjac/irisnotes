import { useHotkeys } from "react-hotkeys-hook";
import { useHotkeysConfig } from "./use-hotkeys-config";
import type { AppHotkeysProps } from "@/types";

/**
 * Centralized app-wide hotkeys hook
 * Add new hotkey categories here as the app grows
 */
export function useAppHotkeys({
	// Layout hotkeys
	onToggleSidebar,
	onToggleActivityBar,
	// Tab hotkeys
	onCloseTab,
	onNewTab,
	onMoveTabLeft,
	onMoveTabRight,
	// Pane hotkeys
	onToggleDualPane,
	onPaneResizeLeft,
	onPaneResizeRight,
	// Sidebar resizing hotkeys
	onSidebarResizeLeft,
	onSidebarResizeRight,
	// Pane focus hotkeys
	onFocusPane1,
	onFocusPane2,
	// Tab movement between panes hotkeys
	onMoveTabToPaneLeft,
	onMoveTabToPaneRight,
	// Tab focus by number hotkeys
	onFocusTab1,
	onFocusTab2,
	onFocusTab3,
	onFocusTab4,
	onFocusTab5,
	onFocusTab6,
	onFocusTab7,
	onFocusTab8,
	onFocusTab9,
	// Tab navigation hotkeys
	onFocusNextTab,
	onFocusPreviousTab,
}: AppHotkeysProps) {
	// Get user's hotkey configuration
	const { hotkeys: hotkeyMapping } = useHotkeysConfig();

	// Create hotkey options based on global setting
	const createHotkeyOptions = (global: boolean = true) => ({
		preventDefault: true,
		enableOnContentEditable: global,
		enableOnFormTags: global,
	});

	// Restricted hotkeys that should NOT work in form fields to avoid conflicts
	// const restrictedHotkeyOptions = {
	// 	preventDefault: true,
	// 	enableOnContentEditable: false,
	// 	enableOnFormTags: false,
	// };

	// Layout hotkeys - Use configurable keys
	useHotkeys(hotkeyMapping.toggleSidebar.key, () => onToggleSidebar?.(), createHotkeyOptions(hotkeyMapping.toggleSidebar.global));
	useHotkeys(hotkeyMapping.toggleActivityBar.key, () => onToggleActivityBar?.(), createHotkeyOptions(hotkeyMapping.toggleActivityBar.global));

	// Tab hotkeys - Use configurable keys
	useHotkeys(hotkeyMapping.closeTab.key, () => onCloseTab?.(), createHotkeyOptions(hotkeyMapping.closeTab.global));
	useHotkeys(hotkeyMapping.newTab.key, () => onNewTab?.(), createHotkeyOptions(hotkeyMapping.newTab.global));
	useHotkeys(hotkeyMapping.moveTabLeft.key, () => onMoveTabLeft?.(), createHotkeyOptions(hotkeyMapping.moveTabLeft.global));
	useHotkeys(hotkeyMapping.moveTabRight.key, () => onMoveTabRight?.(), createHotkeyOptions(hotkeyMapping.moveTabRight.global));

	// Pane hotkeys - Use configurable keys (disabled on mobile)
	useHotkeys(hotkeyMapping.toggleDualPane.key, () => {
		const isMobile = window.innerWidth < 768; // md breakpoint
		if (!isMobile) {
			onToggleDualPane?.();
		}
	}, createHotkeyOptions(hotkeyMapping.toggleDualPane.global));
	useHotkeys(hotkeyMapping.paneResizeLeft.key, () => {
		const isMobile = window.innerWidth < 768;
		if (!isMobile) {
			onPaneResizeLeft?.();
		}
	}, createHotkeyOptions(hotkeyMapping.paneResizeLeft.global));
	useHotkeys(hotkeyMapping.paneResizeRight.key, () => {
		const isMobile = window.innerWidth < 768;
		if (!isMobile) {
			onPaneResizeRight?.();
		}
	}, createHotkeyOptions(hotkeyMapping.paneResizeRight.global));

	// Sidebar resizing hotkeys - Use configurable keys
	useHotkeys(hotkeyMapping.sidebarResizeLeft.key, () => onSidebarResizeLeft?.(), createHotkeyOptions(hotkeyMapping.sidebarResizeLeft.global));
	useHotkeys(hotkeyMapping.sidebarResizeRight.key, () => onSidebarResizeRight?.(), createHotkeyOptions(hotkeyMapping.sidebarResizeRight.global));

	// Pane focus hotkeys - Use configurable keys
	useHotkeys(hotkeyMapping.focusPane1.key, () => onFocusPane1?.(), createHotkeyOptions(hotkeyMapping.focusPane1.global));
	useHotkeys(hotkeyMapping.focusPane2.key, () => onFocusPane2?.(), createHotkeyOptions(hotkeyMapping.focusPane2.global));

	// Tab movement between panes hotkeys - Use configurable keys
	useHotkeys(hotkeyMapping.moveTabToPaneLeft.key, () => onMoveTabToPaneLeft?.(), createHotkeyOptions(hotkeyMapping.moveTabToPaneLeft.global));
	useHotkeys(hotkeyMapping.moveTabToPaneRight.key, () => onMoveTabToPaneRight?.(), createHotkeyOptions(hotkeyMapping.moveTabToPaneRight.global));

	// Tab focus by number hotkeys - Use configurable keys
	useHotkeys(hotkeyMapping.focusTab1.key, () => onFocusTab1?.(), createHotkeyOptions(hotkeyMapping.focusTab1.global));
	useHotkeys(hotkeyMapping.focusTab2.key, () => onFocusTab2?.(), createHotkeyOptions(hotkeyMapping.focusTab2.global));
	useHotkeys(hotkeyMapping.focusTab3.key, () => onFocusTab3?.(), createHotkeyOptions(hotkeyMapping.focusTab3.global));
	useHotkeys(hotkeyMapping.focusTab4.key, () => onFocusTab4?.(), createHotkeyOptions(hotkeyMapping.focusTab4.global));
	useHotkeys(hotkeyMapping.focusTab5.key, () => onFocusTab5?.(), createHotkeyOptions(hotkeyMapping.focusTab5.global));
	useHotkeys(hotkeyMapping.focusTab6.key, () => onFocusTab6?.(), createHotkeyOptions(hotkeyMapping.focusTab6.global));
	useHotkeys(hotkeyMapping.focusTab7.key, () => onFocusTab7?.(), createHotkeyOptions(hotkeyMapping.focusTab7.global));
	useHotkeys(hotkeyMapping.focusTab8.key, () => onFocusTab8?.(), createHotkeyOptions(hotkeyMapping.focusTab8.global));
	useHotkeys(hotkeyMapping.focusTab9.key, () => onFocusTab9?.(), createHotkeyOptions(hotkeyMapping.focusTab9.global));

	// Tab navigation hotkeys - Use configurable keys
	useHotkeys(hotkeyMapping.focusNextTab.key, () => onFocusNextTab?.(), createHotkeyOptions(hotkeyMapping.focusNextTab.global));
	useHotkeys(hotkeyMapping.focusPreviousTab.key, () => onFocusPreviousTab?.(), createHotkeyOptions(hotkeyMapping.focusPreviousTab.global));

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
