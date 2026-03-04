/**
 * IrisNotes Theme Registry
 *
 * Each theme entry drives two things:
 *   1. The `data-theme="<id>"` attribute set on <html>  →  theme.css variables apply
 *   2. The `.dark` class toggle           →  Tailwind `dark:` variants apply
 *
 * VS Code snappiness trick:
 *   Setting a data-attribute on <html> (== :root) triggers a single style-recalculation
 *   pass for the entire document because <html> is the only element being "restyled".
 *   All descendant elements that reference `var(--color-gray-*)` or `var(--color-blue-*)`
 *   are marked dirty and repainted in one browser frame — effectively O(1) with zero JS
 *   loop over individual properties (VS Code's setProperty approach).
 */

export type ThemeName =
	| "default-dark"
	| "default-light"
	| "nord"
	| "catppuccin-mocha"
	| "catppuccin-latte"
	| "tokyo-night"
	| "gruvbox"
	| "rose-pine"
	| "solarized-light";

export interface ThemeDefinition {
	id: ThemeName;
	label: string;
	isDark: boolean;
	/** Colors shown in the settings picker swatch */
	swatch: {
		bg: string;     // Main background
		panel: string;  // Panel / sidebar
		accent: string; // Primary interactive color
		text: string;   // Body text
	};
}

export const DEFAULT_THEME: ThemeName = "default-dark";

export const THEMES: ThemeDefinition[] = [
	// ── Light ─────────────────────────────────────────────────────────────
	{
		id: "default-light",
		label: "Light",
		isDark: false,
		swatch: { bg: "#f9fafb", panel: "#f3f4f6", accent: "#3b82f6", text: "#111827" },
	},
	{
		id: "catppuccin-latte",
		label: "Catppuccin Latte",
		isDark: false,
		swatch: { bg: "#eff1f5", panel: "#e6e9ef", accent: "#8839ef", text: "#4c4f69" },
	},
	{
		id: "solarized-light",
		label: "Solarized Light",
		isDark: false,
		swatch: { bg: "#fdf6e3", panel: "#eee8d5", accent: "#268bd2", text: "#657b83" },
	},
	// ── Dark ─────────────────────────────────────────────────────────────
	{
		id: "default-dark",
		label: "Dark",
		isDark: true,
		swatch: { bg: "#111827", panel: "#1f2937", accent: "#3b82f6", text: "#f9fafb" },
	},
	{
		id: "nord",
		label: "Nord",
		isDark: true,
		swatch: { bg: "#2e3440", panel: "#3b4252", accent: "#81a1c1", text: "#eceff4" },
	},
	{
		id: "catppuccin-mocha",
		label: "Catppuccin Mocha",
		isDark: true,
		swatch: { bg: "#1e1e2e", panel: "#313244", accent: "#cba6f7", text: "#cdd6f4" },
	},
	{
		id: "tokyo-night",
		label: "Tokyo Night",
		isDark: true,
		swatch: { bg: "#1a1b26", panel: "#1f2335", accent: "#7aa2f7", text: "#c0caf5" },
	},
	{
		id: "gruvbox",
		label: "Gruvbox",
		isDark: true,
		swatch: { bg: "#282828", panel: "#3c3836", accent: "#fabd2f", text: "#ebdbb2" },
	},
	{
		id: "rose-pine",
		label: "Rosé Pine",
		isDark: true,
		swatch: { bg: "#191724", panel: "#1f1d2e", accent: "#c4a7e7", text: "#e0def4" },
	},
];

export function getTheme(id: ThemeName): ThemeDefinition {
	return THEMES.find((t) => t.id === id) ?? THEMES.find((t) => t.id === DEFAULT_THEME)!;
}
