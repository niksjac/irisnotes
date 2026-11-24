/**
 * Converts a react-hotkeys-hook key string to a human-readable display label.
 *
 * Input format: "ctrl+shift+comma"  (lowercase, word names for special keys)
 * Output format: "Ctrl+Shift+,"
 */
const WORD_TO_SYMBOL: Record<string, string> = {
	ctrl: "Ctrl",
	shift: "Shift",
	alt: "Alt",
	meta: "Meta",
	mod: "Ctrl",
	// Punctuation
	comma: ",",
	period: ".",
	slash: "/",
	backslash: "\\",
	semicolon: ";",
	quote: "'",
	backtick: "`",
	bracketleft: "[",
	bracketright: "]",
	minus: "-",
	equal: "=",
	// Navigation / editing
	enter: "Enter",
	escape: "Esc",
	tab: "Tab",
	space: "Space",
	backspace: "Backspace",
	delete: "Delete",
	insert: "Insert",
	home: "Home",
	end: "End",
	pageup: "PageUp",
	pagedown: "PageDown",
	// Arrows (full names)
	arrowup: "↑",
	arrowdown: "↓",
	arrowleft: "←",
	arrowright: "→",
	// Arrows (short names, as used in react-hotkeys-hook)
	up: "↑",
	down: "↓",
	left: "←",
	right: "→",
};

/**
 * The keys bound to one action. Several keys are separated by "," — the
 * separator react-hotkeys-hook uses; the comma key itself is spelled "comma".
 * "ctrl+3, ctrl+g" → ["ctrl+3", "ctrl+g"]
 */
export function splitHotkeyKeys(key: string): string[] {
	return key
		.split(",")
		.map((k) => k.trim())
		.filter(Boolean);
}

/** Formats one key or several ("ctrl+3,ctrl+g" → "Ctrl+3 / Ctrl+G") */
export function formatHotkeyKey(key: string): string {
	return splitHotkeyKeys(key).map(formatSingleKey).join(" / ");
}

function formatSingleKey(key: string): string {
	return key
		.split("+")
		.map((part) => {
			const lower = part.toLowerCase();
			if (lower in WORD_TO_SYMBOL) return WORD_TO_SYMBOL[lower];
			// F-keys: f1 → F1
			if (/^f\d+$/.test(lower)) return lower.toUpperCase();
			// Single chars: just uppercase
			if (part.length === 1) return part.toUpperCase();
			return part;
		})
		.join("+");
}
