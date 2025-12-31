import type { FC } from "react";
import { useState } from "react";
import type { Tab } from "@/types";

interface TabProps {
	tab: Tab;
	isActive: boolean;
	onSelect: (tabId: string) => void;
	onClose?: (tabId: string) => void;
	onDragStart?: (tabId: string) => void;
	onDragOver?: (tabId: string) => void;
	onDrop?: (draggedTabId: string, targetTabId: string) => void;
	isDragging?: boolean;
}

export const TabComponent: FC<TabProps> = ({
	tab,
	isActive,
	onSelect,
	onClose,
	onDragStart,
	onDragOver,
	onDrop,
	isDragging = false,
}) => {
	const [draggedOver, setDraggedOver] = useState(false);

	const handleClick = () => {
		onSelect(tab.id);
	};

	const handleClose = (e: React.MouseEvent) => {
		e.stopPropagation();
		if (onClose) {
			onClose(tab.id);
		}
	};

	const handleDragStart = (e: React.DragEvent) => {
		e.dataTransfer.setData("text/plain", tab.id);
		e.dataTransfer.effectAllowed = "move";
		if (onDragStart) {
			onDragStart(tab.id);
		}
	};

	const handleDragOver = (e: React.DragEvent) => {
		e.preventDefault();
		e.dataTransfer.dropEffect = "move";
		setDraggedOver(true);
		if (onDragOver) {
			onDragOver(tab.id);
		}
	};

	const handleDragLeave = () => {
		setDraggedOver(false);
	};

	const handleDrop = (e: React.DragEvent) => {
		e.preventDefault();
		const draggedTabId = e.dataTransfer.getData("text/plain");
		setDraggedOver(false);
		if (onDrop && draggedTabId !== tab.id) {
			onDrop(draggedTabId, tab.id);
		}
	};

	return (
		<div
			className={`
				flex items-center px-3 py-2 border-r border-gray-300 dark:border-gray-600 cursor-pointer
				min-w-0 max-w-xs relative group transition-all duration-200
				${
					isActive
						? "bg-white dark:bg-gray-900 border-b-2 border-b-blue-500"
						: "bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700"
				}
				${isDragging ? "opacity-50 cursor-grabbing" : "cursor-grab"}
				${draggedOver ? "border-l-4 border-l-blue-500" : ""}
			`}
			onClick={handleClick}
			draggable
			onDragStart={handleDragStart}
			onDragOver={handleDragOver}
			onDragLeave={handleDragLeave}
			onDrop={handleDrop}
		>
			{/* Tab title */}
			<span
				className={`
					text-sm truncate flex-1
					${isActive ? "text-gray-900 dark:text-gray-100" : "text-gray-600 dark:text-gray-400"}
					${tab.isDirty ? "italic" : ""}
				`}
				title={tab.title}
			>
				{tab.title}
				{tab.isDirty && " •"}
			</span>

			{/* Close button */}
			<button
				className="ml-2 w-4 h-4 flex items-center justify-center rounded text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-200"
				onClick={handleClose}
				title="Close tab"
				tabIndex={-1}
			>
				<svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
					<path d="M6 4.586L10.293.293a1 1 0 011.414 1.414L7.414 6l4.293 4.293a1 1 0 01-1.414 1.414L6 7.414l-4.293 4.293a1 1 0 01-1.414-1.414L4.586 6 .293 1.707A1 1 0 011.707.293L6 4.586z" />
				</svg>
			</button>
		</div>
	);
};
