import { useHotkeyConfig } from "@/hooks";
import { getHotkeysByCategory } from "@/config/default-hotkeys";

interface HotkeyItem {
	key: string;
	description: string;
	category: string;
}

export function HotkeysView() {
	const { hotkeys: userHotkeys } = useHotkeyConfig();
	const hotkeysByCategory = getHotkeysByCategory(userHotkeys);

	// Convert user hotkeys to the display format
	const configurableHotkeys: HotkeyItem[] = [];
	Object.entries(hotkeysByCategory).forEach(([category, hotkeys]) => {
		hotkeys.forEach(({ config }) => {
			configurableHotkeys.push({
				key: config.key.toUpperCase().replace(/\+/g, '+'),
				description: config.description,
				category: category,
			});
		});
	});

	// Static hotkeys that aren't configurable yet (editor shortcuts, etc.)
	const staticHotkeys: HotkeyItem[] = [
		// Application shortcuts (non-configurable)
		{
			key: "Alt+Z",
			description: "Toggle Line Wrapping",
			category: "Application",
		},
		{ key: "F5", description: "Reload Note", category: "Application" },
		{ key: "F2", description: "Rename Selected Tree Item", category: "Application" },
		{
			key: "Ctrl++",
			description: "Increase Editor Font Size",
			category: "Application",
		},
		{
			key: "Ctrl+-",
			description: "Decrease Editor Font Size",
			category: "Application",
		},

		// Editor formatting
		{ key: "Ctrl+B", description: "Bold", category: "Editor - Formatting" },
		{ key: "Ctrl+I", description: "Italic", category: "Editor - Formatting" },
		{ key: "Ctrl+`", description: "Code", category: "Editor - Formatting" },

		// Editor headings
		{
			key: "Ctrl+Shift+1",
			description: "Heading 1",
			category: "Editor - Headings",
		},
		{
			key: "Ctrl+Shift+2",
			description: "Heading 2",
			category: "Editor - Headings",
		},
		{
			key: "Ctrl+Shift+3",
			description: "Heading 3",
			category: "Editor - Headings",
		},
		{
			key: "Ctrl+Shift+4",
			description: "Heading 4",
			category: "Editor - Headings",
		},
		{
			key: "Ctrl+Shift+5",
			description: "Heading 5",
			category: "Editor - Headings",
		},
		{
			key: "Ctrl+Shift+6",
			description: "Heading 6",
			category: "Editor - Headings",
		},
		{
			key: "Ctrl+Shift+0",
			description: "Paragraph",
			category: "Editor - Headings",
		},

		// Editor lists
		{
			key: "Ctrl+Shift+8",
			description: "Bullet List",
			category: "Editor - Lists",
		},
		{
			key: "Ctrl+Shift+9",
			description: "Ordered List",
			category: "Editor - Lists",
		},
		{
			key: "Ctrl+[",
			description: "Outdent List Item",
			category: "Editor - Lists",
		},
		{
			key: "Ctrl+]",
			description: "Indent List Item",
			category: "Editor - Lists",
		},

		// Editor colors
		{
			key: "Ctrl+Shift+R",
			description: "Red Color",
			category: "Editor - Colors",
		},
		{
			key: "Ctrl+Shift+G",
			description: "Green Color",
			category: "Editor - Colors",
		},
		{
			key: "Ctrl+Shift+L",
			description: "Blue Color",
			category: "Editor - Colors",
		},
		{
			key: "Ctrl+Shift+Y",
			description: "Yellow Color",
			category: "Editor - Colors",
		},
		{
			key: "Ctrl+Shift+P",
			description: "Purple Color",
			category: "Editor - Colors",
		},
		{
			key: "Ctrl+Shift+C",
			description: "Clear Color",
			category: "Editor - Colors",
		},

		// Editor structure
		{
			key: "Ctrl+Shift+.",
			description: "Blockquote",
			category: "Editor - Structure",
		},
		{
			key: "Enter",
			description: "New Paragraph",
			category: "Editor - Structure",
		},
		{
			key: "Shift+Enter",
			description: "Line Break",
			category: "Editor - Structure",
		},

		// Hotkey sequences (special multi-key shortcuts)
		{
			key: "Ctrl+K, N",
			description: "Create New Note",
			category: "Hotkey Sequences",
		},
		{
			key: "Ctrl+K, F",
			description: "Create New Folder",
			category: "Hotkey Sequences",
		},
		{
			key: "Ctrl+K, S",
			description: "Focus Search",
			category: "Hotkey Sequences",
		},
		{
			key: "Ctrl+K, R",
			description: "Rename Current Note",
			category: "Hotkey Sequences",
		},
		{
			key: "Ctrl+K, D",
			description: "Delete Current Note",
			category: "Hotkey Sequences",
		},
		{
			key: "Ctrl+K, C",
			description: "Show Configuration",
			category: "Hotkey Sequences",
		},
		{
			key: "Ctrl+K, H",
			description: "Show Keyboard Shortcuts",
			category: "Hotkey Sequences",
		},
		{
			key: "Ctrl+K, T",
			description: "Toggle Toolbar Visibility",
			category: "Hotkey Sequences",
		},

		// Navigation
		{ key: "↑/↓", description: "Navigate Notes Tree", category: "Navigation" },
		{ key: "Enter", description: "Open Selected Note", category: "Navigation" },
		{ key: "Tab", description: "Focus Next Element", category: "Navigation" },
		{
			key: "Shift+Tab",
			description: "Focus Previous Element",
			category: "Navigation",
		},
		{
			key: "Escape",
			description: "Close Modal/Cancel",
			category: "Navigation",
		},
	];

	// Combine configurable and static hotkeys
	const allHotkeys = [...configurableHotkeys, ...staticHotkeys];
	const categories = Array.from(new Set(allHotkeys.map((h) => h.category)));

	const formatKey = (key: string) => {
		return key
			.replace(/Ctrl/g, "Ctrl")
			.replace(/Shift/g, "Shift")
			.replace(/Alt/g, "Alt")
			.replace(/Cmd/g, "⌘")
			.replace(/↑/g, "↑")
			.replace(/↓/g, "↓");
	};

	return (
		<div className="p-6 h-full overflow-auto bg-white dark:bg-gray-900">
			<h1 className="text-xl font-semibold mb-6 text-gray-900 dark:text-gray-100">Keyboard Shortcuts</h1>

			<div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md">
				<p className="m-0 text-sm text-gray-600 dark:text-gray-400 leading-relaxed mb-2">
					<strong>Note:</strong> On macOS, use Cmd (⌘) instead of Ctrl for most shortcuts. Hotkey sequences require
					pressing keys in order (e.g., Ctrl+K, then R).
				</p>
				<p className="m-0 text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
					<strong>Configuration:</strong> Layout, Tab, Pane, Sidebar, Focus, and Tab Movement hotkeys can be customized
					by adding a <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">hotkeys</code> section to your config.json file.
				</p>
			</div>

					{categories.map((category) => {
			const categoryHotkeys = allHotkeys.filter((h) => h.category === category);
				return (
					<section key={category} className="mb-8">
						<h2 className="text-lg font-medium mb-4 text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700 pb-2">
							{category}
						</h2>

						<div className="grid gap-1 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md p-4">
							{categoryHotkeys.map((hotkey, index) => (
								<div
									key={index}
									className="flex items-center justify-between p-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded"
								>
									<span className="text-gray-900 dark:text-gray-100 text-sm">{hotkey.description}</span>
									<code className="bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-1.5 py-0.5 rounded text-xs font-mono border border-gray-200 dark:border-gray-600">
										{formatKey(hotkey.key)}
									</code>
								</div>
							))}
						</div>
					</section>
				);
			})}

			<section className="mt-8 p-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md">
				<h3 className="text-lg font-medium mb-2 text-gray-900 dark:text-gray-100">Tips</h3>
				<ul className="m-0 pl-6 text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
					<li>Most shortcuts work when focus is on the editor</li>
					<li>Formatting shortcuts apply to selected text or at cursor position</li>
					<li>List shortcuts work within list items to indent/outdent</li>
					<li>Color shortcuts can be combined with text selection</li>
					<li>
						Sequence shortcuts like "Ctrl+K, R" require releasing the first key combination before pressing the second
					</li>
					<li>Some shortcuts may be overridden by your browser or operating system</li>
				</ul>
			</section>
		</div>
	);
}
