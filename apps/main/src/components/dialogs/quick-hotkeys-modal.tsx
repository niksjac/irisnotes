import { useEffect, useMemo, useRef } from "react";
import { X, Keyboard } from "lucide-react";
import { useHotkeysConfig } from "@/hooks/use-hotkeys-config";
import {
	PROSEMIRROR_HOTKEYS,
} from "@/config/editor-hotkeys";

interface QuickHotkeysModalProps {
	isOpen: boolean;
	onClose: () => void;
}

/**
 * Format a hotkey string for display
 */
function formatHotkey(key: string | undefined): string {
	if (!key) return "";
	return key
		.split("+")
		.map((part) => {
			const lower = part.toLowerCase();
			if (lower === "ctrl" || lower === "control" || lower === "mod") return "Ctrl";
			if (lower === "shift") return "Shift";
			if (lower === "alt") return "Alt";
			if (lower === "meta") return "⌘";
			if (lower === "comma") return ",";
			if (lower === "period") return ".";
			if (lower === "arrowup" || lower === "up") return "↑";
			if (lower === "arrowdown" || lower === "down") return "↓";
			if (lower === "arrowleft" || lower === "left") return "←";
			if (lower === "arrowright" || lower === "right") return "→";
			if (lower === "tab") return "Tab";
			if (lower === "enter") return "Enter";
			if (lower === "escape" || lower === "esc") return "Esc";
			if (lower === "backspace") return "⌫";
			if (lower === "delete") return "Del";
			if (lower === "space") return "Space";
			return part.charAt(0).toUpperCase() + part.slice(1);
		})
		.join("+");
}

export function QuickHotkeysModal({ isOpen, onClose }: QuickHotkeysModalProps) {
	const modalRef = useRef<HTMLDivElement>(null);
	const { hotkeys: hotkeyMapping } = useHotkeysConfig();

	// Close on Escape
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Escape") {
				onClose();
			}
		};

		if (isOpen) {
			document.addEventListener("keydown", handleKeyDown);
			return () => document.removeEventListener("keydown", handleKeyDown);
		}
		return undefined;
	}, [isOpen, onClose]);

	// Close when clicking outside
	useEffect(() => {
		const handleClickOutside = (e: MouseEvent) => {
			if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
				onClose();
			}
		};

		if (isOpen) {
			document.addEventListener("mousedown", handleClickOutside);
			return () => document.removeEventListener("mousedown", handleClickOutside);
		}
		return undefined;
	}, [isOpen, onClose]);

	// Organize hotkeys by category
	const hotkeySections = useMemo(() => {
		const sections: Array<{
			title: string;
			hotkeys: Array<{ key: string; description: string }>;
		}> = [];

		// App hotkeys from config
		const appByCategory = new Map<string, Array<{ key: string; description: string }>>();
		Object.entries(hotkeyMapping).forEach(([, config]) => {
			const category = config.category;
			if (!appByCategory.has(category)) {
				appByCategory.set(category, []);
			}
			appByCategory.get(category)?.push({
				key: formatHotkey(config.key),
				description: config.description,
			});
		});

		// Add app sections in order
		const categoryOrder = [
			"Layout",
			"Focus",
			"Tabs",
			"Tab Navigation",
			"Panes",
			"Editor",
			"Notes",
			"Search",
			"Views",
		];

		for (const category of categoryOrder) {
			const items = appByCategory.get(category);
			if (items && items.length > 0) {
				sections.push({ title: category, hotkeys: items });
			}
		}

		// Add remaining categories
		for (const [category, items] of appByCategory) {
			if (!categoryOrder.includes(category) && items.length > 0) {
				sections.push({ title: category, hotkeys: items });
			}
		}

		// Add essential editor hotkeys
		const editorHotkeys = PROSEMIRROR_HOTKEYS.slice(0, 10).map((h) => ({
			key: formatHotkey(h.key),
			description: h.description,
		}));
		if (editorHotkeys.length > 0) {
			sections.push({ title: "Editor Formatting", hotkeys: editorHotkeys });
		}

		return sections;
	}, [hotkeyMapping]);

	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50">
			<div
				ref={modalRef}
				className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl max-w-4xl w-full max-h-[80vh] overflow-hidden flex flex-col mx-4"
			>
				{/* Header */}
				<div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
					<div className="flex items-center gap-2">
						<Keyboard size={20} className="text-blue-500" />
						<h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
							Keyboard Shortcuts
						</h2>
					</div>
					<button
						type="button"
						onClick={onClose}
						className="p-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
					>
						<X size={20} />
					</button>
				</div>

				{/* Content - Multi-column grid */}
				<div className="flex-1 overflow-y-auto p-6">
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
						{hotkeySections.map((section) => (
							<div key={section.title} className="space-y-2">
								<h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
									{section.title}
								</h3>
								<div className="space-y-1">
									{section.hotkeys.map((hotkey, index) => (
										<div
											key={`${section.title}-${index}`}
											className="flex items-center justify-between gap-4 text-sm"
										>
											<span className="text-gray-700 dark:text-gray-300 truncate">
												{hotkey.description}
											</span>
											<kbd className="flex-shrink-0 px-2 py-0.5 text-xs font-mono bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded border border-gray-300 dark:border-gray-600">
												{hotkey.key}
											</kbd>
										</div>
									))}
								</div>
							</div>
						))}
					</div>
				</div>

				{/* Footer */}
				<div className="px-6 py-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
					<p className="text-xs text-gray-500 dark:text-gray-400 text-center">
						Press <kbd className="px-1.5 py-0.5 text-xs font-mono bg-gray-200 dark:bg-gray-700 rounded">Esc</kbd> to close
						{" • "}
						<kbd className="px-1.5 py-0.5 text-xs font-mono bg-gray-200 dark:bg-gray-700 rounded">Ctrl+Shift+.</kbd> for full keyboard shortcuts view
					</p>
				</div>
			</div>
		</div>
	);
}
