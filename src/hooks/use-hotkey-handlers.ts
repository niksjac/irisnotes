import { useSetAtom } from "jotai";
import {
	closeActiveTabAtom,
	newTabInActivePaneAtom,
	moveActiveTabLeftAtom,
	moveActiveTabRightAtom,
	toggleDualPaneModeAtom,
	resizePaneLeftAtom,
	resizePaneRightAtom,
	resizeSidebarLeftAtom,
	resizeSidebarRightAtom,
	focusPane1Atom,
	focusPane2Atom,
	moveTabToPaneLeftAtom,
	moveTabToPaneRightAtom,
	focusTab1Atom,
	focusTab2Atom,
	focusTab3Atom,
	focusTab4Atom,
	focusTab5Atom,
	focusTab6Atom,
	focusTab7Atom,
	focusTab8Atom,
	focusTab9Atom,
	focusNextTabAtom,
	focusPreviousTabAtom,
} from "@/atoms";
import { useEditorViewToggle } from "./use-editor-view-toggle";
import { useLineWrapping } from "./use-line-wrapping";

/**
 * Hook that provides all hotkey handler functions
 * Encapsulates all the atom setters for cleaner component code
 */
export function useHotkeyHandlers() {
	const { toggleEditorView } = useEditorViewToggle();
	const { toggleLineWrapping } = useLineWrapping();
	// Tab actions
	const closeActiveTab = useSetAtom(closeActiveTabAtom);
	const newTabInActivePane = useSetAtom(newTabInActivePaneAtom);
	const moveActiveTabLeft = useSetAtom(moveActiveTabLeftAtom);
	const moveActiveTabRight = useSetAtom(moveActiveTabRightAtom);

	// Pane actions
	const toggleDualPane = useSetAtom(toggleDualPaneModeAtom);
	const resizePaneLeft = useSetAtom(resizePaneLeftAtom);
	const resizePaneRight = useSetAtom(resizePaneRightAtom);

	// Sidebar actions
	const resizeSidebarLeft = useSetAtom(resizeSidebarLeftAtom);
	const resizeSidebarRight = useSetAtom(resizeSidebarRightAtom);

	// Pane focus actions
	const focusPane1 = useSetAtom(focusPane1Atom);
	const focusPane2 = useSetAtom(focusPane2Atom);

	// Tab movement between panes
	const moveTabToPaneLeft = useSetAtom(moveTabToPaneLeftAtom);
	const moveTabToPaneRight = useSetAtom(moveTabToPaneRightAtom);

	// Tab focus by number
	const focusTab1 = useSetAtom(focusTab1Atom);
	const focusTab2 = useSetAtom(focusTab2Atom);
	const focusTab3 = useSetAtom(focusTab3Atom);
	const focusTab4 = useSetAtom(focusTab4Atom);
	const focusTab5 = useSetAtom(focusTab5Atom);
	const focusTab6 = useSetAtom(focusTab6Atom);
	const focusTab7 = useSetAtom(focusTab7Atom);
	const focusTab8 = useSetAtom(focusTab8Atom);
	const focusTab9 = useSetAtom(focusTab9Atom);

	// Tab navigation
	const focusNextTab = useSetAtom(focusNextTabAtom);
	const focusPreviousTab = useSetAtom(focusPreviousTabAtom);

	return {
		// Tab actions
		closeActiveTab,
		newTabInActivePane,
		moveActiveTabLeft,
		moveActiveTabRight,

		// Pane actions
		toggleDualPane,
		resizePaneLeft,
		resizePaneRight,

		// Sidebar actions
		resizeSidebarLeft,
		resizeSidebarRight,

		// Pane focus
		focusPane1,
		focusPane2,

		// Tab movement between panes
		moveTabToPaneLeft,
		moveTabToPaneRight,

		// Tab focus by number
		focusTab1,
		focusTab2,
		focusTab3,
		focusTab4,
		focusTab5,
		focusTab6,
		focusTab7,
		focusTab8,
		focusTab9,

		// Tab navigation
		focusNextTab,
		focusPreviousTab,

		// Editor view toggle
		toggleEditorView,
		toggleLineWrapping,
	};
}
