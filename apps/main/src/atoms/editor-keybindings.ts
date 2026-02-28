import { atom } from "jotai";
import {
	DEFAULT_EDITOR_KEYBINDINGS,
	type EditorKeybindings,
} from "@/config/default-editor-keybindings";

/**
 * Holds the resolved editor keybindings (defaults merged with user overrides from TOML).
 * Read by ProseMirrorEditor at creation time to configure keymaps.
 */
export const editorKeybindingsAtom = atom<EditorKeybindings>(
	DEFAULT_EDITOR_KEYBINDINGS,
);
