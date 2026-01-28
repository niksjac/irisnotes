import * as Icons from "lucide-react";
import { useAtom } from "jotai";
import { focusAreaAtom } from "@/atoms";

export function StorageIndicator() {
	const [focusArea] = useAtom(focusAreaAtom);
	const treeHasFocus = focusArea === "tree";

	// SQLite is the only supported backend
	const IconComponent = Icons.Database;
	const label = "SQLite";

	return (
		<div
			className={`flex items-center gap-2 px-3 min-h-[40px] text-xs text-gray-600 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700 ${treeHasFocus ? "bg-blue-100 dark:bg-[#132247]" : "bg-gray-50 dark:bg-gray-800"}`}
		>
			<IconComponent size={14} />
			<span>Storage: {label}</span>
		</div>
	);
}
