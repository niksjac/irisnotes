import { atom } from "jotai";

export interface VersioningConfig {
	enabled: boolean;
	contentSnapshotIntervalMs: number;
	maxVersionsPerNote: number;
}

export interface NoteVersionRuntimeState {
	lastSnapshotAt?: number;
	lastContentSnapshotAt?: number;
}

export const DEFAULT_VERSIONING_CONFIG: VersioningConfig = {
	enabled: true,
	contentSnapshotIntervalMs: 10 * 60 * 1000,
	maxVersionsPerNote: 100,
};

export const versioningConfigAtom = atom<VersioningConfig>({
	...DEFAULT_VERSIONING_CONFIG,
});

export const noteVersionStatesAtom = atom<
	Record<string, NoteVersionRuntimeState>
>({});