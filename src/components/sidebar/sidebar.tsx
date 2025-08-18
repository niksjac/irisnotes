import type React from "react";
import { useItems, useNotesStorage } from "@/hooks";
import { TreeView } from "../tree";
import { TreeSwitcher } from "../tree/tree-switcher";

export const Sidebar: React.FC = () => {
	const { isInitialized } = useNotesStorage();
	const { isLoading } = useItems();

	if (!isInitialized || isLoading) {
		return (
			<div className="flex items-center justify-center h-full">
				<div className="text-center">
					<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
					<p className="text-sm text-gray-500">Loading notes...</p>
				</div>
			</div>
		);
	}

	return (
		<div className="flex flex-col h-full bg-white dark:bg-gray-900">
			<div className="flex-shrink-0 p-2 border-b border-gray-200 dark:border-gray-700">
				<TreeSwitcher />
			</div>
			<div className="flex-1 overflow-hidden">
				<TreeView />
			</div>
		</div>
	);
};
