import clsx from "clsx";
import * as Icons from "lucide-react";
import { useAtomValue, useSetAtom } from "jotai";
import { syncStateAtom, type SyncStatus } from "@/atoms/sync";
import { openSyncTabAtom } from "@/atoms/panes";

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
	expanded?: boolean;
}

/**
 * Activity-bar sync status indicator. Reflects the live sync state (animated
 * while syncing) and opens the Sync settings view when clicked.
 */
export function SyncIndicatorButton({ isActive, expanded = false }: Props) {
	const state = useAtomValue(syncStateAtom);
	const openSync = useSetAtom(openSyncTabAtom);
	const meta = STATUS[state.status];

	return (
		<button
			onClick={() => openSync()}
			title={`${meta.label} — open sync settings`}
			tabIndex={-1}
			className={clsx(
				"relative flex items-center rounded bg-transparent cursor-pointer transition-all duration-200 font-medium p-0 outline-none",
				"focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-inset",
				"justify-center w-8 h-8",
				expanded
					? "md:justify-start md:gap-2 md:w-full md:px-2 md:h-7"
					: "md:w-6 md:h-6 md:hover:scale-110",
				expanded && "md:hover:bg-gray-200 md:dark:hover:bg-gray-700",
				isActive && "bg-gray-300/80 dark:bg-gray-600/75 shadow-inner",
			)}
		>
			<meta.Icon
				size={18}
				className={clsx("md:w-5 md:h-5 flex-shrink-0", meta.color, meta.spin && "animate-spin")}
			/>
			{expanded && (
				<span className="hidden md:inline text-xs truncate">Sync</span>
			)}
			{/* Tiny error dot when collapsed, so problems are visible at a glance. */}
			{!expanded && state.status === "error" && (
				<span className="absolute top-0 right-0 md:-top-0.5 md:-right-0.5 w-2 h-2 rounded-full bg-red-500 ring-1 ring-white dark:ring-gray-800" />
			)}
		</button>
	);
}
