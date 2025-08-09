import { useState, useRef, useEffect } from "react";
import { ChevronRight, FileText, Folder } from "lucide-react";
import type { TreeContextData } from "@/types/context-menu";

interface TreeNodeProps {
	node: {
		id: string;
		isInternal: boolean;
		isOpen: boolean;
		isFocused: boolean;
		isSelected: boolean;
		isDragging: boolean;
		isEditing?: boolean;
		data: {
			id: string;
			name: string;
			type?: "category" | "note";
		};
		toggle: () => void;
		edit?: () => void;
		submit?: (value: string) => void;
		reset?: () => void;
	};
	style: React.CSSProperties;
	dragHandle?: (el: HTMLDivElement | null) => void;
	onContextMenu?: (event: React.MouseEvent, data: TreeContextData) => void;
}

export function TreeNode({ node, style, dragHandle, onContextMenu }: TreeNodeProps) {
	const isFolder = node.isInternal;
	const isExpanded = node.isOpen;
	const nodeType = node.data.type;
	const isCategory = nodeType === "category";
	const isEditing = node.isEditing;

	const [editValue, setEditValue] = useState(node.data.name);
	const inputRef = useRef<HTMLInputElement>(null);

	// Focus input when editing starts
	useEffect(() => {
		if (isEditing && inputRef.current) {
			inputRef.current.focus();
			inputRef.current.select();
		}
	}, [isEditing]);

	// Reset edit value when node name changes
	useEffect(() => {
		setEditValue(node.data.name);
	}, [node.data.name]);

	const handleSubmit = () => {
		if (node.submit && editValue.trim()) {
			node.submit(editValue.trim());
		}
	};

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === "Enter") {
			e.preventDefault();
			handleSubmit();
		} else if (e.key === "Escape") {
			e.preventDefault();
			if (node.reset) {
				node.reset();
			}
			setEditValue(node.data.name);
		}
	};

	const handleBlur = () => {
		handleSubmit();
	};

	// Create dynamic className based on node state
	const getNodeClassName = () => {
		const baseClasses = "flex items-center gap-2 h-9 px-2 cursor-pointer transition-colors";

		if (node.isSelected) {
			return `${baseClasses} bg-blue-100 dark:bg-blue-900/50 text-blue-900 dark:text-blue-100`;
		}

		if (node.isFocused) {
			return `${baseClasses} bg-gray-200 dark:bg-gray-700 ring-2 ring-blue-500 ring-inset`;
		}

		if (node.isDragging) {
			return `${baseClasses} opacity-50 bg-gray-100 dark:bg-gray-800`;
		}

		return `${baseClasses} hover:bg-gray-100 dark:hover:bg-gray-800`;
	};

	const handleContextMenu = (event: React.MouseEvent) => {
		if (onContextMenu) {
			const contextData: TreeContextData = {
				nodeId: node.data.id,
				nodeType: isCategory ? "category" : "note",
				nodeName: node.data.name,
			};
			onContextMenu(event, contextData);
		}
	};

	return (
		<div
			ref={dragHandle}
			style={style}
			className={getNodeClassName()}
			onClick={() => node.toggle()}
			onContextMenu={handleContextMenu}
		>
			{isFolder && (
				<ChevronRight
					className={`h-4 w-4 text-gray-500 dark:text-gray-400 transition-transform ${isExpanded ? "rotate-90" : ""}`}
				/>
			)}

			{!isFolder && <div className="w-4" />}

			{isCategory || isFolder ? (
				<Folder className="h-4 w-4 text-blue-500 dark:text-blue-400" />
			) : (
				<FileText className="h-4 w-4 text-gray-600 dark:text-gray-300" />
			)}

			{isEditing ? (
				<input
					ref={inputRef}
					type="text"
					value={editValue}
					onChange={(e) => setEditValue(e.target.value)}
					onKeyDown={handleKeyDown}
					onBlur={handleBlur}
					className="flex-1 px-1 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-blue-500 rounded outline-none"
				/>
			) : (
				<span className="flex-1 truncate text-sm text-gray-900 dark:text-gray-100">{node.data.name}</span>
			)}
		</div>
	);
}
