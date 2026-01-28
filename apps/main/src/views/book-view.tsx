import type { FC } from "react";
import { Book, Folder, ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";
import { useContainerView } from "@/hooks/use-container-view";
import { useTabManagement } from "@/hooks/use-tab-management";
import { ItemsTable } from "@/components/items-table";
import type { ContainerItem } from "@/hooks/use-container-view";

interface BookViewProps {
	viewData?: {
		bookId?: string;
	};
}

/**
 * Book view - displays an overview of all sections and notes within a book
 */
export const BookView: FC<BookViewProps> = ({ viewData }) => {
	const bookId = viewData?.bookId;
	const { container, sections, childrenBySection, getAllDescendants } =
		useContainerView(bookId);
	const { openItemInTab } = useTabManagement();
	const [collapsedSections, setCollapsedSections] = useState<Set<string>>(
		new Set(),
	);

	const handleItemClick = (item: ContainerItem) => {
		openItemInTab({
			id: item.id,
			title: item.title,
			type: item.type,
		});
	};

	const toggleSection = (sectionId: string) => {
		setCollapsedSections((prev) => {
			const next = new Set(prev);
			if (next.has(sectionId)) {
				next.delete(sectionId);
			} else {
				next.add(sectionId);
			}
			return next;
		});
	};

	if (!bookId || !container) {
		return (
			<div className="h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
				No book selected
			</div>
		);
	}

	const allItems = getAllDescendants;
	const sectionCount = sections.length;
	const noteCount = allItems.filter((c) => c.type === "note").length;
	const totalWords = allItems.reduce((sum, c) => sum + c.wordCount, 0);

	// Items directly under the book (not in a section)
	const rootItems = childrenBySection.get(null) ?? [];

	return (
		<div className="h-full flex flex-col bg-white dark:bg-gray-900">
			{/* Header */}
			<div className="border-b border-gray-200 dark:border-gray-700 p-4">
				<div className="flex items-center gap-3">
					<Book className="w-6 h-6 text-blue-600 dark:text-blue-400" />
					<div>
						<h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
							{container.title}
						</h1>
						<p className="text-sm text-gray-500 dark:text-gray-400">
							{sectionCount} {sectionCount === 1 ? "section" : "sections"} •{" "}
							{noteCount} {noteCount === 1 ? "note" : "notes"} •{" "}
							{totalWords.toLocaleString()} words
						</p>
					</div>
				</div>
			</div>

			{/* Content */}
			<div className="flex-1 overflow-auto px-4 py-2 space-y-2">
				{/* Root items (directly under book) */}
				{rootItems.length > 0 && (
					<div>
						<h2 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 px-1">
							Direct Items
						</h2>
						<ItemsTable
							items={rootItems}
							onItemClick={handleItemClick}
							showTypeColumn={true}
						/>
					</div>
				)}

				{/* Sections with their contents */}
				{sections.map((section) => {
					const sectionItems = childrenBySection.get(section.id) ?? [];
					const isCollapsed = collapsedSections.has(section.id);
					const sectionWords = sectionItems.reduce(
						(sum, c) => sum + c.wordCount,
						0,
					);

					return (
						<div
							key={section.id}
							className="border border-gray-200 dark:border-gray-700 rounded overflow-hidden"
						>
							{/* Section header */}
							<button
								type="button"
								tabIndex={-1}
								onClick={() => toggleSection(section.id)}
								className="w-full flex items-center gap-1.5 px-2 py-1 bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
							>
								{isCollapsed ? (
									<ChevronRight className="w-3.5 h-3.5 text-gray-400" />
								) : (
									<ChevronDown className="w-3.5 h-3.5 text-gray-400" />
								)}
								<Folder className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
								<span className="text-sm font-medium text-gray-900 dark:text-gray-100">
									{section.title}
								</span>
								<span className="text-xs text-gray-500 dark:text-gray-400 ml-auto">
									{sectionItems.length} • {sectionWords.toLocaleString()}w
								</span>
							</button>

							{/* Section content */}
							{!isCollapsed && (
								<div className="px-1 py-1">
									{sectionItems.length > 0 ? (
										<ItemsTable
											items={sectionItems}
											onItemClick={handleItemClick}
											showTypeColumn={true}
										/>
									) : (
										<div className="text-center py-2 text-gray-500 dark:text-gray-400 text-xs">
											Empty section
										</div>
									)}
								</div>
							)}
						</div>
					);
				})}

				{/* Empty state */}
				{sections.length === 0 && rootItems.length === 0 && (
					<div className="text-center py-8 text-gray-500 dark:text-gray-400">
						This book is empty
					</div>
				)}
			</div>
		</div>
	);
};
