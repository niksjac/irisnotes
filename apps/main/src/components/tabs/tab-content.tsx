import type { FC } from "react";
import type { Tab } from "@/types";
import { View } from "@/view";

interface TabContentProps {
	tab: Tab | null;
}

export const TabContent: FC<TabContentProps> = ({ tab }) => {
	if (!tab) {
		return <div className="flex-1 bg-white dark:bg-gray-900" />;
	}

	return (
		<div className="flex-1 flex flex-col overflow-hidden">
			<View key={tab.id} viewType={tab.viewType} viewData={tab.viewData} />
		</div>
	);
};
