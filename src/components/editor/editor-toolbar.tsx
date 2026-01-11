import { EditorView } from "prosemirror-view";
import { toggleMark, setBlockType, wrapIn } from "prosemirror-commands";
import { undo, redo } from "prosemirror-history";
import { wrapInList } from "prosemirror-schema-list";
import { useState, useEffect, useRef } from "react";
import type { MarkType, NodeType } from "prosemirror-model";
import {
	Bold,
	Italic,
	Code,
	Heading1,
	Heading2,
	Heading3,
	Type,
	List,
	ListOrdered,
	Quote,
	Undo2,
	Redo2,
	ChevronDown,
	FileCode,
	Underline,
	Strikethrough,
	Palette,
	Highlighter,
	ALargeSmall,
	CaseSensitive,
} from "lucide-react";

interface EditorToolbarProps {
	editorView: EditorView | null;
	schema: any;
}

// Preset colors for color pickers
const PRESET_COLORS = [
	"#000000", "#374151", "#6b7280", "#9ca3af",
	"#ef4444", "#f97316", "#eab308", "#22c55e",
	"#3b82f6", "#8b5cf6", "#ec4899", "#14b8a6",
];

const HIGHLIGHT_COLORS = [
	"#fef08a", "#fde047", "#fbbf24", "#fb923c",
	"#fca5a5", "#f9a8d4", "#c4b5fd", "#a5b4fc",
	"#99f6e4", "#86efac", "#d9f99d", "#ffffff",
];

const FONT_SIZES = [
	{ label: "Small", value: "12px" },
	{ label: "Normal", value: "16px" },
	{ label: "Large", value: "20px" },
	{ label: "XL", value: "24px" },
	{ label: "2XL", value: "32px" },
];

const FONT_FAMILIES = [
	{ label: "System Default", value: "system-ui, -apple-system, sans-serif" },
	{ label: "Sans Serif", value: "Arial, Helvetica, sans-serif" },
	{ label: "Serif", value: "Georgia, 'Times New Roman', serif" },
	{ label: "Monospace", value: "'Courier New', Consolas, monospace" },
	{ label: "Inter", value: "Inter, system-ui, sans-serif" },
	{ label: "Comic Sans", value: "'Comic Sans MS', cursive" },
];

export function EditorToolbar({ editorView, schema }: EditorToolbarProps) {
	const [showDropdown, setShowDropdown] = useState(false);
	const [showColorPicker, setShowColorPicker] = useState<"text" | "highlight" | "fontSize" | "fontFamily" | null>(null);
	const [visibleButtons, setVisibleButtons] = useState<number>(0);
	const [, setUpdateTrigger] = useState(0);
	const toolbarRef = useRef<HTMLDivElement>(null);
	const dropdownRef = useRef<HTMLDivElement>(null);
	const colorPickerRef = useRef<HTMLDivElement>(null);

	// Helper to check if a mark is active
	const isMarkActive = (markType: MarkType) => {
		if (!editorView) return false;
		const { from, $from, to, empty } = editorView.state.selection;
		if (empty) {
			return !!markType.isInSet(editorView.state.storedMarks || $from.marks());
		}
		return editorView.state.doc.rangeHasMark(from, to, markType);
	};

	// Helper to check if a block type is active
	const isBlockActive = (nodeType: NodeType, attrs?: Record<string, any>) => {
		if (!editorView) return false;
		const { $from, $to } = editorView.state.selection;
		
		// Check the parent node at the selection start
		const depth = $from.depth;
		for (let d = depth; d > 0; d--) {
			const node = $from.node(d);
			if (node.type === nodeType) {
				if (!attrs || Object.keys(attrs).every((key) => node.attrs[key] === attrs[key])) {
					return true;
				}
			}
		}
		
		// If selection spans multiple blocks, also check the end
		if ($from.pos !== $to.pos) {
			for (let d = $to.depth; d > 0; d--) {
				const node = $to.node(d);
				if (node.type === nodeType) {
					if (!attrs || Object.keys(attrs).every((key) => node.attrs[key] === attrs[key])) {
						return true;
					}
				}
			}
		}
		
		return false;
	};

	const executeCommand = (command: any) => {
		return () => {
			if (!editorView) return;
			const { state } = editorView;
			
			// Execute the command
			const result = command(state, (tr: any) => {
				editorView.dispatch(tr);
			});
			
			if (result) {
				editorView.focus();
			}
		};
	};

	// Apply a mark with attributes to the selection
	const applyMarkWithAttrs = (markType: MarkType, attrs: Record<string, any>) => {
		if (!editorView) return;
		const { state, dispatch } = editorView;
		const { from, to, empty } = state.selection;

		if (empty) {
			// For empty selection, set stored marks
			const mark = markType.create(attrs);
			dispatch(state.tr.addStoredMark(mark));
		} else {
			// For non-empty selection, apply mark to range
			const mark = markType.create(attrs);
			dispatch(state.tr.addMark(from, to, mark));
		}
		editorView.focus();
	};

	// Remove a mark from selection
	const removeMark = (markType: MarkType) => {
		if (!editorView) return;
		const { state, dispatch } = editorView;
		const { from, to, empty } = state.selection;

		if (empty) {
			dispatch(state.tr.removeStoredMark(markType));
		} else {
			dispatch(state.tr.removeMark(from, to, markType));
		}
		editorView.focus();
	};

	// Update toolbar state when editor selection changes
	useEffect(() => {
		if (!editorView) return;

		const updateToolbar = () => {
			setUpdateTrigger((prev) => prev + 1);
		};

		// Subscribe to editor updates
		// Use a mutation observer or transaction listener
		const updateInterval = setInterval(updateToolbar, 100);

		return () => {
			clearInterval(updateInterval);
		};
	}, [editorView]);

	const allButtons = !schema
		? []
		: [
				// Basic formatting
				{
					icon: Bold,
					label: "Bold",
					shortcut: "Ctrl+B",
					command: toggleMark(schema.marks.strong),
					isActive: () => isMarkActive(schema.marks.strong),
					className: "toolbar-bold",
				},
				{
					icon: Italic,
					label: "Italic",
					shortcut: "Ctrl+I",
					command: toggleMark(schema.marks.em),
					isActive: () => isMarkActive(schema.marks.em),
					className: "toolbar-italic",
				},
				{
					icon: Code,
					label: "Code",
					shortcut: "Ctrl+`",
					command: toggleMark(schema.marks.code),
					isActive: () => isMarkActive(schema.marks.code),
					className: "toolbar-code",
				},
				{
					icon: Underline,
					label: "Underline",
					shortcut: "Ctrl+U",
					command: toggleMark(schema.marks.underline),
					isActive: () => isMarkActive(schema.marks.underline),
					className: "toolbar-underline",
				},
				{
					icon: Strikethrough,
					label: "Strikethrough",
					shortcut: "Ctrl+Shift+S",
					command: toggleMark(schema.marks.strikethrough),
					isActive: () => isMarkActive(schema.marks.strikethrough),
					className: "toolbar-strikethrough",
				},

				// Block formatting
				{
					icon: Heading1,
					label: "Heading 1",
					shortcut: "Ctrl+Shift+1",
					command: (state: any, dispatch: any) => {
						const isActive = isBlockActive(schema.nodes.heading, { level: 1 });
						if (isActive) {
							return setBlockType(schema.nodes.paragraph)(state, dispatch);
						}
						return setBlockType(schema.nodes.heading, { level: 1 })(state, dispatch);
					},
					isActive: () => isBlockActive(schema.nodes.heading, { level: 1 }),
					className: "toolbar-h1",
				},
				{
					icon: Heading2,
					label: "Heading 2",
					shortcut: "Ctrl+Shift+2",
					command: (state: any, dispatch: any) => {
						const isActive = isBlockActive(schema.nodes.heading, { level: 2 });
						if (isActive) {
							return setBlockType(schema.nodes.paragraph)(state, dispatch);
						}
						return setBlockType(schema.nodes.heading, { level: 2 })(state, dispatch);
					},
					isActive: () => isBlockActive(schema.nodes.heading, { level: 2 }),
					className: "toolbar-h2",
				},
				{
					icon: Heading3,
					label: "Heading 3",
					shortcut: "Ctrl+Shift+3",
					command: (state: any, dispatch: any) => {
						const isActive = isBlockActive(schema.nodes.heading, { level: 3 });
						if (isActive) {
							return setBlockType(schema.nodes.paragraph)(state, dispatch);
						}
						return setBlockType(schema.nodes.heading, { level: 3 })(state, dispatch);
					},
					isActive: () => isBlockActive(schema.nodes.heading, { level: 3 }),
					className: "toolbar-h3",
				},
				{
					icon: Type,
					label: "Paragraph",
					shortcut: "Ctrl+Shift+0",
					command: setBlockType(schema.nodes.paragraph),
					isActive: () => isBlockActive(schema.nodes.paragraph),
					className: "toolbar-paragraph",
				},

				// Lists
				{
					icon: List,
					label: "Bullet List",
					shortcut: "Ctrl+Shift+8",
					command: wrapInList(schema.nodes.bullet_list),
					isActive: () => isBlockActive(schema.nodes.bullet_list),
					className: "toolbar-bullet-list",
				},
				{
					icon: ListOrdered,
					label: "Ordered List",
					shortcut: "Ctrl+Shift+9",
					command: wrapInList(schema.nodes.ordered_list),
					isActive: () => isBlockActive(schema.nodes.ordered_list),
					className: "toolbar-ordered-list",
				},
				{
					icon: Quote,
					label: "Blockquote",
					shortcut: "Ctrl+Shift+.",
					command: wrapIn(schema.nodes.blockquote),
					isActive: () => isBlockActive(schema.nodes.blockquote),
					className: "toolbar-blockquote",
				},
				{
					icon: FileCode,
					label: "Code Block",
					shortcut: "Ctrl+Shift+C",
					command: setBlockType(schema.nodes.code_block),
					isActive: () => isBlockActive(schema.nodes.code_block),
					className: "toolbar-code-block",
				},

				// Utility
				{
					icon: Undo2,
					label: "Undo",
					shortcut: "Ctrl+Z",
					command: undo,
					isActive: () => false,
					className: "toolbar-undo",
				},
				{
					icon: Redo2,
					label: "Redo",
					shortcut: "Ctrl+Y",
					command: redo,
					isActive: () => false,
					className: "toolbar-redo",
				},
		  ];

	// Calculate visible buttons based on actual measurements
	useEffect(() => {
		const calculateVisibleButtons = () => {
			if (!toolbarRef.current || allButtons.length === 0) {
				setVisibleButtons(allButtons.length);
				return;
			}

			const container = toolbarRef.current;
			const containerWidth = container.offsetWidth;

			// If container is too small (likely not rendered yet), retry after a delay
			if (containerWidth < 100) {
				setTimeout(calculateVisibleButtons, 50);
				setVisibleButtons(allButtons.length); // Show all buttons temporarily
				return;
			}

			// Get computed styles for accurate measurements
			const containerStyles = getComputedStyle(container);
			const paddingLeft = parseInt(containerStyles.paddingLeft) || 8;
			const paddingRight = parseInt(containerStyles.paddingRight) || 8;
			const containerPadding = paddingLeft + paddingRight;

			// Reserve space for the overflow button only if we'll need it
			const overflowButtonWidth = 40;

			// Button dimensions
			const buttonWidth = 32;
			const buttonGap = 4;

			// Calculate maximum buttons that could theoretically fit
			const maxPossibleButtons = Math.floor(
				(containerWidth - containerPadding) / (buttonWidth + buttonGap)
			);

			// If we can fit all buttons, don't reserve space for overflow
			if (maxPossibleButtons >= allButtons.length) {
				setVisibleButtons(allButtons.length);
				return;
			}

			// Calculate available width for buttons (reserve space for overflow)
			const availableWidth =
				containerWidth - containerPadding - overflowButtonWidth;

			// Calculate how many buttons can fit
			let fittingButtons = 0;
			let usedWidth = 0;

			for (let i = 0; i < allButtons.length; i++) {
				const buttonSpaceNeeded = buttonWidth + (i > 0 ? buttonGap : 0);

				if (usedWidth + buttonSpaceNeeded <= availableWidth) {
					fittingButtons++;
					usedWidth += buttonSpaceNeeded;
				} else {
					break;
				}
			}

			// Ensure at least some basic buttons are visible
			if (fittingButtons < 3 && allButtons.length >= 3) {
				fittingButtons = 3;
			}

			setVisibleButtons(fittingButtons);
		};

		// Small delay to ensure DOM is ready
		const timer = setTimeout(calculateVisibleButtons, 0);

		// Use ResizeObserver for better performance
		const resizeObserver = new ResizeObserver(() => {
			// Debounce calculations
			setTimeout(calculateVisibleButtons, 10);
		});

		if (toolbarRef.current) {
			resizeObserver.observe(toolbarRef.current);
		}

		return () => {
			clearTimeout(timer);
			resizeObserver.disconnect();
		};
	}, [allButtons.length]);

	// Close dropdown when clicking outside
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (
				dropdownRef.current &&
				!dropdownRef.current.contains(event.target as Node)
			) {
				setShowDropdown(false);
			}
			if (
				colorPickerRef.current &&
				!colorPickerRef.current.contains(event.target as Node)
			) {
				setShowColorPicker(null);
			}
		};

		if (showDropdown || showColorPicker) {
			document.addEventListener("mousedown", handleClickOutside);
			return () => document.removeEventListener("mousedown", handleClickOutside);
		}

		return undefined;
	}, [showDropdown, showColorPicker]);

	// Don't render if required props are missing
	if (!editorView || !schema) return null;

	const visibleButtonsList = allButtons.slice(0, visibleButtons);
	const dropdownButtonsList = allButtons.slice(visibleButtons);

	return (
		<div
			ref={toolbarRef}
			className="flex items-center gap-1 px-2 py-1.5 bg-gray-100 dark:bg-gray-800 border-b border-gray-300 dark:border-gray-700"
		>
			<div className="flex items-center gap-1 flex-wrap">
				{visibleButtonsList.map((button, index) => {
					const IconComponent = button.icon;
					const isActive = button.isActive?.() || false;
					return (
						<button
							key={index}
							type="button"
							tabIndex={-1}
							className={`w-8 h-8 flex items-center justify-center rounded transition-colors ${
								isActive
									? "bg-blue-500 text-white hover:bg-blue-600"
									: "hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
							}`}
							onClick={executeCommand(button.command)}
							title={`${button.label} ${button.shortcut ? `(${button.shortcut})` : ""}`}
						>
							<IconComponent size={16} />
						</button>
					);
				})}

				{dropdownButtonsList.length > 0 && (
					<div className="relative">
						<button
							type="button"
							tabIndex={-1}
							className="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300"
							onClick={() => setShowDropdown(!showDropdown)}
							title={`More formatting options (${dropdownButtonsList.length} more)`}
						>
							<ChevronDown size={16} />
						</button>

						{showDropdown && (
							<div
								ref={dropdownRef}
								className="absolute top-full left-0 mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded shadow-lg z-50 min-w-[200px]"
							>
								{dropdownButtonsList.map((button, index) => {
									const IconComponent = button.icon;
									const isActive = button.isActive?.() || false;
									return (
										<button
											key={index}
											type="button"
											tabIndex={-1}
											className={`w-full flex items-center gap-2 px-3 py-2 transition-colors text-left ${
												isActive
													? "bg-blue-500 text-white hover:bg-blue-600"
													: "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
											}`}
											onClick={() => {
												executeCommand(button.command)();
												setShowDropdown(false);
											}}
											title={`${button.label} ${button.shortcut ? `(${button.shortcut})` : ""}`}
										>
											<IconComponent size={16} />
											<span className="text-sm">{button.label}</span>
										</button>
									);
								})}
							</div>
						)}
					</div>
				)}

				{/* Separator */}
				<div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />

				{/* Text Color Picker */}
				<div className="relative" ref={showColorPicker === "text" ? colorPickerRef : undefined}>
					<button
						type="button"
						tabIndex={-1}
						className={`w-8 h-8 flex items-center justify-center rounded transition-colors ${
							isMarkActive(schema.marks.textColor)
								? "bg-blue-500 text-white hover:bg-blue-600"
								: "hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
						}`}
						onClick={() => setShowColorPicker(showColorPicker === "text" ? null : "text")}
						title="Text Color"
					>
						<Palette size={16} />
					</button>
					{showColorPicker === "text" && (
						<div className="absolute top-full left-0 mt-1 p-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded shadow-lg z-50">
							<div className="grid grid-cols-4 gap-1 mb-2">
								{PRESET_COLORS.map((color) => (
									<button
										key={color}
										type="button"
										className="w-6 h-6 rounded border border-gray-300 dark:border-gray-600 hover:scale-110 transition-transform"
										style={{ backgroundColor: color }}
										onClick={() => {
											applyMarkWithAttrs(schema.marks.textColor, { color });
											setShowColorPicker(null);
										}}
										title={color}
									/>
								))}
							</div>
							<button
								type="button"
								className="w-full text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 py-1"
								onClick={() => {
									removeMark(schema.marks.textColor);
									setShowColorPicker(null);
								}}
							>
								Remove color
							</button>
						</div>
					)}
				</div>

				{/* Highlight Color Picker */}
				<div className="relative" ref={showColorPicker === "highlight" ? colorPickerRef : undefined}>
					<button
						type="button"
						tabIndex={-1}
						className={`w-8 h-8 flex items-center justify-center rounded transition-colors ${
							isMarkActive(schema.marks.highlight)
								? "bg-blue-500 text-white hover:bg-blue-600"
								: "hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
						}`}
						onClick={() => setShowColorPicker(showColorPicker === "highlight" ? null : "highlight")}
						title="Highlight"
					>
						<Highlighter size={16} />
					</button>
					{showColorPicker === "highlight" && (
						<div className="absolute top-full left-0 mt-1 p-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded shadow-lg z-50">
							<div className="grid grid-cols-4 gap-1 mb-2">
								{HIGHLIGHT_COLORS.map((color) => (
									<button
										key={color}
										type="button"
										className="w-6 h-6 rounded border border-gray-300 dark:border-gray-600 hover:scale-110 transition-transform"
										style={{ backgroundColor: color }}
										onClick={() => {
											applyMarkWithAttrs(schema.marks.highlight, { color });
											setShowColorPicker(null);
										}}
										title={color}
									/>
								))}
							</div>
							<button
								type="button"
								className="w-full text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 py-1"
								onClick={() => {
									removeMark(schema.marks.highlight);
									setShowColorPicker(null);
								}}
							>
								Remove highlight
							</button>
						</div>
					)}
				</div>

				{/* Font Size Picker */}
				<div className="relative" ref={showColorPicker === "fontSize" ? colorPickerRef : undefined}>
					<button
						type="button"
						tabIndex={-1}
						className={`w-8 h-8 flex items-center justify-center rounded transition-colors ${
							isMarkActive(schema.marks.fontSize)
								? "bg-blue-500 text-white hover:bg-blue-600"
								: "hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
						}`}
						onClick={() => setShowColorPicker(showColorPicker === "fontSize" ? null : "fontSize")}
						title="Font Size"
					>
						<ALargeSmall size={16} />
					</button>
					{showColorPicker === "fontSize" && (
						<div className="absolute top-full left-0 mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded shadow-lg z-50 min-w-[120px]">
							{FONT_SIZES.map((size) => (
								<button
									key={size.value}
									type="button"
									className="w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
									onClick={() => {
										applyMarkWithAttrs(schema.marks.fontSize, { size: size.value });
										setShowColorPicker(null);
									}}
								>
									<span>{size.label}</span>
									<span className="text-gray-400 text-xs">{size.value}</span>
								</button>
							))}
							<button
								type="button"
								className="w-full text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 py-2 border-t border-gray-200 dark:border-gray-700"
								onClick={() => {
									removeMark(schema.marks.fontSize);
									setShowColorPicker(null);
								}}
							>
								Reset to default
							</button>
						</div>
					)}
				</div>

				{/* Font Family Picker */}
				<div className="relative" ref={showColorPicker === "fontFamily" ? colorPickerRef : undefined}>
					<button
						type="button"
						tabIndex={-1}
						className={`w-8 h-8 flex items-center justify-center rounded transition-colors ${
							isMarkActive(schema.marks.fontFamily)
								? "bg-blue-500 text-white hover:bg-blue-600"
								: "hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
						}`}
						onClick={() => setShowColorPicker(showColorPicker === "fontFamily" ? null : "fontFamily")}
						title="Font Family"
					>
						<CaseSensitive size={16} />
					</button>
					{showColorPicker === "fontFamily" && (
						<div className="absolute top-full left-0 mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded shadow-lg z-50 min-w-[160px]">
							{FONT_FAMILIES.map((font) => (
								<button
									key={font.value}
									type="button"
									className="w-full flex items-center px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
									style={{ fontFamily: font.value }}
									onClick={() => {
										applyMarkWithAttrs(schema.marks.fontFamily, { family: font.value });
										setShowColorPicker(null);
									}}
								>
									{font.label}
								</button>
							))}
							<button
								type="button"
								className="w-full text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 py-2 border-t border-gray-200 dark:border-gray-700"
								onClick={() => {
									removeMark(schema.marks.fontFamily);
									setShowColorPicker(null);
								}}
							>
								Reset to default
							</button>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
