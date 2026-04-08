import { atom } from "jotai";

export interface AsciiArtEntry {
	key: string;
	description: string;
	art: string;
}

export const asciiArtConfigAtom = atom<AsciiArtEntry[]>([]);
