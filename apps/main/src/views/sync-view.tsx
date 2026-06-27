import { useEffect, useState } from "react";
import { useAtomValue, useSetAtom } from "jotai";
import * as Icons from "lucide-react";
import { useConfig } from "@/hooks";
import { syncStateAtom, syncNowRequestAtom, type SyncStatus } from "@/atoms/sync";
import type { SyncSettings } from "@/types";

const DEFAULTS: SyncSettings = {
	enabled: false,
	serverUrl: "http://127.0.0.1:8787",
	token: "",
	intervalSeconds: 30,
};

const STATUS_META: Record<
	SyncStatus,
	{ label: string; Icon: Icons.LucideIcon; className: string }
> = {
	disabled: { label: "Offline (sync disabled)", Icon: Icons.CloudOff, className: "text-gray-500" },
	idle: { label: "Up to date", Icon: Icons.CloudCheck, className: "text-green-600 dark:text-green-400" },
	syncing: { label: "Syncing…", Icon: Icons.RefreshCw, className: "text-blue-600 dark:text-blue-400" },
	error: { label: "Sync error", Icon: Icons.CloudAlert, className: "text-red-600 dark:text-red-400" },
};

function timeAgo(ms: number | null): string {
	if (!ms) return "never";
	const s = Math.round((Date.now() - ms) / 1000);
	if (s < 5) return "just now";
	if (s < 60) return `${s}s ago`;
	if (s < 3600) return `${Math.round(s / 60)}m ago`;
	return `${Math.round(s / 3600)}h ago`;
}

export function SyncView() {
	const { config, updateConfig } = useConfig();
	const state = useAtomValue(syncStateAtom);
	const requestSyncNow = useSetAtom(syncNowRequestAtom);

	// Local form state, seeded from saved config.
	const [form, setForm] = useState<SyncSettings>({ ...DEFAULTS, ...config.sync });
	useEffect(() => {
		setForm({ ...DEFAULTS, ...config.sync });
	}, [config.sync]);

	const saved = { ...DEFAULTS, ...config.sync };
	const dirty =
		form.enabled !== saved.enabled ||
		form.serverUrl !== saved.serverUrl ||
		form.token !== saved.token ||
		(form.intervalSeconds ?? 30) !== (saved.intervalSeconds ?? 30);

	const save = (patch: Partial<SyncSettings>) => {
		const next = { ...form, ...patch };
		setForm(next);
		updateConfig({ sync: next });
	};

	const meta = STATUS_META[state.status];
	const field =
		"w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-blue-500";

	return (
		<div className="h-full overflow-y-auto bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
			<div className="max-w-2xl mx-auto px-6 py-8 space-y-8">
				<div>
					<h1 className="text-xl font-semibold flex items-center gap-2">
						<Icons.RefreshCw className="w-5 h-5" /> Remote Sync
					</h1>
					<p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
						Local-first: your notes always live on this device and stay fully
						editable offline. When enabled, changes sync to your iris-server hub.
					</p>
				</div>

				{/* Status */}
				<div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4">
					<div className="flex items-center justify-between">
						<div className={`flex items-center gap-2 font-medium ${meta.className}`}>
							<meta.Icon className={`w-5 h-5 ${state.status === "syncing" ? "animate-spin" : ""}`} />
							{meta.label}
						</div>
						<button
							onClick={() => requestSyncNow((n) => n + 1)}
							disabled={!saved.enabled || state.status === "syncing"}
							className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed"
						>
							<Icons.RefreshCw className="w-4 h-4" /> Sync now
						</button>
					</div>
					<dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-gray-500 dark:text-gray-400">
						<div className="flex justify-between"><dt>Last sync</dt><dd>{timeAgo(state.lastSyncedAt)}</dd></div>
						{state.lastResult && (
							<div className="flex justify-between">
								<dt>Last cycle</dt>
								<dd>↓{state.lastResult.pulled} ↑{state.lastResult.pushed}</dd>
							</div>
						)}
					</dl>
					{state.status === "error" && state.lastError && (
						<p className="mt-2 text-sm text-red-600 dark:text-red-400 break-words">
							{state.lastError}
						</p>
					)}
				</div>

				{/* Enable / work offline */}
				<label className="flex items-start justify-between gap-4 cursor-pointer">
					<span>
						<span className="font-medium">Enable sync</span>
						<span className="block text-sm text-gray-500 dark:text-gray-400">
							Turn off to work fully offline. When you turn it back on, every
							change made while offline is pushed on the next sync.
						</span>
					</span>
					<button
						type="button"
						role="switch"
						aria-checked={form.enabled}
						onClick={() => save({ enabled: !form.enabled })}
						className={`relative shrink-0 w-11 h-6 rounded-full transition-colors ${
							form.enabled ? "bg-blue-600" : "bg-gray-300 dark:bg-gray-600"
						}`}
					>
						<span
							className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
								form.enabled ? "translate-x-5" : ""
							}`}
						/>
					</button>
				</label>

				{/* Connection settings */}
				<div className="space-y-4">
					<div>
						<label className="block text-sm font-medium mb-1">Server URL</label>
						<input
							type="text"
							value={form.serverUrl}
							onChange={(e) => setForm((f) => ({ ...f, serverUrl: e.target.value }))}
							placeholder="http://127.0.0.1:8787"
							className={field}
						/>
					</div>
					<div>
						<label className="block text-sm font-medium mb-1">Token</label>
						<input
							type="password"
							value={form.token}
							onChange={(e) => setForm((f) => ({ ...f, token: e.target.value }))}
							placeholder="must match the server's IRIS_TOKEN"
							className={field}
						/>
					</div>
					<div>
						<label className="block text-sm font-medium mb-1">Sync interval (seconds)</label>
						<input
							type="number"
							min={5}
							value={form.intervalSeconds ?? 30}
							onChange={(e) =>
								setForm((f) => ({ ...f, intervalSeconds: Number(e.target.value) || 30 }))
							}
							className={`${field} max-w-[120px]`}
						/>
					</div>

					<div className="flex items-center gap-3 pt-2">
						<button
							onClick={() => updateConfig({ sync: form })}
							disabled={!dirty}
							className="px-4 py-2 text-sm rounded bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed"
						>
							Save
						</button>
						{dirty && (
							<span className="text-sm text-amber-600 dark:text-amber-400">Unsaved changes</span>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}
