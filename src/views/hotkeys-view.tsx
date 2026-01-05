import * as Icons from "lucide-react";

interface HotkeyGroup {
	title: string;
	icon: React.ReactNode;
	shortcuts: { keys: string; description: string }[];
}

export function HotkeysView() {
	const hotkeyGroups: HotkeyGroup[] = [
		{
			title: "General",
			icon: <Icons.Layout className="w-5 h-5" />,
			shortcuts: [
				{ keys: "Ctrl+B", description: "Toggle sidebar" },
				{ keys: "Ctrl+J", description: "Toggle activity bar" },
				{ keys: "Ctrl+D", description: "Toggle dual pane" },
				{ keys: "Alt+Z", description: "Toggle line wrapping" },
			],
		},
		{
			title: "Tabs",
			icon: <Icons.LayoutGrid className="w-5 h-5" />,
			shortcuts: [
				{ keys: "Ctrl+T", description: "New tab" },
				{ keys: "Ctrl+W", description: "Close tab" },
				{ keys: "Ctrl+Tab", description: "Next tab" },
				{ keys: "Ctrl+Shift+Tab", description: "Previous tab" },
				{ keys: "Ctrl+1-9", description: "Switch to tab 1-9" },
			],
		},
		{
			title: "Panes",
			icon: <Icons.Columns2 className="w-5 h-5" />,
			shortcuts: [
				{ keys: "Ctrl+1", description: "Focus pane 1" },
				{ keys: "Ctrl+2", description: "Focus pane 2" },
				{ keys: "Alt+←/→", description: "Resize pane" },
				{ keys: "Ctrl+Shift+←", description: "Move tab to left pane" },
				{ keys: "Ctrl+Shift+→", description: "Move tab to right pane" },
			],
		},
		{
			title: "Editor - Formatting",
			icon: <Icons.Type className="w-5 h-5" />,
			shortcuts: [
				{ keys: "Ctrl+B", description: "Bold" },
				{ keys: "Ctrl+I", description: "Italic" },
				{ keys: "Ctrl+`", description: "Code" },
				{ keys: "Ctrl+Shift+X", description: "Strikethrough" },
			],
		},
		{
			title: "Editor - Headings",
			icon: <Icons.Heading className="w-5 h-5" />,
			shortcuts: [
				{ keys: "Ctrl+Shift+1", description: "Heading 1" },
				{ keys: "Ctrl+Shift+2", description: "Heading 2" },
				{ keys: "Ctrl+Shift+3", description: "Heading 3" },
				{ keys: "Ctrl+Shift+0", description: "Paragraph" },
			],
		},
		{
			title: "Editor - Lists",
			icon: <Icons.List className="w-5 h-5" />,
			shortcuts: [
				{ keys: "Ctrl+Shift+8", description: "Bullet list" },
				{ keys: "Ctrl+Shift+9", description: "Numbered list" },
				{ keys: "Tab", description: "Indent list item" },
				{ keys: "Shift+Tab", description: "Outdent list item" },
			],
		},
		{
			title: "Navigation",
			icon: <Icons.Navigation className="w-5 h-5" />,
			shortcuts: [
				{ keys: "↑/↓", description: "Navigate tree" },
				{ keys: "Enter", description: "Open selected item" },
				{ keys: "F2", description: "Rename selected item" },
				{ keys: "Delete", description: "Delete selected item" },
				{ keys: "Escape", description: "Close modal / Cancel" },
			],
		},
	];

	return (
		<div className="h-full overflow-auto bg-white dark:bg-gray-900">
			<div className="max-w-4xl mx-auto p-6 space-y-6">
				{/* Header */}
				<div className="border-b border-gray-200 dark:border-gray-700 pb-4">
					<h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
						<Icons.Keyboard className="w-7 h-7" />
						Keyboard Shortcuts
					</h1>
					<p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
						Quick reference for all available keyboard shortcuts
					</p>
				</div>

				{/* Tip */}
				<div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
					<div className="flex items-start gap-3">
						<Icons.Lightbulb className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
						<div className="text-sm text-blue-800 dark:text-blue-200">
							<strong>Tip:</strong> On macOS, use <kbd className="px-1.5 py-0.5 bg-blue-100 dark:bg-blue-800 rounded text-xs font-mono">⌘</kbd> (Command) instead of <kbd className="px-1.5 py-0.5 bg-blue-100 dark:bg-blue-800 rounded text-xs font-mono">Ctrl</kbd>
						</div>
					</div>
				</div>

				{/* Shortcut Groups */}
				<div className="grid gap-6 md:grid-cols-2">
					{hotkeyGroups.map((group) => (
						<div
							key={group.title}
							className="bg-gray-50 dark:bg-gray-800 rounded-lg overflow-hidden"
						>
							{/* Group Header */}
							<div className="px-4 py-3 bg-gray-100 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
								<h2 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
									{group.icon}
									{group.title}
								</h2>
							</div>

							{/* Shortcuts */}
							<div className="divide-y divide-gray-200 dark:divide-gray-700">
								{group.shortcuts.map((shortcut) => (
									<div
										key={shortcut.keys}
										className="px-4 py-2.5 flex items-center justify-between"
									>
										<span className="text-sm text-gray-700 dark:text-gray-300">
											{shortcut.description}
										</span>
										<kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded text-xs font-mono whitespace-nowrap">
											{shortcut.keys}
										</kbd>
									</div>
								))}
							</div>
						</div>
					))}
				</div>
			</div>
		</div>
	);
}
