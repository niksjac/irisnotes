import { useSetAtom } from "jotai";
import { invoke } from "@tauri-apps/api/core";
import {
	closeActiveTabAtom,
	reopenLastClosedTabAtom,
	moveActiveTabLeftAtom,
	moveActiveTabRightAtom,
	toggleDualPaneModeAtom,
	resizePaneLeftAtom,
	resizePaneRightAtom,
	resizeSidebarLeftAtom,
	resizeSidebarRightAtom,
	focusPane1Atom,
	focusPane2Atom,
	moveTabToPaneLeftAtom,
	moveTabToPaneRightAtom,
	focusNextTabAtom,
	focusPreviousTabAtom,
	focusNextSpawnedTabAtom,
	focusPreviousSpawnedTabAtom,
	openSettingsTabAtom,
	openHotkeysTabAtom,
	openBrandingTabAtom,
	openQuickSearchAtom,
	openSearchSidebarAtom,
	sidebarCollapsed,
	toggleTabBarAtom,
	toggleWindowTitleBarAtom,
	toggleAppToolbarAtom,
	toggleStatusBarAtom,
	toggleNoteConfigBarAtom,
	showQuickHotkeysAtom,
	toggleZenModeAtom,
	openThemeSwitcherAtom,
	openSymbolPickerAtom,
	openNerdFontPickerAtom,
	openActionPaletteAtom,
	openTabPaletteAtom,
} from "@/atoms";
import { useEditorViewToggle } from "./use-editor-view-toggle";
import { useLineWrapping } from "./use-line-wrapping";
import { useEditorLayout } from "./use-editor-layout";
import { useNoteActions } from "./use-note-actions";

/**
 * Hook that provides all hotkey handler functions
 * Encapsulates all the atom setters for cleaner component code
 */
export function useHotkeyHandlers() {
	const { toggleEditorView } = useEditorViewToggle();
	const { toggleLineWrapping } = useLineWrapping();
	const { toggleToolbar, toggleTitleBar, toggleMetadataBar } = useEditorLayout();
	const { createNoteInRoot, openLocationDialog, openNewBookDialog, openNewSectionDialog } = useNoteActions();
	// Tab actions
	const closeActiveTab = useSetAtom(closeActiveTabAtom);
	const reopenLastClosedTab = useSetAtom(reopenLastClosedTabAtom);
	const moveActiveTabLeft = useSetAtom(moveActiveTabLeftAtom);
	const moveActiveTabRight = useSetAtom(moveActiveTabRightAtom);

	// Pane actions
	const toggleDualPane = useSetAtom(toggleDualPaneModeAtom);
	const resizePaneLeft = useSetAtom(resizePaneLeftAtom);
	const resizePaneRight = useSetAtom(resizePaneRightAtom);

	// Sidebar actions
	const resizeSidebarLeft = useSetAtom(resizeSidebarLeftAtom);
	const resizeSidebarRight = useSetAtom(resizeSidebarRightAtom);

	// Pane focus actions
	const focusPane1 = useSetAtom(focusPane1Atom);
	const focusPane2 = useSetAtom(focusPane2Atom);

	// Tab movement between panes
	const moveTabToPaneLeft = useSetAtom(moveTabToPaneLeftAtom);
	const moveTabToPaneRight = useSetAtom(moveTabToPaneRightAtom);

	// Tab navigation
	const focusNextTab = useSetAtom(focusNextTabAtom);
	const focusPreviousTab = useSetAtom(focusPreviousTabAtom);
	const focusNextSpawnedTab = useSetAtom(focusNextSpawnedTabAtom);
	const focusPreviousSpawnedTab = useSetAtom(focusPreviousSpawnedTabAtom);

	return {
		// Tab actions
		closeActiveTab,
		reopenLastClosedTab,
		moveActiveTabLeft,
		moveActiveTabRight,

		// Pane actions
		toggleDualPane,
		resizePaneLeft,
		resizePaneRight,

		// Sidebar actions
		resizeSidebarLeft,
		resizeSidebarRight,

		// Pane focus
		focusPane1,
		focusPane2,

		// Tab movement between panes
		moveTabToPaneLeft,
		moveTabToPaneRight,

		// Tab navigation
		focusNextTab,
		focusPreviousTab,
		focusNextSpawnedTab,
		focusPreviousSpawnedTab,

		// Editor view toggle
		toggleEditorView,
		toggleLineWrapping,
		toggleToolbar,
		toggleTitleBar,

		// Layout toggles
		toggleWindowTitleBar: useSetAtom(toggleWindowTitleBarAtom),
		toggleAppToolbar: useSetAtom(toggleAppToolbarAtom),
		toggleStatusBar: useSetAtom(toggleStatusBarAtom),
		toggleMetadataBar,
		toggleNoteConfigBar: useSetAtom(toggleNoteConfigBarAtom),
		toggleTabBar: useSetAtom(toggleTabBarAtom),

		// Zen mode
		toggleZenMode: useSetAtom(toggleZenModeAtom),

		// Note actions
		createNoteInRoot,
		openLocationDialog,
		openNewBookDialog,
		openNewSectionDialog,

		// View actions
		openSettings: useSetAtom(openSettingsTabAtom),
		openHotkeys: useSetAtom(openHotkeysTabAtom),
		openBranding: useSetAtom(openBrandingTabAtom),
		showQuickHotkeys: useSetAtom(showQuickHotkeysAtom),
		openThemeSwitcher: useSetAtom(openThemeSwitcherAtom),
		openSymbolPicker: useSetAtom(openSymbolPickerAtom),
		openNerdFontPicker: useSetAtom(openNerdFontPickerAtom),

		// Config folder
		openConfigFolder: () => {
			invoke("open_app_config_folder").catch(console.error);
		},

		// Search actions
		openQuickSearch: useSetAtom(openQuickSearchAtom),
		openSearchSidebar: useOpenSearchSidebar(),

		// Command / tab palettes
		openCommandPalette: useSetAtom(openActionPaletteAtom),
		openTabPalette: useSetAtom(openTabPaletteAtom),
	};
}

/**
 * Custom hook to open search sidebar and ensure sidebar is visible
 */
function useOpenSearchSidebar() {
	const openSearchSidebar = useSetAtom(openSearchSidebarAtom);
	const setSidebarCollapsed = useSetAtom(sidebarCollapsed);

	return () => {
		// Ensure sidebar is visible when opening search
		setSidebarCollapsed(false);
		openSearchSidebar();
	};
}
