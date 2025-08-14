import { useHotkeys } from "react-hotkeys-hook";

interface AppHotkeysProps {
	// Layout hotkeys
	onToggleSidebar?: () => void;
	onToggleActivityBar?: () => void;

	// Tab hotkeys
	onCloseTab?: () => void;
	onNewTab?: () => void;
	onMoveTabLeft?: () => void;
	onMoveTabRight?: () => void;

	// Pane hotkeys
	onToggleDualPane?: () => void;
	onPaneResizeLeft?: () => void;
	onPaneResizeRight?: () => void;

	// Sidebar resizing hotkeys
	onSidebarResizeLeft?: () => void;
	onSidebarResizeRight?: () => void;

	// Pane focus hotkeys
	onFocusPane1?: () => void;
	onFocusPane2?: () => void;

	// Tab movement between panes hotkeys
	onMoveTabToPaneLeft?: () => void;
	onMoveTabToPaneRight?: () => void;

	// Tab focus by number hotkeys
	onFocusTab1?: () => void;
	onFocusTab2?: () => void;
	onFocusTab3?: () => void;
	onFocusTab4?: () => void;
	onFocusTab5?: () => void;
	onFocusTab6?: () => void;
	onFocusTab7?: () => void;
	onFocusTab8?: () => void;
	onFocusTab9?: () => void;

	// Editor hotkeys (future)
	// onSave?: () => void;
	// onUndo?: () => void;
	// onRedo?: () => void;

	// Navigation hotkeys (future)
	// onFocusEditor?: () => void;
	// onFocusSidebar?: () => void;

	// Notes hotkeys (future)
	// onNewNote?: () => void;
	// onDeleteNote?: () => void;
}

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
}: AppHotkeysProps) {
	// Global hotkeys that should work everywhere (including form fields)
	const globalHotkeyOptions = {
		preventDefault: true,
		enableOnContentEditable: true,
		enableOnFormTags: true,
	};

	// Restricted hotkeys that should NOT work in form fields to avoid conflicts
	// const restrictedHotkeyOptions = {
	// 	preventDefault: true,
	// 	enableOnContentEditable: false,
	// 	enableOnFormTags: false,
	// };

	// Layout hotkeys - These should be global since they don't interfere with text input
	useHotkeys("ctrl+b", () => onToggleSidebar?.(), globalHotkeyOptions);
	useHotkeys("ctrl+j", () => onToggleActivityBar?.(), globalHotkeyOptions);

	// Tab hotkeys - Global since they're UI navigation
	useHotkeys("ctrl+w", () => onCloseTab?.(), globalHotkeyOptions);
	useHotkeys("ctrl+t", () => onNewTab?.(), globalHotkeyOptions);
	useHotkeys("ctrl+shift+alt+left", () => onMoveTabLeft?.(), globalHotkeyOptions);
	useHotkeys("ctrl+shift+alt+right", () => onMoveTabRight?.(), globalHotkeyOptions);

	// Pane hotkeys - Global UI navigation (disabled on mobile)
	useHotkeys("ctrl+d", () => {
		const isMobile = window.innerWidth < 768; // md breakpoint
		if (!isMobile) {
			onToggleDualPane?.();
		}
	}, globalHotkeyOptions);
	useHotkeys("alt+left", () => {
		const isMobile = window.innerWidth < 768;
		if (!isMobile) {
			onPaneResizeLeft?.();
		}
	}, globalHotkeyOptions);
	useHotkeys("alt+right", () => {
		const isMobile = window.innerWidth < 768;
		if (!isMobile) {
			onPaneResizeRight?.();
		}
	}, globalHotkeyOptions);

	// Sidebar resizing hotkeys - Global since they're layout controls
	useHotkeys("ctrl+left", () => onSidebarResizeLeft?.(), globalHotkeyOptions);
	useHotkeys("ctrl+right", () => onSidebarResizeRight?.(), globalHotkeyOptions);

	// Pane focus hotkeys - Global UI navigation
	useHotkeys("ctrl+alt+1", () => onFocusPane1?.(), globalHotkeyOptions);
	useHotkeys("ctrl+alt+2", () => onFocusPane2?.(), globalHotkeyOptions);

	// Tab movement between panes hotkeys - Global since they're UI navigation
	useHotkeys("ctrl+alt+left", () => onMoveTabToPaneLeft?.(), globalHotkeyOptions);
	useHotkeys("ctrl+alt+right", () => onMoveTabToPaneRight?.(), globalHotkeyOptions);

	// Tab focus by number hotkeys - Global since they're navigation
	useHotkeys("ctrl+1", () => onFocusTab1?.(), globalHotkeyOptions);
	useHotkeys("ctrl+2", () => onFocusTab2?.(), globalHotkeyOptions);
	useHotkeys("ctrl+3", () => onFocusTab3?.(), globalHotkeyOptions);
	useHotkeys("ctrl+4", () => onFocusTab4?.(), globalHotkeyOptions);
	useHotkeys("ctrl+5", () => onFocusTab5?.(), globalHotkeyOptions);
	useHotkeys("ctrl+6", () => onFocusTab6?.(), globalHotkeyOptions);
	useHotkeys("ctrl+7", () => onFocusTab7?.(), globalHotkeyOptions);
	useHotkeys("ctrl+8", () => onFocusTab8?.(), globalHotkeyOptions);
	useHotkeys("ctrl+9", () => onFocusTab9?.(), globalHotkeyOptions);

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
