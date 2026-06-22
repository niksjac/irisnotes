import { useCallback, useEffect, useState } from "react";
import * as Icons from "lucide-react";
import { useTabManagement } from "@/hooks/use-tab-management";
import {
	getTopNotes,
	type TopNote,
	type TopNotesMetric,
} from "@/storage/view-tracking";

interface MetricConfig {
	id: TopNotesMetric;
	label: string;
	icon: keyof typeof Icons;
	description: string;
	/** Which secondary stat to surface for each note in this list. */
	stat: "views" | "lastViewed" | "created";
	emptyHint: string;
}

const METRICS: MetricConfig[] = [
	{
		id: "most_viewed",
		label: "Most Viewed",
		icon: "Flame",
		description: "Notes you open the most",
		stat: "views",
		emptyHint: "Open some notes and they'll start showing up here.",
	},
	{
		id: "recently_viewed",
		label: "Recently Viewed",
		icon: "Clock",
		description: "Notes you opened most recently",
		stat: "lastViewed",
		emptyHint: "Notes you open will appear here, newest first.",
	},
	{
		id: "least_viewed",
		label: "Least Viewed",
		icon: "Snowflake",
		description: "Notes you rarely (or never) open",
		stat: "views",
		emptyHint: "No notes yet.",
	},
	{
		id: "oldest",
		label: "Oldest",
		icon: "Archive",
		description: "Notes by creation date, oldest first",
		stat: "created",
		emptyHint: "No notes yet.",
	},
];

/** Parse SQLite datetime ('YYYY-MM-DD HH:MM:SS', UTC) or ISO strings. */
function parseDbDate(value: string | null | undefined): Date | null {
	if (!value) return null;
	const iso = value.includes("T") ? value : `${value.replace(" ", "T")}Z`;
	const date = new Date(iso);
	return Number.isNaN(date.getTime()) ? null : date;
}

function formatRelative(value: string | null | undefined): string {
	const date = parseDbDate(value);
	if (!date) return "never";
	const diffMs = Date.now() - date.getTime();
	const diffSec = Math.round(diffMs / 1000);
	const diffMin = Math.round(diffSec / 60);
	const diffHr = Math.round(diffMin / 60);
	const diffDay = Math.round(diffHr / 24);

	if (diffSec < 60) return "just now";
	if (diffMin < 60) return `${diffMin}m ago`;
	if (diffHr < 24) return `${diffHr}h ago`;
	if (diffDay < 30) return `${diffDay}d ago`;
	return date.toLocaleDateString();
}

function formatDate(value: string | null | undefined): string {
	const date = parseDbDate(value);
	return date ? date.toLocaleDateString() : "—";
}

function statText(metric: MetricConfig, note: TopNote): string {
	switch (metric.stat) {
		case "views":
			return note.view_count === 1
				? "1 view"
				: `${note.view_count} views`;
		case "lastViewed":
			return formatRelative(note.last_viewed_at);
		case "created":
			return formatDate(note.created_at);
	}
}

export function TopNotesView() {
	const [metric, setMetric] = useState<TopNotesMetric>("most_viewed");
	const [notes, setNotes] = useState<TopNote[]>([]);
	const [loading, setLoading] = useState(true);
	const { openItemInTab } = useTabManagement();

	const activeMetric: MetricConfig =
		METRICS.find((m) => m.id === metric) ?? METRICS[0]!;

	const load = useCallback(async () => {
		setLoading(true);
		const result = await getTopNotes(metric, 50);
		setNotes(result);
		setLoading(false);
	}, [metric]);

	useEffect(() => {
		load();
	}, [load]);

	const openNote = (note: TopNote) => {
		openItemInTab({ id: note.id, title: note.title, type: "note" });
	};

	return (
		<div className="h-full overflow-auto bg-white dark:bg-gray-900">
			<div className="max-w-4xl mx-auto p-4 space-y-5">
				{/* Header */}
				<div className="border-b border-gray-200 dark:border-gray-700 pb-4 flex items-center justify-between gap-4">
					<div>
						<h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
							Top Notes
						</h1>
						<p className="text-xs text-gray-500 dark:text-gray-400">
							{activeMetric.description}
						</p>
					</div>
					<button
						type="button"
						onClick={load}
						title="Refresh"
						className="flex-shrink-0 inline-flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 cursor-pointer"
					>
						<Icons.RefreshCw className="w-3.5 h-3.5" />
						Refresh
					</button>
				</div>

				{/* Metric selector */}
				<div className="flex flex-wrap gap-2">
					{METRICS.map((m) => {
						const Icon = Icons[m.icon] as React.ComponentType<{
							className?: string;
						}>;
						const isActive = m.id === metric;
						return (
							<button
								key={m.id}
								type="button"
								onClick={() => setMetric(m.id)}
								className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm transition-colors cursor-pointer ${
									isActive
										? "border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
										: "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-gray-400 dark:hover:border-gray-500"
								}`}
							>
								<Icon className="w-4 h-4" />
								{m.label}
							</button>
						);
					})}
				</div>

				{/* List */}
				{loading ? (
					<div className="text-sm text-gray-500 dark:text-gray-400 py-8 text-center">
						Loading…
					</div>
				) : notes.length === 0 ? (
					<div className="text-sm text-gray-500 dark:text-gray-400 py-8 text-center">
						{activeMetric.emptyHint}
					</div>
				) : (
					<ol className="space-y-1">
						{notes.map((note, index) => (
							<li key={note.id}>
								<button
									type="button"
									onClick={() => openNote(note)}
									className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer group"
								>
									<span className="w-6 flex-shrink-0 text-right text-xs tabular-nums text-gray-400 dark:text-gray-500">
										{index + 1}
									</span>
									<Icons.FileText className="w-4 h-4 flex-shrink-0 text-gray-400 dark:text-gray-500" />
									<span className="flex-1 min-w-0 truncate text-sm text-gray-900 dark:text-gray-100">
										{note.title || "Untitled"}
									</span>
									<span className="flex-shrink-0 text-xs tabular-nums text-gray-500 dark:text-gray-400">
										{statText(activeMetric, note)}
									</span>
								</button>
							</li>
						))}
					</ol>
				)}
			</div>
		</div>
	);
}
