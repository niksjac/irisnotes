import type { FC } from "react";
import { useState } from "react";
import type { Tab } from "@/types";

// Module-level drag state — avoids custom MIME type issues in WebView
let dragSource: { tabId: string; paneIndex?: number } | null = null;

/** Read the current drag source (used by tab-bar for cross-pane detection) */
export function getDragSource() { return dragSource; }

interface TabProps {
	tab: Tab;
	isActive: boolean;
	onSelect: (tabId: string) => void;
	onClose?: (tabId: string) => void;
	onDragStart?: (tabId: string) => void;
	onDragOver?: (tabId: string) => void;
	onDrop?: (draggedTabId: string, targetTabId: string, sourcePaneIndex?: number) => void;
	isDragging?: boolean;
	paneIndex?: number;
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
	paneIndex,
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
		dragSource = { tabId: tab.id, paneIndex };
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
		e.stopPropagation();
		const draggedTabId = e.dataTransfer.getData("text/plain") || dragSource?.tabId;
		const sourcePaneIndex = dragSource?.paneIndex;
		dragSource = null;
		setDraggedOver(false);
		if (onDrop && draggedTabId && draggedTabId !== tab.id) {
			onDrop(draggedTabId, tab.id, sourcePaneIndex);
		}
	};

	const handleDragEnd = () => {
		dragSource = null;
	};

	return (
		<div
			className={`
				flex items-center px-2 h-full cursor-pointer
				min-w-0 max-w-xs relative group transition-all duration-200
				focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-inset
				${
					isActive
						? "bg-white dark:bg-gray-900 border-b-2 border-b-blue-500"
						: "bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 border-b-2 border-b-transparent"
				}
				${isDragging ? "opacity-50 cursor-grabbing" : "cursor-grab"}
				${draggedOver ? "border-l-4 border-l-blue-500" : ""}
			`}
			onClick={handleClick}
			draggable
			tabIndex={0}
			onKeyDown={(e) => {
				if (e.key === "Enter" || e.key === " ") {
					e.preventDefault();
					handleClick();
				}
			}}
			onDragStart={handleDragStart}
			onDragOver={handleDragOver}
			onDragLeave={handleDragLeave}
			onDrop={handleDrop}
			onDragEnd={handleDragEnd}
		>
			{/* Tab title */}
			<span
				className={`
					text-xs truncate flex-1
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
				className="ml-1.5 w-3 h-3 flex items-center justify-center rounded text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-200"
				onClick={handleClose}
				title="Close tab"
				tabIndex={-1}
			>
				<svg width="8" height="8" viewBox="0 0 12 12" fill="currentColor">
					<path d="M6 4.586L10.293.293a1 1 0 011.414 1.414L7.414 6l4.293 4.293a1 1 0 01-1.414 1.414L6 7.414l-4.293 4.293a1 1 0 01-1.414-1.414L4.586 6 .293 1.707A1 1 0 011.707.293L6 4.586z" />
				</svg>
			</button>
		</div>
	);
};
