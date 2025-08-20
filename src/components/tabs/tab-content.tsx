import type { FC } from "react";
import type { Tab } from "@/types";
import { View } from "@/view";

interface TabContentProps {
	tab: Tab | null;
}

export const TabContent: FC<TabContentProps> = ({ tab }) => {
	if (!tab) {
		return (
			<div className="flex-1 flex items-center justify-center text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-900">
				<div className="text-center">
					<div className="mb-4 text-6xl">📋</div>
					<p className="text-lg mb-2">Empty Pane</p>
					<p className="text-sm">Create a new tab to get started</p>
					<p className="text-xs mt-4 text-gray-400 dark:text-gray-500">Click the + button to add a tab</p>
				</div>
			</div>
		);
	}

	return (
		<div className="flex-1 flex flex-col overflow-hidden">
			<View viewType={tab.viewType} viewData={tab.viewData} />
		</div>
	);
};
