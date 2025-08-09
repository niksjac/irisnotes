import { useHotkeys } from "react-hotkeys-hook";

interface AppHotkeysProps {
	// Layout hotkeys
	onToggleSidebar?: () => void;
	onToggleDualPane?: () => void;
	onToggleActivityBar?: () => void;

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
	onToggleDualPane,
	onToggleActivityBar,
}: AppHotkeysProps) {
	const hotkeyOptions = {
		preventDefault: true,
		enableOnContentEditable: false,
		enableOnFormTags: false,
	};

	// Layout hotkeys
	useHotkeys("ctrl+b", () => onToggleSidebar?.(), hotkeyOptions);
	useHotkeys("ctrl+d", () => onToggleDualPane?.(), hotkeyOptions);
	useHotkeys("ctrl+j", () => onToggleActivityBar?.(), hotkeyOptions);

	// Future hotkey categories can be added here:
	// Editor hotkeys
	// useHotkeys('ctrl+s', () => onSave?.(), hotkeyOptions);

	// Navigation hotkeys
	// useHotkeys('ctrl+1', () => onFocusEditor?.(), hotkeyOptions);

	// Notes hotkeys
	// useHotkeys('ctrl+n', () => onNewNote?.(), hotkeyOptions);
}
