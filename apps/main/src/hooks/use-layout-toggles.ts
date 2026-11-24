import { useAtomValue, useSetAtom } from "jotai";
import * as Icons from "lucide-react";
import {
	appToolbarVisibleAtom,
	toggleAppToolbarAtom,
	statusBarVisibleAtom,
	toggleStatusBarAtom,
	noteConfigBarVisibleAtom,
	toggleNoteConfigBarAtom,
} from "@/atoms";
import { tabBarVisibleAtom, toggleTabBarAtom } from "@/atoms/panes";
import type { HotkeyMapping } from "@/types";
import { useSidebar } from "./use-sidebar";
import { useEditorLayout } from "./use-editor-layout";

export interface LayoutToggle {
	/** Hotkey action id; its default key is Ctrl+<position in the list + 1> */
	id: keyof HotkeyMapping;
	label: string;
	icon: Icons.LucideIcon;
	visible: boolean;
	toggle: () => void;
}

/**
 * The parts of the window that can be shown or hidden, in Ctrl+2–9 order (Ctrl+1 is free;
 * the window title bar has no toggle, only zen mode hides it):
 * window chrome first, then the bars inside each pane.
 */
export function useLayoutToggles(): LayoutToggle[] {
	const { sidebarCollapsed, toggleSidebar } = useSidebar();
	const {
		toolbarVisible,
		toggleToolbar,
		titleBarVisible,
		toggleTitleBar,
		metadataBarVisible,
		toggleMetadataBar,
	} = useEditorLayout();

	return [
		{
			id: "toggleAppToolbar",
			label: "Toolbar",
			icon: Icons.PanelTop,
			visible: useAtomValue(appToolbarVisibleAtom),
			toggle: useSetAtom(toggleAppToolbarAtom),
		},
		{
			id: "toggleSidebar",
			label: "Sidebar",
			icon: Icons.PanelLeft,
			visible: !sidebarCollapsed,
			toggle: toggleSidebar,
		},
		{
			id: "toggleStatusBar",
			label: "Status bar",
			icon: Icons.PanelBottom,
			visible: useAtomValue(statusBarVisibleAtom),
			toggle: useSetAtom(toggleStatusBarAtom),
		},
		{
			id: "toggleTabBar",
			label: "Tab bar",
			icon: Icons.GalleryHorizontal,
			visible: useAtomValue(tabBarVisibleAtom),
			toggle: useSetAtom(toggleTabBarAtom),
		},
		{
			id: "toggleToolbar",
			label: "Formatting toolbar",
			icon: Icons.Brush,
			visible: toolbarVisible,
			toggle: toggleToolbar,
		},
		{
			id: "toggleTitleBar",
			label: "Note title",
			icon: Icons.Heading,
			visible: titleBarVisible,
			toggle: toggleTitleBar,
		},
		{
			id: "toggleMetadataBar",
			label: "Note info bar",
			icon: Icons.Info,
			visible: metadataBarVisible,
			toggle: toggleMetadataBar,
		},
		{
			id: "toggleNoteConfigBar",
			label: "Note hotkey bar",
			icon: Icons.Keyboard,
			visible: useAtomValue(noteConfigBarVisibleAtom),
			toggle: useSetAtom(toggleNoteConfigBarAtom),
		},
	];
}
