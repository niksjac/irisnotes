import type { FC } from "react";
import { FileText, Folder, Book } from "lucide-react";
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
			return <Book className="w-4 h-4 text-blue-600 dark:text-blue-400" />;
		case "section":
			return <Folder className="w-4 h-4 text-amber-600 dark:text-amber-400" />;
		case "note":
			return <FileText className="w-4 h-4 text-gray-600 dark:text-gray-400" />;
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
 * Reusable table component for displaying items in container views
 */
export const ItemsTable: FC<ItemsTableProps> = ({
	items,
	onItemClick,
	showTypeColumn = true,
}) => {
	if (items.length === 0) {
		return (
			<div className="text-center py-8 text-gray-500 dark:text-gray-400">
				No items in this container
			</div>
		);
	}

	return (
		<div className="overflow-x-auto">
			<table className="w-full text-sm">
				<thead>
					<tr className="border-b border-gray-200 dark:border-gray-700 text-left text-gray-600 dark:text-gray-400">
						<th className="py-2 px-3 font-medium">Title</th>
						<th className="py-2 px-3 font-medium">Created</th>
						<th className="py-2 px-3 font-medium">Modified</th>
						<th className="py-2 px-3 font-medium text-right">Words</th>
						{showTypeColumn && (
							<th className="py-2 px-3 font-medium">Type</th>
						)}
						<th className="py-2 px-3 font-medium text-xs">ID</th>
					</tr>
				</thead>
				<tbody>
					{items.map((item) => (
						<tr
							key={item.id}
							onClick={() => onItemClick(item)}
							className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors"
						>
							<td className="py-2 px-3">
								<div className="flex items-center gap-2">
									{getItemIcon(item.type)}
									<span className="font-medium text-gray-900 dark:text-gray-100">
										{item.title}
									</span>
								</div>
							</td>
							<td className="py-2 px-3 text-gray-600 dark:text-gray-400">
								{formatDate(item.created_at)}
							</td>
							<td className="py-2 px-3 text-gray-600 dark:text-gray-400">
								{formatDate(item.updated_at)}
							</td>
							<td className="py-2 px-3 text-right text-gray-600 dark:text-gray-400">
								{item.wordCount.toLocaleString()}
							</td>
							{showTypeColumn && (
								<td className="py-2 px-3 text-gray-600 dark:text-gray-400">
									{getTypeLabel(item.type)}
								</td>
							)}
							<td className="py-2 px-3 text-xs text-gray-400 dark:text-gray-500 font-mono">
								{item.id.slice(0, 8)}…
							</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
};
