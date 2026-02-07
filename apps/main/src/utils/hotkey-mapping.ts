import type { AppHotkeysProps } from "@/types";
import { getTreeViewCallbacks } from "@/atoms/tree";

/**
 * Maps useHotkeyHandlers return value to AppHotkeysProps format
 * This fixes the naming mismatch between handler names and prop names
 */
export function mapHotkeyHandlers(
	sidebar: { toggle: () => void; collapsed: boolean; setCollapsed: (collapsed: boolean) => void },
	views: { toggleActivityBar: () => void },
	handlers: {
		closeActiveTab: () => void;
		reopenLastClosedTab: () => void;
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
		focusNextSpawnedTab: () => void;
		focusPreviousSpawnedTab: () => void;
		toggleEditorView: () => void;
		toggleLineWrapping: () => void;
		toggleToolbar: () => void;
		toggleTitleBar: () => void;
		toggleActivityBarExpanded: () => void;
		toggleTabBar: () => void;
		increaseFontSize: () => void;
		decreaseFontSize: () => void;
		createNoteInRoot: () => void;
		openLocationDialog: () => void;
		openSettings: () => void;
		openHotkeys: () => void;
		showQuickHotkeys: () => void;
		openQuickSearch: () => void;
		openSearchSidebar: () => void;
	}
): AppHotkeysProps {
	return {
		// Layout hotkeys
		onToggleSidebar: sidebar.toggle,
		onToggleActivityBar: views.toggleActivityBar,
		onExpandActivityBar: handlers.toggleActivityBarExpanded,
		// Tab hotkeys
		onCloseTab: handlers.closeActiveTab,
		onReopenLastClosedTab: handlers.reopenLastClosedTab,
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
		onFocusNextSpawnedTab: handlers.focusNextSpawnedTab,
		onFocusPreviousSpawnedTab: handlers.focusPreviousSpawnedTab,
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
		onFocusEditor: () => {
			// Focus the ProseMirror editor
			const prosemirror = document.querySelector('.ProseMirror') as HTMLElement | null;
			if (prosemirror) {
				prosemirror.focus();
			} else {
				// Try CodeMirror editor as fallback (source view)
				const codemirror = document.querySelector('.cm-editor .cm-content') as HTMLElement | null;
				if (codemirror) {
					codemirror.focus();
				}
			}
		},
		onToggleEditorTreeFocus: () => {
			// Check if focus is currently in tree view
			const treeContainer = document.querySelector('[data-tree-container="true"]');
			const activeElement = document.activeElement;
			const isInTreeView = treeContainer?.contains(activeElement);
			
			if (isInTreeView) {
				// Focus is in tree view, move to editor
				const prosemirror = document.querySelector('.ProseMirror') as HTMLElement | null;
				if (prosemirror) {
					prosemirror.focus();
				} else {
					const codemirror = document.querySelector('.cm-editor .cm-content') as HTMLElement | null;
					if (codemirror) {
						codemirror.focus();
					}
				}
			} else {
				// Focus is elsewhere, move to tree view
				if (sidebar.collapsed) {
					sidebar.setCollapsed(false);
					requestAnimationFrame(() => {
						const container = document.querySelector('[data-tree-container="true"]');
						if (!container) return;
						const previouslyFocused = container.querySelector('button[role="treeitem"][tabindex="0"]') as HTMLElement | null;
						if (previouslyFocused) {
							previouslyFocused.focus();
						} else {
							const firstItem = container.querySelector('button[role="treeitem"]') as HTMLElement | null;
							if (firstItem) firstItem.focus();
						}
					});
				} else {
					if (!treeContainer) return;
					const previouslyFocused = treeContainer.querySelector('button[role="treeitem"][tabindex="0"]') as HTMLElement | null;
					if (previouslyFocused) {
						previouslyFocused.focus();
					} else {
						const firstItem = treeContainer.querySelector('button[role="treeitem"]') as HTMLElement | null;
						if (firstItem) firstItem.focus();
					}
				}
			}
		},
		onFocusEditorTitle: () => {
			// Focus the note title input
			const titleInput = document.querySelector('[data-note-title]') as HTMLElement | null;
			if (titleInput) {
				titleInput.focus();
			}
		},
		onFocusToolbar: () => {
			// Focus the first button in the editor toolbar
			const toolbar = document.querySelector('[data-editor-toolbar]');
			if (!toolbar) return;
			const firstButton = toolbar.querySelector('button') as HTMLElement | null;
			if (firstButton) {
				firstButton.focus();
			}
		},
		onFocusTabBar: () => {
			// Focus the first tab in the tab bar
			const tabBar = document.querySelector('[data-tab-bar]');
			if (!tabBar) return;
			// Find the active tab first, or fall back to first tab
			const activeTab = tabBar.querySelector('button[data-active="true"]') as HTMLElement | null;
			if (activeTab) {
				activeTab.focus();
			} else {
				const firstTab = tabBar.querySelector('button') as HTMLElement | null;
				if (firstTab) {
					firstTab.focus();
				}
			}
		},
		// Tab bar visibility
		onToggleTabBar: handlers.toggleTabBar,
		// Notes hotkeys
		onNewNote: handlers.createNoteInRoot,
		onNewNoteWithLocation: handlers.openLocationDialog,
		// App hotkeys
		onRefreshApp: () => window.location.reload(),
		// Editor hotkeys
		onToggleEditorView: handlers.toggleEditorView,
		onToggleLineWrapping: handlers.toggleLineWrapping,
		onToggleToolbar: handlers.toggleToolbar,
		onToggleTitleBar: handlers.toggleTitleBar,
		onIncreaseFontSize: handlers.increaseFontSize,
		onDecreaseFontSize: handlers.decreaseFontSize,
		// Views hotkeys
		onOpenSettings: handlers.openSettings,
		onOpenHotkeys: handlers.openHotkeys,
		onShowQuickHotkeys: handlers.showQuickHotkeys,
		// Search hotkeys
		onQuickSearch: handlers.openQuickSearch,
		onFullTextSearch: handlers.openSearchSidebar,
		// Tree view hotkeys
		onRevealActiveInTree: () => {
			const callbacks = getTreeViewCallbacks();
			if (callbacks?.revealActiveInTree) {
				callbacks.revealActiveInTree();
			}
		},
		onToggleHoist: () => {
			const callbacks = getTreeViewCallbacks();
			if (callbacks?.toggleHoist) {
				callbacks.toggleHoist();
			}
		},
	};
}
