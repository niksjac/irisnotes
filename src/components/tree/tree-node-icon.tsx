import { ChevronRight, FileText, Folder } from "lucide-react";
import type { TreeNodeIconProps } from "./types";

export function TreeNodeIcon({ isFolder, isExpanded, isCategory }: TreeNodeIconProps) {
	return (
		<>
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
		</>
	);
}
