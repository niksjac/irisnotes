import { atom } from "jotai";
import { DEFAULT_HOTKEYS } from "@/config/default-hotkeys";
import type { HotkeyMapping } from "@/types";

/**
 * Global atom holding the live merged hotkeys (defaults + user overrides).
 * Written by useHotkeysConfig on boot and on file-watcher events.
 * Read by any component that needs to display the current key for an action.
 */
export const hotkeysAtom = atom<HotkeyMapping>(DEFAULT_HOTKEYS);
