import type { FC } from "react";
import { FileText, Folder, Book, Calendar, Clock, Hash } from "lucide-react";
import type { ContainerItem } from "@/hooks/use-container-view";
import { formatDate } from "@/hooks/use-container-view";

interface ItemsTableProps {
	items: ContainerItem[];
	onItemClick: (item: ContainerItem) => void;
	showTypeColumn?: boolean;
}

const getItemIcon = (type: ContainerItem["type"]) => {
	switch (type) {
		case "book":
			return <Book className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 flex-shrink-0" />;
		case "section":
			return <Folder className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 flex-shrink-0" />;
		case "note":
			return <FileText className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400 flex-shrink-0" />;
	}
};

const getTypeLabel = (type: ContainerItem["type"]) => {
	switch (type) {
		case "book":
			return "Book";
		case "section":
			return "Section";
		case "note":
			return "Note";
	}
};

/**
 * Compact list component for displaying items in container views
 * Shows: icon + title | type | words | created | modified
 */
export const ItemsTable: FC<ItemsTableProps> = ({
	items,
	onItemClick,
}) => {
	if (items.length === 0) {
		return (
			<div className="text-center py-6 text-sm text-gray-500 dark:text-gray-400">
				No items
			</div>
		);
	}

	return (
		<div className="flex flex-col text-xs">
			{/* Header row */}
			<div className="flex items-center gap-2 px-2 py-1 text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
				<span className="flex-1">Title</span>
				<span className="w-14 text-center">Type</span>
				<span className="w-12 text-right">Words</span>
				<span className="w-20 text-right">Created</span>
				<span className="w-20 text-right">Modified</span>
			</div>
			{/* Data rows */}
			{items.map((item, index) => (
				<div
					key={item.id}
					onClick={() => onItemClick(item)}
					onKeyDown={(e) => {
						if (e.key === "Enter" || e.key === " ") {
							e.preventDefault();
							onItemClick(item);
						}
					}}
					tabIndex={0}
					className={`
						flex items-center gap-2 px-2 py-1.5 cursor-pointer transition-colors
						hover:bg-gray-100 dark:hover:bg-gray-800/50
						focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-inset
						${index > 0 ? "border-t border-gray-100 dark:border-gray-800/50" : ""}
					`}
				>
					{/* Icon + Title */}
					<div className="flex items-center gap-1.5 flex-1 min-w-0">
						{getItemIcon(item.type)}
						<span className="text-sm text-gray-900 dark:text-gray-100 truncate">
							{item.title}
						</span>
					</div>
					{/* Type */}
					<span className="w-14 text-center text-gray-500 dark:text-gray-400">
						{getTypeLabel(item.type)}
					</span>
					{/* Words */}
					<span className="w-12 text-right text-gray-500 dark:text-gray-400 tabular-nums">
						{item.wordCount > 0 ? item.wordCount.toLocaleString() : "—"}
					</span>
					{/* Created */}
					<span className="w-20 text-right text-gray-400 dark:text-gray-500 tabular-nums">
						{formatDate(item.created_at)}
					</span>
					{/* Modified */}
					<span className="w-20 text-right text-gray-400 dark:text-gray-500 tabular-nums">
						{formatDate(item.updated_at)}
					</span>
				</div>
			))}
		</div>
	);
};
