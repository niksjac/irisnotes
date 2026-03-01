/**
 * Shared formatting constants for editor toolbar and format pickers.
 *
 * These are used by:
 * - editor-toolbar.tsx (toolbar UI)
 * - format-picker.tsx (keyboard-triggered floating pickers)
 * - format-commands.ts (ProseMirror commands for direct color hotkeys)
 */

// ============ Color Presets ============

/** Preset text colors for the color picker (4×3 grid) */
export const PRESET_COLORS = [
	"#000000", "#374151", "#6b7280", "#9ca3af",
	"#ef4444", "#f97316", "#eab308", "#22c55e",
	"#3b82f6", "#8b5cf6", "#ec4899", "#14b8a6",
];

/** Preset highlight (background) colors for the highlight picker (4×3 grid) */
export const HIGHLIGHT_COLORS = [
	"#fef08a", "#fde047", "#fbbf24", "#fb923c",
	"#fca5a5", "#f9a8d4", "#c4b5fd", "#a5b4fc",
	"#99f6e4", "#86efac", "#d9f99d", "#ffffff",
];

// ============ Font Size ============

/**
 * Font size scale factors (em values) — scale relative to base font size.
 * When base is 14px: 0.5em = 7px, 1em = 14px, 2em = 28px, etc.
 */
export const FONT_SIZE_SCALES = [
	0.5, 0.6, 0.7, 0.8, 0.9, 1.0, 1.1, 1.2, 1.3, 1.4, 1.5, 1.75, 2.0, 2.5, 3.0, 4.0,
];

// ============ Font Families ============

export const FONT_FAMILIES = [
	// System defaults
	{ label: "System Default", value: "system-ui, -apple-system, sans-serif" },

	// Sans-serif fonts
	{ label: "Sans Serif", value: "Arial, Helvetica, sans-serif" },
	{ label: "Inter", value: "Inter, system-ui, sans-serif" },
	{ label: "Roboto", value: "Roboto, Arial, sans-serif" },
	{ label: "Open Sans", value: "'Open Sans', Arial, sans-serif" },
	{ label: "Lato", value: "Lato, Arial, sans-serif" },
	{ label: "Noto Sans", value: "'Noto Sans', Arial, sans-serif" },
	{ label: "Ubuntu", value: "Ubuntu, Arial, sans-serif" },
	{ label: "Segoe UI", value: "'Segoe UI', Tahoma, sans-serif" },
	{ label: "Helvetica Neue", value: "'Helvetica Neue', Helvetica, Arial, sans-serif" },

	// Serif fonts
	{ label: "Serif", value: "Georgia, 'Times New Roman', serif" },
	{ label: "Times New Roman", value: "'Times New Roman', Times, serif" },
	{ label: "Noto Serif", value: "'Noto Serif', Georgia, serif" },
	{ label: "Merriweather", value: "Merriweather, Georgia, serif" },
	{ label: "Playfair Display", value: "'Playfair Display', Georgia, serif" },

	// Monospace fonts
	{ label: "Monospace", value: "'Courier New', Consolas, monospace" },
	{ label: "JetBrains Mono", value: "'JetBrains Mono', 'Fira Code', monospace" },
	{ label: "Fira Code", value: "'Fira Code', 'JetBrains Mono', monospace" },
	{ label: "Source Code Pro", value: "'Source Code Pro', Consolas, monospace" },
	{ label: "Consolas", value: "Consolas, 'Courier New', monospace" },
	{ label: "JetBrainsMonoNL NF", value: "'JetBrainsMonoNL NF', 'JetBrains Mono', monospace" },
	{ label: "Cascadia Code", value: "'Cascadia Code', Consolas, monospace" },
	{ label: "Ubuntu Mono", value: "'Ubuntu Mono', 'Courier New', monospace" },
	{ label: "Hack", value: "Hack, 'DejaVu Sans Mono', monospace" },
	{ label: "DejaVu Sans Mono", value: "'DejaVu Sans Mono', Consolas, monospace" },
	{ label: "Iosevka", value: "Iosevka, 'Fira Code', monospace" },
	{ label: "Nerd Font Mono", value: "'JetBrainsMono Nerd Font', 'FiraCode Nerd Font', 'Hack Nerd Font', monospace" },

	// Display/Fun fonts
	{ label: "Comic Sans", value: "'Comic Sans MS', cursive" },
];

// ============ Direct Hotkey Color Presets (Positional) ============
// These map digit 1-9 to the first 9 items of the corresponding preset
// array, so the shortcut number matches the grid position.

/** Quick-access text colors for Alt+1 through Alt+9 hotkeys (matches PRESET_COLORS grid order) */
export const DIRECT_TEXT_COLORS: Record<number, { color: string; name: string }> = {
	1: { color: "#000000", name: "Black" },
	2: { color: "#374151", name: "Dark Gray" },
	3: { color: "#6b7280", name: "Gray" },
	4: { color: "#9ca3af", name: "Light Gray" },
	5: { color: "#ef4444", name: "Red" },
	6: { color: "#f97316", name: "Orange" },
	7: { color: "#eab308", name: "Yellow" },
	8: { color: "#22c55e", name: "Green" },
	9: { color: "#3b82f6", name: "Blue" },
};

/** Quick-access highlight colors for Shift+Alt+1 through Shift+Alt+9 hotkeys (matches HIGHLIGHT_COLORS grid order) */
export const DIRECT_HIGHLIGHT_COLORS: Record<number, { color: string; name: string }> = {
	1: { color: "#fef08a", name: "Light Yellow" },
	2: { color: "#fde047", name: "Yellow" },
	3: { color: "#fbbf24", name: "Amber" },
	4: { color: "#fb923c", name: "Orange" },
	5: { color: "#fca5a5", name: "Pink" },
	6: { color: "#f9a8d4", name: "Rose" },
	7: { color: "#c4b5fd", name: "Lavender" },
	8: { color: "#a5b4fc", name: "Blue" },
	9: { color: "#99f6e4", name: "Mint" },
};
