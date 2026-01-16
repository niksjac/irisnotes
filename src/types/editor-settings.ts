/**
 * Editor Settings Types
 *
 * Defines the interface for ProseMirror editor appearance settings.
 * These settings are applied via CSS custom properties.
 */

/**
 * Predefined font family options
 */
export type EditorFontFamily =
	| "system" // system-ui, -apple-system, sans-serif
	| "serif" // Georgia, Times New Roman, serif
	| "mono" // Monaco, Menlo, Consolas, monospace
	| "inter" // Inter (if installed)
	| string; // Custom font family

/**
 * Cursor blink style options (like VS Code)
 */
export type CursorBlinkStyle = "blink" | "smooth" | "expand" | "solid";

/**
 * Cursor width options
 */
export type CursorWidth = 1 | 2 | 3 | "block";

/**
 * Editor appearance settings
 * All numeric values are in the units specified
 */
export interface EditorSettings {
	/** Base font size in pixels (12-24) */
	fontSize: number;

	/** Zoom level for proportional scaling (0.5-2.0) */
	zoom: number;

	/** Font family preset or custom string */
	fontFamily: EditorFontFamily;

	/** Line height multiplier (1.2-2.5) */
	lineHeight: number;

	/** Paragraph spacing in em units (0-2) */
	paragraphSpacing: number;

	/** Editor internal padding in pixels (8-64) */
	editorPadding: number;

	/** Cursor/caret color (hex color) */
	caretColor: string;

	/** Cursor width in pixels (1, 2, 3) or 'block' */
	cursorWidth: CursorWidth;

	/** Cursor blink animation style */
	cursorBlinkStyle: CursorBlinkStyle;

	/** Enable smooth cursor movement animation */
	cursorSmoothMovement: boolean;

	/** Enable line wrapping */
	lineWrapping: boolean;

	/** Enable active line highlight */
	activeLineHighlight: boolean;

	/** Active line highlight color (hex or rgba) */
	activeLineColor: string;
}

/**
 * Default editor settings - sensible starting point
 */
export const DEFAULT_EDITOR_SETTINGS: EditorSettings = {
	fontSize: 14,
	zoom: 1,
	fontFamily: "system",
	lineHeight: 1.6,
	paragraphSpacing: 0.5,
	editorPadding: 16,
	caretColor: "#22c55e",
	cursorWidth: 2,
	cursorBlinkStyle: "blink",
	cursorSmoothMovement: true,
	lineWrapping: false,
	activeLineHighlight: true,
	activeLineColor: "", // Empty = use theme default
};

/**
 * Font family CSS values for presets
 */
export const FONT_FAMILY_MAP: Record<string, string> = {
	system: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
	serif: 'Georgia, "Times New Roman", serif',
	mono: 'Monaco, Menlo, "Consolas", monospace',
	inter: '"Inter", system-ui, -apple-system, sans-serif',
};

/**
 * Setting constraints for UI controls
 */
export const EDITOR_SETTINGS_CONSTRAINTS = {
	fontSize: { min: 8, max: 72, step: 1 },
	zoom: { min: 0.5, max: 3, step: 0.1 },
	lineHeight: { min: 1.2, max: 2.5, step: 0.1 },
	paragraphSpacing: { min: 0, max: 2, step: 0.1 },
	editorPadding: { min: 8, max: 64, step: 4 },
	cursorWidth: { options: [1, 2, 3, "block"] as const },
} as const;

/**
 * Map cursor width settings to pixel values
 */
export const CURSOR_WIDTH_MAP: Record<CursorWidth, string> = {
	1: "1px",
	2: "2px",
	3: "3px",
	block: "1ch", // block cursor uses character width
};

/**
 * Apply editor settings to CSS custom properties
 * @param settings - Editor settings object
 */
export function applyEditorSettings(settings: EditorSettings): void {
	const root = document.documentElement;

	// Resolve font family
	const fontFamily =
		FONT_FAMILY_MAP[settings.fontFamily] || settings.fontFamily;

	root.style.setProperty("--pm-font-size", `${settings.fontSize}px`);
	root.style.setProperty("--pm-zoom", String(settings.zoom));
	root.style.setProperty("--pm-font-family", fontFamily);
	root.style.setProperty("--pm-line-height", String(settings.lineHeight));
	root.style.setProperty(
		"--pm-paragraph-spacing",
		`${settings.paragraphSpacing}em`,
	);
	root.style.setProperty("--pm-block-spacing", `${settings.paragraphSpacing}em`);
	root.style.setProperty("--pm-padding", `${settings.editorPadding}px`);
	root.style.setProperty("--pm-caret-color", settings.caretColor);

	// Cursor width
	root.style.setProperty(
		"--pm-cursor-width",
		CURSOR_WIDTH_MAP[settings.cursorWidth],
	);

	// Block cursor mode
	if (settings.cursorWidth === "block") {
		root.classList.add("pm-cursor-block-mode");
	} else {
		root.classList.remove("pm-cursor-block-mode");
	}

	// Cursor blink animation class
	root.classList.remove(
		"pm-cursor-blink",
		"pm-cursor-smooth",
		"pm-cursor-expand",
		"pm-cursor-solid",
	);
	root.classList.add(`pm-cursor-${settings.cursorBlinkStyle}`);

	// Smooth cursor movement
	if (settings.cursorSmoothMovement) {
		root.classList.add("pm-cursor-smooth-movement");
	} else {
		root.classList.remove("pm-cursor-smooth-movement");
	}

	// Active line highlight
	if (settings.activeLineHighlight) {
		root.classList.add("pm-active-line-enabled");
	} else {
		root.classList.remove("pm-active-line-enabled");
	}

	// Active line color (if custom color is set)
	if (settings.activeLineColor) {
		root.style.setProperty("--pm-active-line-bg", settings.activeLineColor);
	} else {
		// Reset to theme default
		root.style.removeProperty("--pm-active-line-bg");
	}

	// Dispatch event so editors can recalculate cursor position, etc.
	window.dispatchEvent(new CustomEvent("editor-settings-changed"));
}

/**
 * Get current CSS custom property value
 * @param property - CSS custom property name (with --)
 */
export function getEditorCSSProperty(property: string): string {
	return getComputedStyle(document.documentElement)
		.getPropertyValue(property)
		.trim();
}
