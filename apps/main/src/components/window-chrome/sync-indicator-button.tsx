import clsx from "clsx";
import * as Icons from "lucide-react";
import { useAtomValue, useSetAtom } from "jotai";
import { syncStateAtom, type SyncStatus } from "@/atoms/sync";
import { openSyncTabAtom } from "@/atoms/panes";
import { TOOLBAR_BUTTON_CLASS, TOOLBAR_BUTTON_ACTIVE_CLASS } from "./toolbar-button";

const STATUS: Record<
	SyncStatus,
	{ Icon: Icons.LucideIcon; color: string; label: string; spin?: boolean }
> = {
	disabled: { Icon: Icons.CloudOff, color: "text-gray-400 dark:text-gray-500", label: "Sync off (working offline)" },
	idle: { Icon: Icons.CloudCheck, color: "text-green-600 dark:text-green-400", label: "Synced" },
	syncing: { Icon: Icons.RefreshCw, color: "text-blue-600 dark:text-blue-400", label: "Syncing…", spin: true },
	error: { Icon: Icons.CloudAlert, color: "text-red-600 dark:text-red-400", label: "Sync error" },
};

interface Props {
	isActive: boolean;
}

/**
 * Toolbar sync status indicator. Reflects the live sync state (animated
 * while syncing) and opens the Sync settings view when clicked.
 */
export function SyncIndicatorButton({ isActive }: Props) {
	const state = useAtomValue(syncStateAtom);
	const openSync = useSetAtom(openSyncTabAtom);
	const meta = STATUS[state.status];

	return (
		<button
			onClick={() => openSync()}
			title={
				state.status === "error" && state.lastError
					? `${meta.label}: ${state.lastError} — open sync settings`
					: `${meta.label} — open sync settings`
			}
			tabIndex={-1}
			className={clsx(TOOLBAR_BUTTON_CLASS, isActive && TOOLBAR_BUTTON_ACTIVE_CLASS)}
		>
			<meta.Icon
				size={16}
				className={clsx("flex-shrink-0", meta.color, meta.spin && "animate-spin")}
			/>
			{/* Tiny error dot, so problems are visible at a glance. */}
			{state.status === "error" && (
				<span className="absolute top-0.5 right-0.5 w-2 h-2 rounded-full bg-red-500 ring-1 ring-white dark:ring-gray-800" />
			)}
		</button>
	);
}
