import type { FC } from "react";
import { Folder } from "lucide-react";
import { useContainerView } from "@/hooks/use-container-view";
import { useTabManagement } from "@/hooks/use-tab-management";
import { ItemsTable } from "@/components/items-table";
import type { ContainerItem } from "@/hooks/use-container-view";

interface SectionViewProps {
	viewData?: {
		sectionId?: string;
	};
}

/**
 * Section view - displays a table of all notes within a section
 */
export const SectionView: FC<SectionViewProps> = ({ viewData }) => {
	const sectionId = viewData?.sectionId;
	const { container, children } = useContainerView(sectionId);
	const { openItemInTab } = useTabManagement();

	const handleItemClick = (item: ContainerItem) => {
		openItemInTab({
			id: item.id,
			title: item.title,
			type: item.type,
		});
	};

	if (!sectionId || !container) {
		return (
			<div className="h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
				No section selected
			</div>
		);
	}

	const noteCount = children.filter((c) => c.type === "note").length;
	const totalWords = children.reduce((sum, c) => sum + c.wordCount, 0);

	return (
		<div className="h-full flex flex-col bg-white dark:bg-gray-900">
			{/* Header */}
			<div className="border-b border-gray-200 dark:border-gray-700 p-4">
				<div className="flex items-center gap-3">
					<Folder className="w-6 h-6 text-amber-600 dark:text-amber-400" />
					<div>
						<h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
							{container.title}
						</h1>
						<p className="text-sm text-gray-500 dark:text-gray-400">
							{noteCount} {noteCount === 1 ? "note" : "notes"} •{" "}
							{totalWords.toLocaleString()} words
						</p>
					</div>
				</div>
			</div>

			{/* Content */}
			<div className="flex-1 overflow-auto p-4">
				<ItemsTable
					items={children}
					onItemClick={handleItemClick}
					showTypeColumn={false}
				/>
			</div>
		</div>
	);
};
