import { useHotkeys } from "react-hotkeys-hook";
import { useAtom } from "jotai";
import { useHotkeysConfig } from "./use-hotkeys-config";
import type { AppHotkeysProps } from "@/types";
import { editorSettingsAtom } from "@/atoms/settings";
import { EDITOR_SETTINGS_CONSTRAINTS } from "@/types/editor-settings";

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
		enableOnFormTags: global ? ["INPUT", "TEXTAREA", "SELECT"] as const : false as const,
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
	useHotkeys(
		hotkeyMapping.expandActivityBar.key,
		createHandler(handlers.onExpandActivityBar),
		createHotkeyOptions(hotkeyMapping.expandActivityBar.global)
	);
	useHotkeys(
		hotkeyMapping.toggleZenMode.key,
		createHandler(handlers.onToggleZenMode),
		createHotkeyOptions(hotkeyMapping.toggleZenMode.global)
	);

	// Tab hotkeys
	useHotkeys(
		hotkeyMapping.closeTab.key,
		createHandler(handlers.onCloseTab),
		createHotkeyOptions(hotkeyMapping.closeTab.global)
	);
	useHotkeys(
		hotkeyMapping.reopenLastClosedTab.key,
		createHandler(handlers.onReopenLastClosedTab),
		createHotkeyOptions(hotkeyMapping.reopenLastClosedTab.global)
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
		hotkeyMapping.toggleTitleBar.key,
		createHandler(handlers.onToggleTitleBar),
		createHotkeyOptions(hotkeyMapping.toggleTitleBar.global)
	);
	// Focus hotkeys
	useHotkeys(
		hotkeyMapping.focusTreeView.key,
		createHandler(handlers.onFocusTreeView),
		createHotkeyOptions(hotkeyMapping.focusTreeView.global)
	);
	useHotkeys(
		hotkeyMapping.focusEditor.key,
		createHandler(handlers.onFocusEditor),
		createHotkeyOptions(hotkeyMapping.focusEditor.global)
	);
	useHotkeys(
		hotkeyMapping.toggleEditorTreeFocus.key,
		createHandler(handlers.onToggleEditorTreeFocus),
		createHotkeyOptions(hotkeyMapping.toggleEditorTreeFocus.global)
	);
	useHotkeys(
		hotkeyMapping.focusEditorTitle.key,
		createHandler(handlers.onFocusEditorTitle),
		createHotkeyOptions(hotkeyMapping.focusEditorTitle.global)
	);
	useHotkeys(
		hotkeyMapping.focusToolbar.key,
		createHandler(handlers.onFocusToolbar),
		createHotkeyOptions(hotkeyMapping.focusToolbar.global)
	);
	useHotkeys(
		hotkeyMapping.focusTabBar.key,
		createHandler(handlers.onFocusTabBar),
		createHotkeyOptions(hotkeyMapping.focusTabBar.global)
	);

	// Tab bar visibility
	useHotkeys(
		hotkeyMapping.toggleTabBar.key,
		createHandler(handlers.onToggleTabBar),
		createHotkeyOptions(hotkeyMapping.toggleTabBar.global)
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
	useHotkeys(
		hotkeyMapping.newBook.key,
		createHandler(handlers.onNewBook),
		createHotkeyOptions(hotkeyMapping.newBook.global)
	);
	useHotkeys(
		hotkeyMapping.newSection.key,
		createHandler(handlers.onNewSection),
		createHotkeyOptions(hotkeyMapping.newSection.global)
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
	useHotkeys(
		hotkeyMapping.openBranding.key,
		createHandler(handlers.onOpenBranding),
		createHotkeyOptions(hotkeyMapping.openBranding.global)
	);
	useHotkeys(
		hotkeyMapping.showQuickHotkeys.key,
		createHandler(handlers.onShowQuickHotkeys),
		createHotkeyOptions(hotkeyMapping.showQuickHotkeys.global)
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
	useHotkeys(
		hotkeyMapping.openThemeSwitcher.key,
		createHandler(handlers.onOpenThemeSwitcher),
		createHotkeyOptions(hotkeyMapping.openThemeSwitcher.global)
	);
	useHotkeys(
		hotkeyMapping.openSymbolPicker.key,
		createHandler(handlers.onOpenSymbolPicker),
		createHotkeyOptions(hotkeyMapping.openSymbolPicker.global)
	);
	useHotkeys(
		hotkeyMapping.openNerdFontPicker.key,
		createHandler(handlers.onOpenNerdFontPicker),
		createHotkeyOptions(hotkeyMapping.openNerdFontPicker.global)
	);

	// Tree view hotkeys
	useHotkeys(
		hotkeyMapping.revealActiveInTree.key,
		createHandler(handlers.onRevealActiveInTree),
		createHotkeyOptions(hotkeyMapping.revealActiveInTree.global)
	);
	useHotkeys(
		hotkeyMapping.toggleHoist.key,
		createHandler(handlers.onToggleHoist),
		createHotkeyOptions(hotkeyMapping.toggleHoist.global)
	);

	// Config folder
	useHotkeys(
		hotkeyMapping.openConfigFolder.key,
		createHandler(handlers.onOpenConfigFolder),
		createHotkeyOptions(hotkeyMapping.openConfigFolder.global)
	);

	// Editor spacing hotkeys (directly mutate editorSettingsAtom)
	const [, setEditorSettings] = useAtom(editorSettingsAtom);
	const c = EDITOR_SETTINGS_CONSTRAINTS;
	const clamp = (v: number, min: number, max: number) =>
		Math.round(Math.max(min, Math.min(max, v)) * 1000) / 1000;

	useHotkeys(
		hotkeyMapping.increaseLineHeight.key,
		() => setEditorSettings((s) => s ? { ...s, lineHeight: clamp(s.lineHeight + c.lineHeight.step, c.lineHeight.min, c.lineHeight.max) } : s),
		createHotkeyOptions(hotkeyMapping.increaseLineHeight.global)
	);
	useHotkeys(
		hotkeyMapping.decreaseLineHeight.key,
		() => setEditorSettings((s) => s ? { ...s, lineHeight: clamp(s.lineHeight - c.lineHeight.step, c.lineHeight.min, c.lineHeight.max) } : s),
		createHotkeyOptions(hotkeyMapping.decreaseLineHeight.global)
	);
	useHotkeys(
		hotkeyMapping.increaseLetterSpacing.key,
		() => setEditorSettings((s) => s ? { ...s, letterSpacing: clamp(s.letterSpacing + c.letterSpacing.step, c.letterSpacing.min, c.letterSpacing.max) } : s),
		createHotkeyOptions(hotkeyMapping.increaseLetterSpacing.global)
	);
	useHotkeys(
		hotkeyMapping.decreaseLetterSpacing.key,
		() => setEditorSettings((s) => s ? { ...s, letterSpacing: clamp(s.letterSpacing - c.letterSpacing.step, c.letterSpacing.min, c.letterSpacing.max) } : s),
		createHotkeyOptions(hotkeyMapping.decreaseLetterSpacing.global)
	);
	useHotkeys(
		hotkeyMapping.increaseParagraphSpacing.key,
		() => setEditorSettings((s) => s ? { ...s, paragraphSpacing: clamp(s.paragraphSpacing + c.paragraphSpacing.step, c.paragraphSpacing.min, c.paragraphSpacing.max) } : s),
		createHotkeyOptions(hotkeyMapping.increaseParagraphSpacing.global)
	);
	useHotkeys(
		hotkeyMapping.decreaseParagraphSpacing.key,
		() => setEditorSettings((s) => s ? { ...s, paragraphSpacing: clamp(s.paragraphSpacing - c.paragraphSpacing.step, c.paragraphSpacing.min, c.paragraphSpacing.max) } : s),
		createHotkeyOptions(hotkeyMapping.decreaseParagraphSpacing.global)
	);
}
