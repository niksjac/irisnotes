import { atom } from "jotai";

/** High-level state of the background sync loop, surfaced in the activity bar. */
export type SyncStatus = "disabled" | "idle" | "syncing" | "error";

export interface SyncState {
	status: SyncStatus;
	/** epoch ms of the last successful cycle, or null. */
	lastSyncedAt: number | null;
	/** message from the last failed cycle, or null. */
	lastError: string | null;
	/** counts from the last successful cycle. */
	lastResult: { pulled: number; applied: number; pushed: number } | null;
}

export const syncStateAtom = atom<SyncState>({
	status: "disabled",
	lastSyncedAt: null,
	lastError: null,
	lastResult: null,
});

/**
 * Bump this (e.g. from the sync settings view's "Sync now" button) to ask the
 * running loop to run one cycle immediately. The `useSync` hook watches it.
 */
export const syncNowRequestAtom = atom(0);
