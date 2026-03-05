/**
 * Shared formatting constants for editor toolbar and format pickers.
 *
 * These are used by:
 * - editor-toolbar.tsx (toolbar UI)
 * - format-picker.tsx (keyboard-triggered floating pickers)
 * - format-commands.ts (ProseMirror commands for direct color hotkeys)
 */

// ============ Contrast Utility ============

/**
 * Returns a readable text color (black or white) for a given background hex color.
 * Uses relative luminance per WCAG 2.0.
 */
export function getContrastTextColor(hex: string): string {
	const h = hex.replace("#", "");
	const r = Number.parseInt(h.substring(0, 2), 16) / 255;
	const g = Number.parseInt(h.substring(2, 4), 16) / 255;
	const b = Number.parseInt(h.substring(4, 6), 16) / 255;
	const toLinear = (c: number) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
	const luminance = 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
	return luminance > 0.4 ? "#000000" : "#ffffff";
}

// ============ Color Presets ============

/** Preset text colors for the color picker (4×3 grid) */
export const PRESET_COLORS = [
	"#000000", "#374151", "#6b7280", "#9ca3af",
	"#ef4444", "#f97316", "#eab308", "#22c55e",
	"#3b82f6", "#8b5cf6", "#ec4899", "#14b8a6",
];

/** Preset highlight (background) colors for the highlight picker (4×3 grid) */
export const HIGHLIGHT_COLORS = [
	"#facc15", "#f59e0b", "#fb923c", "#f87171",
	"#e879f9", "#a78bfa", "#60a5fa", "#38bdf8",
	"#34d399", "#4ade80", "#a3e635", "#ffffff",
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

export type FontGroup = "sans-serif" | "serif" | "monospace" | "display";

export interface FontFamilyEntry {
	label: string;
	value: string;
	group: FontGroup;
}

export const FONT_GROUP_LABELS: Record<FontGroup, string> = {
	"sans-serif": "Sans Serif",
	"serif": "Serif",
	"monospace": "Monospace",
	"display": "Display",
};

export const FONT_GROUP_ORDER: FontGroup[] = ["sans-serif", "serif", "monospace", "display"];

export const FONT_FAMILIES: FontFamilyEntry[] = [
	// Sans-serif fonts
	{ label: "Sans Serif", value: "Arial, Helvetica, sans-serif", group: "sans-serif" },
	{ label: "Arial", value: "Arial, Helvetica, sans-serif", group: "sans-serif" },
	{ label: "Calibri", value: "Calibri, 'Gill Sans', sans-serif", group: "sans-serif" },
	{ label: "Verdana", value: "Verdana, Geneva, sans-serif", group: "sans-serif" },
	{ label: "Trebuchet MS", value: "'Trebuchet MS', Helvetica, sans-serif", group: "sans-serif" },
	{ label: "Inter", value: "Inter, system-ui, sans-serif", group: "sans-serif" },
	{ label: "Roboto", value: "Roboto, Arial, sans-serif", group: "sans-serif" },
	{ label: "Open Sans", value: "'Open Sans', Arial, sans-serif", group: "sans-serif" },
	{ label: "Lato", value: "Lato, Arial, sans-serif", group: "sans-serif" },
	{ label: "Noto Sans", value: "'Noto Sans', Arial, sans-serif", group: "sans-serif" },
	{ label: "Ubuntu", value: "Ubuntu, Arial, sans-serif", group: "sans-serif" },
	{ label: "Segoe UI", value: "'Segoe UI', Tahoma, sans-serif", group: "sans-serif" },
	{ label: "Helvetica Neue", value: "'Helvetica Neue', Helvetica, Arial, sans-serif", group: "sans-serif" },

	// Serif fonts
	{ label: "Serif", value: "Georgia, 'Times New Roman', serif", group: "serif" },
	{ label: "Georgia", value: "Georgia, 'Times New Roman', serif", group: "serif" },
	{ label: "Cambria", value: "Cambria, Georgia, serif", group: "serif" },
	{ label: "Times New Roman", value: "'Times New Roman', Times, serif", group: "serif" },
	{ label: "Noto Serif", value: "'Noto Serif', Georgia, serif", group: "serif" },
	{ label: "Merriweather", value: "Merriweather, Georgia, serif", group: "serif" },
	{ label: "Playfair Display", value: "'Playfair Display', Georgia, serif", group: "serif" },

	// Monospace fonts
	{ label: "Monospace", value: "'Courier New', Consolas, monospace", group: "monospace" },
	{ label: "JetBrains Mono", value: "'JetBrains Mono', 'Fira Code', monospace", group: "monospace" },
	{ label: "Fira Code", value: "'Fira Code', 'JetBrains Mono', monospace", group: "monospace" },
	{ label: "Source Code Pro", value: "'Source Code Pro', Consolas, monospace", group: "monospace" },
	{ label: "Consolas", value: "Consolas, 'Courier New', monospace", group: "monospace" },
	{ label: "JetBrainsMonoNL NF", value: "'JetBrainsMonoNL NF', 'JetBrains Mono', monospace", group: "monospace" },
	{ label: "Cascadia Code", value: "'Cascadia Code', Consolas, monospace", group: "monospace" },
	{ label: "Ubuntu Mono", value: "'Ubuntu Mono', 'Courier New', monospace", group: "monospace" },
	{ label: "Hack", value: "Hack, 'DejaVu Sans Mono', monospace", group: "monospace" },
	{ label: "DejaVu Sans Mono", value: "'DejaVu Sans Mono', Consolas, monospace", group: "monospace" },
	{ label: "Iosevka", value: "Iosevka, 'Fira Code', monospace", group: "monospace" },
	{ label: "Nerd Font Mono", value: "'JetBrainsMono Nerd Font', 'FiraCode Nerd Font', 'Hack Nerd Font', monospace", group: "monospace" },

	// Display/Fun fonts
	{ label: "Impact", value: "Impact, 'Arial Narrow', sans-serif", group: "display" },
	{ label: "Comic Sans", value: "'Comic Sans MS', cursive", group: "display" },
];

/** Get fonts grouped by category, in display order */
export function getFontsByGroup(): { group: FontGroup; label: string; fonts: FontFamilyEntry[] }[] {
	return FONT_GROUP_ORDER
		.map((group) => ({
			group,
			label: FONT_GROUP_LABELS[group],
			fonts: FONT_FAMILIES.filter((f) => f.group === group),
		}))
		.filter((g) => g.fonts.length > 0);
}

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
	1: { color: "#facc15", name: "Yellow" },
	2: { color: "#f59e0b", name: "Amber" },
	3: { color: "#fb923c", name: "Orange" },
	4: { color: "#f87171", name: "Red" },
	5: { color: "#e879f9", name: "Fuchsia" },
	6: { color: "#a78bfa", name: "Violet" },
	7: { color: "#60a5fa", name: "Blue" },
	8: { color: "#38bdf8", name: "Sky" },
	9: { color: "#34d399", name: "Emerald" },
};
