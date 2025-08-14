import type { FC } from "react";
import type { Tab } from "@/types";
import { ViewRenderer } from "@/view-renderer";

interface TabContentProps {
	tab: Tab | null;
}

export const TabContent: FC<TabContentProps> = ({ tab }) => {
	if (!tab) {
		return (
			<div className="flex-1 flex items-center justify-center text-gray-500">
				<div className="text-center">
					<p className="text-lg mb-2">No tab selected</p>
					<p className="text-sm">Select a tab or create a new one</p>
				</div>
			</div>
		);
	}

	return (
		<div className="flex-1 overflow-hidden">
			<ViewRenderer viewType={tab.viewType} viewData={tab.viewData} />
		</div>
	);
};
