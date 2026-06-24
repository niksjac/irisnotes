import { atom } from "jotai";

// Command palette (Ctrl+Shift+P) — searches and runs actions/settings.
export const actionPaletteOpenAtom = atom<boolean>(false);
export const openActionPaletteAtom = atom(null, (_get, set) =>
	set(actionPaletteOpenAtom, true)
);

// Open-tabs switcher palette (Ctrl+R).
export const tabPaletteOpenAtom = atom<boolean>(false);
export const openTabPaletteAtom = atom(null, (_get, set) =>
	set(tabPaletteOpenAtom, true)
);
