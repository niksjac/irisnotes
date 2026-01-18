import type { AppHotkeysProps } from "@/types";

/**
 * Maps useHotkeyHandlers return value to AppHotkeysProps format
 * This fixes the naming mismatch between handler names and prop names
 */
export function mapHotkeyHandlers(
	sidebar: { toggle: () => void; collapsed: boolean; setCollapsed: (collapsed: boolean) => void },
	views: { toggleActivityBar: () => void },
	handlers: {
		closeActiveTab: () => void;
		newTabInActivePane: () => void;
		moveActiveTabLeft: () => void;
		moveActiveTabRight: () => void;
		toggleDualPane: () => void;
		resizePaneLeft: () => void;
		resizePaneRight: () => void;
		resizeSidebarLeft: () => void;
		resizeSidebarRight: () => void;
		focusPane1: () => void;
		focusPane2: () => void;
		moveTabToPaneLeft: () => void;
		moveTabToPaneRight: () => void;
		focusTab1: () => void;
		focusTab2: () => void;
		focusTab3: () => void;
		focusTab4: () => void;
		focusTab5: () => void;
		focusTab6: () => void;
		focusTab7: () => void;
		focusTab8: () => void;
		focusTab9: () => void;
		focusNextTab: () => void;
		focusPreviousTab: () => void;
		toggleEditorView: () => void;
		toggleLineWrapping: () => void;
		toggleToolbar: () => void;
		increaseFontSize: () => void;
		decreaseFontSize: () => void;
		createNoteInRoot: () => void;
		openLocationDialog: () => void;
		openSettings: () => void;
		openHotkeys: () => void;
		openQuickSearch: () => void;
		openSearchSidebar: () => void;
	}
): AppHotkeysProps {
	return {
		// Layout hotkeys
		onToggleSidebar: sidebar.toggle,
		onToggleActivityBar: views.toggleActivityBar,
		// Tab hotkeys
		onCloseTab: handlers.closeActiveTab,
		onNewTab: handlers.newTabInActivePane,
		onMoveTabLeft: handlers.moveActiveTabLeft,
		onMoveTabRight: handlers.moveActiveTabRight,
		// Pane hotkeys
		onToggleDualPane: handlers.toggleDualPane,
		onPaneResizeLeft: handlers.resizePaneLeft,
		onPaneResizeRight: handlers.resizePaneRight,
		// Sidebar resizing hotkeys
		onSidebarResizeLeft: handlers.resizeSidebarLeft,
		onSidebarResizeRight: handlers.resizeSidebarRight,
		// Pane focus hotkeys
		onFocusPane1: handlers.focusPane1,
		onFocusPane2: handlers.focusPane2,
		// Tab movement between panes hotkeys
		onMoveTabToPaneLeft: handlers.moveTabToPaneLeft,
		onMoveTabToPaneRight: handlers.moveTabToPaneRight,
		// Tab focus by number hotkeys
		onFocusTab1: handlers.focusTab1,
		onFocusTab2: handlers.focusTab2,
		onFocusTab3: handlers.focusTab3,
		onFocusTab4: handlers.focusTab4,
		onFocusTab5: handlers.focusTab5,
		onFocusTab6: handlers.focusTab6,
		onFocusTab7: handlers.focusTab7,
		onFocusTab8: handlers.focusTab8,
		onFocusTab9: handlers.focusTab9,
		// Tab navigation hotkeys
		onFocusNextTab: handlers.focusNextTab,
		onFocusPreviousTab: handlers.focusPreviousTab,
		// Focus hotkeys
		onFocusTreeView: () => {
			// Open sidebar if collapsed
			if (sidebar.collapsed) {
				sidebar.setCollapsed(false);
				// Wait for sidebar to open before focusing
				requestAnimationFrame(() => {
					const treeContainer = document.querySelector('[data-tree-container="true"]');
					if (!treeContainer) return;
					// Try previously focused item first (roving tabindex pattern)
					const previouslyFocused = treeContainer.querySelector('button[role="treeitem"][tabindex="0"]') as HTMLElement | null;
					if (previouslyFocused) {
						previouslyFocused.focus();
					} else {
						const firstItem = treeContainer.querySelector('button[role="treeitem"]') as HTMLElement | null;
						if (firstItem) {
							firstItem.focus();
						}
					}
				});
			} else {
				const treeContainer = document.querySelector('[data-tree-container="true"]');
				if (!treeContainer) return;
				// Try previously focused item first (roving tabindex pattern)
				const previouslyFocused = treeContainer.querySelector('button[role="treeitem"][tabindex="0"]') as HTMLElement | null;
				if (previouslyFocused) {
					previouslyFocused.focus();
				} else {
					const firstItem = treeContainer.querySelector('button[role="treeitem"]') as HTMLElement | null;
					if (firstItem) {
						firstItem.focus();
					}
				}
			}
		},
		// Notes hotkeys
		onNewNote: handlers.createNoteInRoot,
		onNewNoteWithLocation: handlers.openLocationDialog,
		// App hotkeys
		onRefreshApp: () => window.location.reload(),
		// Editor hotkeys
		onToggleEditorView: handlers.toggleEditorView,
		onToggleLineWrapping: handlers.toggleLineWrapping,
		onToggleToolbar: handlers.toggleToolbar,
		onIncreaseFontSize: handlers.increaseFontSize,
		onDecreaseFontSize: handlers.decreaseFontSize,
		// Views hotkeys
		onOpenSettings: handlers.openSettings,
		onOpenHotkeys: handlers.openHotkeys,
		// Search hotkeys
		onQuickSearch: handlers.openQuickSearch,
		onFullTextSearch: handlers.openSearchSidebar,
	};
}
