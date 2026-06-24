import { useAtom, useAtomValue, useSetAtom } from "jotai";
import * as Icons from "lucide-react";
import { CommandPalette, type PaletteItem } from "./command-palette";
import { tabPaletteOpenAtom } from "@/atoms";
import {
	paneStateAtom,
	pane0TabsAtom,
	pane1TabsAtom,
	pane0ActiveTabAtom,
	pane1ActiveTabAtom,
} from "@/atoms/panes";
import type { Tab, ViewType } from "@/types";

function tabMeta(viewType: ViewType): { type: string; Icon: Icons.LucideIcon } {
	switch (viewType) {
		case "editor-rich-view":
		case "editor-source-view":
			return { type: "Note", Icon: Icons.FileText };
		case "config-view":
			return { type: "Settings", Icon: Icons.Settings };
		case "hotkeys-view":
			return { type: "Hotkeys", Icon: Icons.Keyboard };
		case "branding-view":
			return { type: "Branding", Icon: Icons.Palette };
		case "ascii-art-view":
			return { type: "ASCII Art", Icon: Icons.Type };
		case "autocorrect-view":
			return { type: "Autocorrect", Icon: Icons.SpellCheck };
		case "icon-editor-view":
			return { type: "Icons", Icon: Icons.Smile };
		case "top-notes-view":
			return { type: "Top Notes", Icon: Icons.Flame };
		case "section-view":
			return { type: "Section", Icon: Icons.Folder };
		case "book-view":
			return { type: "Book", Icon: Icons.Book };
		default:
			return { type: "Tab", Icon: Icons.File };
	}
}

/**
 * Palette for switching between currently open tabs across both panes.
 */
export function TabPalette() {
	const [isOpen, setIsOpen] = useAtom(tabPaletteOpenAtom);
	const close = () => setIsOpen(false);

	const paneState = useAtomValue(paneStateAtom);
	const pane0Tabs = useAtomValue(pane0TabsAtom);
	const pane1Tabs = useAtomValue(pane1TabsAtom);
	const pane0ActiveTab = useAtomValue(pane0ActiveTabAtom);
	const pane1ActiveTab = useAtomValue(pane1ActiveTabAtom);
	const setPane0ActiveTab = useSetAtom(pane0ActiveTabAtom);
	const setPane1ActiveTab = useSetAtom(pane1ActiveTabAtom);
	const setPaneState = useSetAtom(paneStateAtom);

	const dualPane = paneState.count === 2;

	const activate = (paneIndex: 0 | 1, tabId: string) => {
		if (paneIndex === 0) setPane0ActiveTab(tabId);
		else setPane1ActiveTab(tabId);
		setPaneState((prev) => ({ ...prev, activePane: paneIndex }));
	};

	const toItems = (tabs: Tab[], paneIndex: 0 | 1, activeId: string | null) =>
		tabs.map<PaletteItem>((tab) => {
			const { type, Icon } = tabMeta(tab.viewType);
			const isActive = tab.id === activeId;
			const paneLabel = dualPane ? ` · Pane ${paneIndex + 1}` : "";
			return {
				id: `${paneIndex}:${tab.id}`,
				label: tab.title || "Untitled",
				hint: `${type}${paneLabel}${isActive ? " · current" : ""}`,
				keywords: type,
				icon: <Icon className="w-4 h-4" />,
				run: () => activate(paneIndex, tab.id),
			};
		});

	const items: PaletteItem[] = [
		...toItems(pane0Tabs, 0, pane0ActiveTab),
		...(dualPane ? toItems(pane1Tabs, 1, pane1ActiveTab) : []),
	];

	return (
		<CommandPalette
			isOpen={isOpen}
			onClose={close}
			items={items}
			placeholder="Switch to an open tab…"
			emptyText="No open tabs"
		/>
	);
}
