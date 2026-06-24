import { useAtom, useSetAtom } from "jotai";
import * as Icons from "lucide-react";
import { CommandPalette, type PaletteItem } from "./command-palette";
import {
	actionPaletteOpenAtom,
	openTabPaletteAtom,
	toggleStatusBarAtom,
	toggleNoteConfigBarAtom,
} from "@/atoms";
import {
	openTopNotesTabAtom,
	openAsciiArtTabAtom,
	openAutocorrectTabAtom,
} from "@/atoms/panes";
import { useHotkeyHandlers } from "@/hooks/use-hotkey-handlers";
import { useSidebar, useView, useEditorLayout, useTheme } from "@/hooks";
import { THEMES } from "@/config/themes";

const icon = (Icon: Icons.LucideIcon) => <Icon className="w-4 h-4" />;

/**
 * Command palette: searchable list of actions, toggles, view openers and theme
 * switches that can be executed without leaving the keyboard.
 */
export function ActionPalette() {
	const [isOpen, setIsOpen] = useAtom(actionPaletteOpenAtom);
	const close = () => setIsOpen(false);

	const handlers = useHotkeyHandlers();
	const { toggleSidebar } = useSidebar();
	const { toggleActivityBar } = useView();
	const { toggleMetadataBar } = useEditorLayout();
	const { setTheme } = useTheme();
	const toggleStatusBar = useSetAtom(toggleStatusBarAtom);
	const toggleNoteConfigBar = useSetAtom(toggleNoteConfigBarAtom);
	const openTabPalette = useSetAtom(openTabPaletteAtom);
	const openTopNotes = useSetAtom(openTopNotesTabAtom);
	const openAsciiArt = useSetAtom(openAsciiArtTabAtom);
	const openAutocorrect = useSetAtom(openAutocorrectTabAtom);

	const items: PaletteItem[] = [
		// View / layout toggles
		{ id: "toggle-sidebar", label: "Toggle Sidebar", hint: "View", icon: icon(Icons.PanelLeft), run: toggleSidebar },
		{ id: "toggle-activity-bar", label: "Toggle Activity Bar", hint: "View", icon: icon(Icons.Sidebar), run: toggleActivityBar },
		{ id: "toggle-activity-labels", label: "Toggle Activity Bar Labels", hint: "View", icon: icon(Icons.Tags), run: handlers.toggleActivityBarExpanded },
		{ id: "toggle-toolbar", label: "Toggle Editor Toolbar", hint: "View", icon: icon(Icons.Wrench), run: handlers.toggleToolbar },
		{ id: "toggle-title-bar", label: "Toggle Note Title Bar", hint: "View", icon: icon(Icons.Heading), run: handlers.toggleTitleBar },
		{ id: "toggle-info-bar", label: "Toggle Note Info Bar", hint: "View", icon: icon(Icons.Info), run: toggleMetadataBar },
		{ id: "toggle-hotkey-bar", label: "Toggle Note Hotkey Bar", hint: "View", icon: icon(Icons.Keyboard), run: toggleNoteConfigBar },
		{ id: "toggle-tab-bar", label: "Toggle Tab Bar", hint: "View", icon: icon(Icons.PanelTop), run: handlers.toggleTabBar },
		{ id: "toggle-status-bar", label: "Toggle Status Bar", hint: "View", icon: icon(Icons.PanelBottom), run: toggleStatusBar },
		{ id: "toggle-wrap", label: "Toggle Line Wrapping", hint: "View", icon: icon(Icons.WrapText), run: handlers.toggleLineWrapping },
		{ id: "toggle-zen", label: "Toggle Zen Mode", hint: "View", icon: icon(Icons.Sparkles), run: handlers.toggleZenMode },
		{ id: "toggle-editor-view", label: "Toggle Rich / Source Editor", hint: "View", icon: icon(Icons.Code), run: handlers.toggleEditorView },

		// Tabs & panes
		{ id: "toggle-dual-pane", label: "Toggle Split (Dual Pane)", hint: "Tabs", icon: icon(Icons.Columns2), run: handlers.toggleDualPane },
		{ id: "switch-tab", label: "Switch Open Tab…", hint: "Tabs", icon: icon(Icons.LayoutGrid), run: () => openTabPalette() },
		{ id: "close-tab", label: "Close Tab", hint: "Tabs", icon: icon(Icons.X), run: handlers.closeActiveTab },
		{ id: "reopen-tab", label: "Reopen Closed Tab", hint: "Tabs", icon: icon(Icons.Undo2), run: handlers.reopenLastClosedTab },
		{ id: "move-tab-left", label: "Move Tab Left", hint: "Tabs", icon: icon(Icons.ArrowLeft), run: handlers.moveActiveTabLeft },
		{ id: "move-tab-right", label: "Move Tab Right", hint: "Tabs", icon: icon(Icons.ArrowRight), run: handlers.moveActiveTabRight },
		{ id: "next-tab", label: "Next Tab", hint: "Tabs", icon: icon(Icons.ChevronRight), run: handlers.focusNextTab },
		{ id: "prev-tab", label: "Previous Tab", hint: "Tabs", icon: icon(Icons.ChevronLeft), run: handlers.focusPreviousTab },

		// Create
		{ id: "new-note", label: "New Note", hint: "Create", icon: icon(Icons.FilePlus), run: handlers.createNoteInRoot },
		{ id: "new-note-location", label: "New Note (choose location)…", hint: "Create", icon: icon(Icons.FilePlus2), run: handlers.openLocationDialog },
		{ id: "new-book", label: "New Book", hint: "Create", icon: icon(Icons.BookPlus), run: handlers.openNewBookDialog },
		{ id: "new-section", label: "New Section", hint: "Create", icon: icon(Icons.FolderPlus), run: handlers.openNewSectionDialog },

		// Open views
		{ id: "open-settings", label: "Open Settings", hint: "Open", icon: icon(Icons.Settings), run: handlers.openSettings },
		{ id: "open-hotkeys", label: "Open Keyboard Shortcuts", hint: "Open", icon: icon(Icons.Keyboard), run: handlers.openHotkeys },
		{ id: "open-top-notes", label: "Open Top Notes", hint: "Open", icon: icon(Icons.Flame), run: () => openTopNotes() },
		{ id: "open-ascii", label: "Open ASCII Art", hint: "Open", icon: icon(Icons.Type), run: () => openAsciiArt() },
		{ id: "open-autocorrect", label: "Open Autocorrect", hint: "Open", icon: icon(Icons.SpellCheck), run: () => openAutocorrect() },
		{ id: "open-branding", label: "Open Branding", hint: "Open", icon: icon(Icons.Palette), run: handlers.openBranding },
		{ id: "open-config-folder", label: "Open Config Folder", hint: "Open", icon: icon(Icons.FolderOpen), run: handlers.openConfigFolder },

		// Search & pickers
		{ id: "quick-search", label: "Quick Search (notes)", hint: "Search", icon: icon(Icons.Search), run: handlers.openQuickSearch },
		{ id: "full-text-search", label: "Full Text Search", hint: "Search", icon: icon(Icons.FileSearch), run: handlers.openSearchSidebar },
		{ id: "theme-switcher", label: "Open Theme Switcher", hint: "Search", icon: icon(Icons.SwatchBook), run: handlers.openThemeSwitcher },
		{ id: "symbol-picker", label: "Open Symbol Picker", hint: "Search", icon: icon(Icons.Sigma), run: handlers.openSymbolPicker },
		{ id: "nerd-font-picker", label: "Open Nerd Font Icon Picker", hint: "Search", icon: icon(Icons.Smile), run: handlers.openNerdFontPicker },
		{ id: "quick-hotkeys", label: "Quick Hotkeys Cheatsheet", hint: "Search", icon: icon(Icons.Command), run: handlers.showQuickHotkeys },

		// Themes
		...THEMES.map<PaletteItem>((theme) => ({
			id: `theme-${theme.id}`,
			label: `Theme: ${theme.label}`,
			hint: theme.isDark ? "Theme · dark" : "Theme · light",
			keywords: "color scheme appearance",
			icon: icon(theme.isDark ? Icons.Moon : Icons.Sun),
			run: () => {
				void setTheme(theme.id);
			},
		})),
	];

	return (
		<CommandPalette
			isOpen={isOpen}
			onClose={close}
			items={items}
			placeholder="Run an action, toggle a setting, switch theme…"
			emptyText="No matching actions"
		/>
	);
}
