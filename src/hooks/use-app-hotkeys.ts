import { useHotkeys } from "react-hotkeys-hook";

interface AppHotkeysProps {
	// Layout hotkeys
	onToggleSidebar?: () => void;
	onToggleActivityBar?: () => void;

	// Tab hotkeys
	onCloseTab?: () => void;

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
