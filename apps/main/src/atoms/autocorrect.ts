import { atom } from "jotai";

export interface AutocorrectEntry {
	trigger: string;
	replacement: string;
	description: string;
}

export const autocorrectConfigAtom = atom<AutocorrectEntry[]>([]);
