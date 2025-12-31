import * as Icons from "lucide-react";
import { useConfig } from "@/hooks";
import type { StorageBackend } from "@/storage/types";
import { useAtom } from "jotai";
import { focusAreaAtom } from "@/atoms";

export function StorageIndicator() {
	const { config } = useConfig();
	const currentBackend = config.storage.backend;
	const [focusArea] = useAtom(focusAreaAtom);
	const treeHasFocus = focusArea === "tree";

	const getBackendIcon = (backend: StorageBackend) => {
		switch (backend) {
			case "sqlite":
				return Icons.Database;
			case "json-single":
				return Icons.FileText;
			case "json-hybrid":
				return Icons.FolderOpen;
			case "cloud":
				return Icons.Cloud;
			default:
				return Icons.HardDrive;
		}
	};

	const getBackendLabel = (backend: StorageBackend) => {
		switch (backend) {
			case "sqlite":
				return "SQLite";
			case "json-single":
				return "JSON File";
			case "json-hybrid":
				return "JSON + Files";
			case "cloud":
				return "Cloud";
			default:
				return backend;
		}
	};

	const IconComponent = getBackendIcon(currentBackend);

	return (
		<div className={`flex items-center gap-2 px-3 py-2 text-xs text-gray-600 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700 ${treeHasFocus ? "bg-blue-100 dark:bg-[#132247]" : "bg-gray-50 dark:bg-gray-800"}`}>
			<IconComponent size={14} />
			<span>Storage: {getBackendLabel(currentBackend)}</span>
		</div>
	);
}
