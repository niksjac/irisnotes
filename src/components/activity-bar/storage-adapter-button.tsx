import { useState, useRef, useEffect } from "react";
import clsx from "clsx";
import * as Icons from "lucide-react";
import { useConfig } from "@/hooks";
import { getAvailableBackends } from "@/storage/factory";
import type { StorageBackend } from "@/storage/types";

export function StorageAdapterButton() {
	const [isOpen, setIsOpen] = useState(false);
	const [isActive, setIsActive] = useState(false);
	const dropdownRef = useRef<HTMLDivElement>(null);
	const { config, updateConfig } = useConfig();

	const availableBackends = getAvailableBackends() as StorageBackend[];
	const currentBackend = config.storage.backend;

	// Close dropdown when clicking outside
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
				setIsOpen(false);
				setIsActive(false);
			}
		};

		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	const handleBackendChange = async (backend: StorageBackend) => {
		try {
			// Update config with new backend
			await updateConfig({
				storage: {
					...config.storage,
					backend,
				},
			});
			setIsOpen(false);
			setIsActive(false);
		} catch (error) {
			console.error("Failed to change storage backend:", error);
		}
	};

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
				return "SQLite Database";
			case "json-single":
				return "Single JSON File";
			case "json-hybrid":
				return "JSON + Files";
			case "cloud":
				return "Cloud Storage";
			default:
				return backend;
		}
	};

	return (
		<div className="relative" ref={dropdownRef}>
			<button
				className={clsx(
					"flex items-center justify-center border-none rounded-none bg-transparent cursor-pointer transition-all duration-200 text-lg font-semibold p-0",
					"w-8 h-8 md:w-6 md:h-6",
					"text-gray-600 dark:text-gray-400",
					"hover:text-gray-900 dark:hover:text-gray-100",
					"hover:scale-110",
					{
						"text-blue-500 scale-110": isActive,
					}
				)}
				onClick={() => {
					setIsOpen(!isOpen);
					setIsActive(!isOpen);
				}}
				title={`Storage Adapter: ${getBackendLabel(currentBackend)}`}
			>
				<Icons.HardDrive size={18} className="md:w-5 md:h-5" />
			</button>

			{/* Dropdown Menu */}
			{isOpen && (
				<div
					className={clsx(
						"absolute z-50 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg",
						// Mobile: below button, full width
						"left-0 right-0 top-full mt-1 w-48",
						// Desktop: below button, left-aligned
						"md:left-0 md:right-auto md:w-48"
					)}
				>
					<div className="py-1">
						{/* Current backend indicator */}
						<div className="px-3 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
							Current: {getBackendLabel(currentBackend)}
						</div>

						{/* Backend options */}
						{availableBackends.map((backend) => {
							const Icon = getBackendIcon(backend);
							const isCurrent = backend === currentBackend;

							return (
								<button
									key={backend}
									className={clsx(
										"w-full px-3 py-2 text-left text-sm flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors",
										{
											"bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400": isCurrent,
											"text-gray-700 dark:text-gray-300": !isCurrent,
										}
									)}
									onClick={() => handleBackendChange(backend)}
									disabled={isCurrent}
								>
									<Icon size={16} />
									<span>{getBackendLabel(backend)}</span>
									{isCurrent && <Icons.Check size={14} className="ml-auto" />}
								</button>
							);
						})}
					</div>
				</div>
			)}
		</div>
	);
}
