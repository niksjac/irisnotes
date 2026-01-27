import { EditorView } from "prosemirror-view";
import { toggleMark, setBlockType, wrapIn, lift } from "prosemirror-commands";
import { wrapInList, liftListItem } from "prosemirror-schema-list";
import { useState, useEffect, useRef, useCallback } from "react";
import type { MarkType, NodeType } from "prosemirror-model";
import { useAtomValue } from "jotai";
import { editorSettingsAtom } from "@/atoms/settings";
import { altKeyHeldAtom } from "@/hooks/use-key-tips";
import {
	Bold,
	Italic,
	Code,
	List,
	ListOrdered,
	Quote,
	ChevronDown,
	ChevronUp,
	ChevronLeft,
	ChevronRight,
	FileCode,
	Underline,
	Strikethrough,
	Palette,
	Highlighter,
	RemoveFormatting,
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

// Font size scale factors (em values) - these scale relative to base font size
// When base is 14px: 0.5em = 7px, 1em = 14px, 2em = 28px, etc.
const FONT_SIZE_SCALES = [
	0.5, 0.6, 0.7, 0.8, 0.9, 1.0, 1.1, 1.2, 1.3, 1.4, 1.5, 1.75, 2.0, 2.5, 3.0, 4.0
];

const FONT_FAMILIES = [
	// System defaults
	{ label: "System Default", value: "system-ui, -apple-system, sans-serif" },
	
	// Sans-serif fonts
	{ label: "Sans Serif", value: "Arial, Helvetica, sans-serif" },
	{ label: "Inter", value: "Inter, system-ui, sans-serif" },
	{ label: "Roboto", value: "Roboto, Arial, sans-serif" },
	{ label: "Open Sans", value: "'Open Sans', Arial, sans-serif" },
	{ label: "Lato", value: "Lato, Arial, sans-serif" },
	{ label: "Noto Sans", value: "'Noto Sans', Arial, sans-serif" },
	{ label: "Ubuntu", value: "Ubuntu, Arial, sans-serif" },
	{ label: "Segoe UI", value: "'Segoe UI', Tahoma, sans-serif" },
	{ label: "Helvetica Neue", value: "'Helvetica Neue', Helvetica, Arial, sans-serif" },
	
	// Serif fonts
	{ label: "Serif", value: "Georgia, 'Times New Roman', serif" },
	{ label: "Times New Roman", value: "'Times New Roman', Times, serif" },
	{ label: "Noto Serif", value: "'Noto Serif', Georgia, serif" },
	{ label: "Merriweather", value: "Merriweather, Georgia, serif" },
	{ label: "Playfair Display", value: "'Playfair Display', Georgia, serif" },
	
	// Monospace fonts
	{ label: "Monospace", value: "'Courier New', Consolas, monospace" },
	{ label: "JetBrains Mono", value: "'JetBrains Mono', 'Fira Code', monospace" },
	{ label: "Fira Code", value: "'Fira Code', 'JetBrains Mono', monospace" },
	{ label: "Source Code Pro", value: "'Source Code Pro', Consolas, monospace" },
	{ label: "Consolas", value: "Consolas, 'Courier New', monospace" },
	{ label: "JetBrainsMonoNL NF", value: "'JetBrainsMonoNL NF', 'JetBrains Mono', monospace" },
	{ label: "Cascadia Code", value: "'Cascadia Code', Consolas, monospace" },
	{ label: "Ubuntu Mono", value: "'Ubuntu Mono', 'Courier New', monospace" },
	{ label: "Hack", value: "Hack, 'DejaVu Sans Mono', monospace" },
	{ label: "DejaVu Sans Mono", value: "'DejaVu Sans Mono', Consolas, monospace" },
	{ label: "Iosevka", value: "Iosevka, 'Fira Code', monospace" },
	{ label: "Nerd Font Mono", value: "'JetBrainsMono Nerd Font', 'FiraCode Nerd Font', 'Hack Nerd Font', monospace" },
	
	// Display/Fun fonts  
	{ label: "Comic Sans", value: "'Comic Sans MS', cursive" },
];

// Color Grid component with keyboard navigation
interface ColorGridProps {
	colors: string[];
	onSelectColor: (color: string) => void;
	onRemoveColor: () => void;
	removeLabel: string;
	columns?: number;
}

function ColorGrid({ colors, onSelectColor, onRemoveColor, removeLabel, columns = 4 }: ColorGridProps) {
	const [selectedIndex, setSelectedIndex] = useState(0);
	const gridRef = useRef<HTMLDivElement>(null);
	const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);

	// Focus first color when grid mounts
	useEffect(() => {
		buttonRefs.current[0]?.focus();
	}, []);

	const handleKeyDown = (e: React.KeyboardEvent) => {
		const totalItems = colors.length + 1; // +1 for remove button
		let newIndex = selectedIndex;

		switch (e.key) {
			case "ArrowRight":
				e.preventDefault();
				newIndex = (selectedIndex + 1) % totalItems;
				break;
			case "ArrowLeft":
				e.preventDefault();
				newIndex = (selectedIndex - 1 + totalItems) % totalItems;
				break;
			case "ArrowDown":
				e.preventDefault();
				if (selectedIndex < colors.length) {
					// In color grid
					newIndex = Math.min(selectedIndex + columns, colors.length);
				}
				break;
			case "ArrowUp":
				e.preventDefault();
				if (selectedIndex === colors.length) {
					// On remove button, go to last row
					newIndex = colors.length - columns;
				} else if (selectedIndex >= columns) {
					newIndex = selectedIndex - columns;
				}
				break;
			case "Home":
				e.preventDefault();
				newIndex = 0;
				break;
			case "End":
				e.preventDefault();
				newIndex = totalItems - 1;
				break;
			default:
				return;
		}

		setSelectedIndex(newIndex);
		buttonRefs.current[newIndex]?.focus();
	};

	return (
		<div ref={gridRef} onKeyDown={handleKeyDown}>
			<div className="grid grid-cols-4 gap-2 mb-3" role="grid">
				{colors.map((color, index) => (
					<button
						key={color}
						ref={(el) => { buttonRefs.current[index] = el; }}
						type="button"
						tabIndex={index === selectedIndex ? 0 : -1}
						className={`w-7 h-7 rounded border-2 transition-all cursor-pointer ${
							index === selectedIndex 
								? "border-blue-500 ring-2 ring-blue-300 scale-110" 
								: "border-gray-300 dark:border-gray-600 hover:border-blue-500 hover:scale-110"
						}`}
						style={{ backgroundColor: color }}
						onClick={() => onSelectColor(color)}
						onFocus={() => setSelectedIndex(index)}
						title={color}
						role="gridcell"
					/>
				))}
			</div>
			<button
				ref={(el) => { buttonRefs.current[colors.length] = el; }}
				type="button"
				tabIndex={selectedIndex === colors.length ? 0 : -1}
				className={`w-full text-xs py-1.5 border-t border-gray-200 dark:border-gray-700 ${
					selectedIndex === colors.length 
						? "text-gray-900 dark:text-gray-100 bg-gray-100 dark:bg-gray-700" 
						: "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
				}`}
				onClick={onRemoveColor}
				onFocus={() => setSelectedIndex(colors.length)}
			>
				{removeLabel}
			</button>
		</div>
	);
}

export function EditorToolbar({ editorView, schema }: EditorToolbarProps) {
	const [showColorPicker, setShowColorPicker] = useState<"text" | "highlight" | null>(null);
	const [colorPickerPos, setColorPickerPos] = useState<{ top: number; left: number } | null>(null);
	const [, setUpdateTrigger] = useState(0);
	const [canScrollLeft, setCanScrollLeft] = useState(false);
	const [canScrollRight, setCanScrollRight] = useState(false);
	const toolbarRef = useRef<HTMLDivElement>(null);
	const scrollContainerRef = useRef<HTMLDivElement>(null);
	const textColorRef = useRef<HTMLDivElement>(null);
	const highlightRef = useRef<HTMLDivElement>(null);
	const fontSizeInputRef = useRef<HTMLInputElement>(null);
	const fontFamilyInputRef = useRef<HTMLInputElement>(null);
	const altKeyHeld = useAtomValue(altKeyHeldAtom);

	// Update scroll arrow visibility
	const updateScrollState = useCallback(() => {
		const container = scrollContainerRef.current;
		if (!container) return;
		const { scrollLeft, scrollWidth, clientWidth } = container;
		setCanScrollLeft(scrollLeft > 0);
		setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 1);
	}, []);

	// Scroll the toolbar
	const scroll = useCallback((direction: "left" | "right") => {
		const container = scrollContainerRef.current;
		if (!container) return;
		const scrollAmount = 120;
		container.scrollBy({
			left: direction === "left" ? -scrollAmount : scrollAmount,
			behavior: "smooth",
		});
	}, []);

	// Monitor scroll state
	useEffect(() => {
		const container = scrollContainerRef.current;
		if (!container) return;

		updateScrollState();
		container.addEventListener("scroll", updateScrollState);

		const resizeObserver = new ResizeObserver(updateScrollState);
		resizeObserver.observe(container);

		return () => {
			container.removeEventListener("scroll", updateScrollState);
			resizeObserver.disconnect();
		};
	}, [updateScrollState]);

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

	// Get current text color from selection
	const getCurrentTextColor = useCallback((): string | null => {
		if (!editorView || !schema.marks.textColor) return null;
		const { $from, empty } = editorView.state.selection;
		const marks = empty ? editorView.state.storedMarks || $from.marks() : $from.marks();
		const colorMark = marks.find((m: any) => m.type === schema.marks.textColor);
		return colorMark?.attrs?.color || null;
	}, [editorView, schema]);

	// Get current highlight color from selection
	const getCurrentHighlightColor = useCallback((): string | null => {
		if (!editorView || !schema.marks.highlight) return null;
		const { $from, empty } = editorView.state.selection;
		const marks = empty ? editorView.state.storedMarks || $from.marks() : $from.marks();
		const highlightMark = marks.find((m: any) => m.type === schema.marks.highlight);
		return highlightMark?.attrs?.color || null;
	}, [editorView, schema]);

	// Clear ALL formatting (all marks)
	const clearCustomFormatting = useCallback(() => {
		if (!editorView) return;
		const { state, dispatch } = editorView;
		const { from, to, empty } = state.selection;

		let tr = state.tr;
		
		// All marks to remove (including basic formatting)
		const marksToRemove = [
			schema.marks.textColor,
			schema.marks.highlight,
			schema.marks.fontSize,
			schema.marks.fontFamily,
			schema.marks.strong,      // bold
			schema.marks.em,          // italic
			schema.marks.underline,
			schema.marks.strikethrough,
			schema.marks.code,        // inline code
			schema.marks.link,
		].filter(Boolean);

		if (empty) {
			// For empty selection, just remove stored marks
			for (const markType of marksToRemove) {
				tr = tr.removeStoredMark(markType);
			}
		} else {
			// For selection, remove all marks from the range
			for (const markType of marksToRemove) {
				tr = tr.removeMark(from, to, markType);
			}
		}

		dispatch(tr);
		editorView.focus();
	}, [editorView, schema]);

	const currentTextColor = getCurrentTextColor();
	const currentHighlightColor = getCurrentHighlightColor();

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
					keyTip: "B",
					command: toggleMark(schema.marks.strong),
					isActive: () => isMarkActive(schema.marks.strong),
					className: "toolbar-bold",
				},
				{
					icon: Italic,
					label: "Italic",
					shortcut: "Ctrl+I",
					keyTip: "I",
					command: toggleMark(schema.marks.em),
					isActive: () => isMarkActive(schema.marks.em),
					className: "toolbar-italic",
				},
				{
					icon: Code,
					label: "Code",
					shortcut: "Ctrl+`",
					keyTip: "C",
					command: toggleMark(schema.marks.code),
					isActive: () => isMarkActive(schema.marks.code),
					className: "toolbar-code",
				},
				{
					icon: Underline,
					label: "Underline",
					shortcut: "Ctrl+U",
					keyTip: "U",
					command: toggleMark(schema.marks.underline),
					isActive: () => isMarkActive(schema.marks.underline),
					className: "toolbar-underline",
				},
				{
					icon: Strikethrough,
					label: "Strikethrough",
					shortcut: "Ctrl+Shift+S",
					keyTip: "S",
					command: toggleMark(schema.marks.strikethrough),
					isActive: () => isMarkActive(schema.marks.strikethrough),
					className: "toolbar-strikethrough",
				},

				// Lists - with toggle behavior
				{
					icon: List,
					label: "Bullet List",
					shortcut: "Alt+L",
					keyTip: "L",
					command: (state: any, dispatch: any) => {
						if (isBlockActive(schema.nodes.bullet_list)) {
							return liftListItem(schema.nodes.list_item)(state, dispatch);
						}
						return wrapInList(schema.nodes.bullet_list)(state, dispatch);
					},
					isActive: () => isBlockActive(schema.nodes.bullet_list),
					className: "toolbar-bullet-list",
				},
				{
					icon: ListOrdered,
					label: "Ordered List",
					shortcut: "Alt+O",
					keyTip: "O",
					command: (state: any, dispatch: any) => {
						if (isBlockActive(schema.nodes.ordered_list)) {
							return liftListItem(schema.nodes.list_item)(state, dispatch);
						}
						return wrapInList(schema.nodes.ordered_list)(state, dispatch);
					},
					isActive: () => isBlockActive(schema.nodes.ordered_list),
					className: "toolbar-ordered-list",
				},
				{
					icon: Quote,
					label: "Blockquote",
					shortcut: "Ctrl+Shift+.",
					keyTip: "Q",
					command: (state: any, dispatch: any) => {
						if (isBlockActive(schema.nodes.blockquote)) {
							return lift(state, dispatch);
						}
						return wrapIn(schema.nodes.blockquote)(state, dispatch);
					},
					isActive: () => isBlockActive(schema.nodes.blockquote),
					className: "toolbar-blockquote",
				},
				{
					icon: FileCode,
					label: "Code Block",
					shortcut: "Ctrl+Shift+C",
					keyTip: "K",
					command: (state: any, dispatch: any) => {
						if (isBlockActive(schema.nodes.code_block)) {
							return setBlockType(schema.nodes.paragraph)(state, dispatch);
						}
						return setBlockType(schema.nodes.code_block)(state, dispatch);
					},
					isActive: () => isBlockActive(schema.nodes.code_block),
					className: "toolbar-code-block",
				},
		  ];

	// Close color picker when clicking outside
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			const target = event.target as Node;
			const isInsideTextColor = textColorRef.current?.contains(target);
			const isInsideHighlight = highlightRef.current?.contains(target);
			
			if (!isInsideTextColor && !isInsideHighlight) {
				setShowColorPicker(null);
			}
		};

		const handleEscapeKey = (event: KeyboardEvent) => {
			if (event.key === "Escape") {
				setShowColorPicker(null);
			}
		};

		if (showColorPicker) {
			document.addEventListener("mousedown", handleClickOutside);
			document.addEventListener("keydown", handleEscapeKey);
			return () => {
				document.removeEventListener("mousedown", handleClickOutside);
				document.removeEventListener("keydown", handleEscapeKey);
			};
		}

		return undefined;
	}, [showColorPicker]);

	// Calculate color picker position when opening (for fixed positioning)
	useEffect(() => {
		if (showColorPicker === "text" && textColorRef.current) {
			const rect = textColorRef.current.getBoundingClientRect();
			setColorPickerPos({
				top: rect.bottom + 4,
				left: rect.left,
			});
		} else if (showColorPicker === "highlight" && highlightRef.current) {
			const rect = highlightRef.current.getBoundingClientRect();
			setColorPickerPos({
				top: rect.bottom + 4,
				left: rect.left,
			});
		} else {
			setColorPickerPos(null);
		}
	}, [showColorPicker]);

	// Handle Alt+key shortcuts for toolbar buttons
	useEffect(() => {
		if (!altKeyHeld || !editorView) return;

		const handleKeyDown = (e: KeyboardEvent) => {
			if (!e.altKey) return;

			const keyLower = e.key.toLowerCase();
			const button = allButtons.find((b) => b.keyTip?.toLowerCase() === keyLower);

			if (button) {
				e.preventDefault();
				e.stopPropagation();
				executeCommand(button.command)();
			} else if (keyLower === "t") {
				// Toggle text color picker
				e.preventDefault();
				e.stopPropagation();
				setShowColorPicker((prev) => (prev === "text" ? null : "text"));
			} else if (keyLower === "h") {
				// Toggle highlight picker
				e.preventDefault();
				e.stopPropagation();
				setShowColorPicker((prev) => (prev === "highlight" ? null : "highlight"));
			} else if (keyLower === "z") {
				// Focus font size input
				e.preventDefault();
				e.stopPropagation();
				fontSizeInputRef.current?.focus();
			} else if (keyLower === "f") {
				// Focus font family input
				e.preventDefault();
				e.stopPropagation();
				fontFamilyInputRef.current?.focus();
			} else if (keyLower === "r") {
				// Clear custom formatting
				e.preventDefault();
				e.stopPropagation();
				clearCustomFormatting();
			}
		};

		window.addEventListener("keydown", handleKeyDown, true);
		return () => window.removeEventListener("keydown", handleKeyDown, true);
	}, [altKeyHeld, allButtons, editorView, executeCommand]);

	// Don't render if required props are missing
	if (!editorView || !schema) return null;

	return (
		<div
			ref={toolbarRef}
			data-editor-toolbar
			className="relative flex items-center bg-gray-100 dark:bg-gray-800 border-b border-gray-300 dark:border-gray-700 min-w-0"
		>
			{/* Left scroll arrow */}
			{canScrollLeft && (
				<button
					type="button"
					tabIndex={0}
					className="flex-shrink-0 w-6 h-9 flex items-center justify-center bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 transition-colors z-10"
					onClick={() => scroll("left")}
					title="Scroll left"
				>
					<ChevronLeft size={14} />
				</button>
			)}

			{/* Scrollable toolbar content */}
			<div
				ref={scrollContainerRef}
				className="flex items-center gap-1 px-2 py-1.5 overflow-x-auto flex-1 min-w-0"
				style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
				onKeyDown={(e) => {
					if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
						e.preventDefault();
						const container = scrollContainerRef.current;
						if (!container) return;
						
						// Get all focusable elements in toolbar
						const focusables = container.querySelectorAll<HTMLElement>('button, input, [tabindex="0"]');
						const currentIndex = Array.from(focusables).findIndex(el => el === document.activeElement);
						
						if (currentIndex === -1) return;
						
						let nextIndex: number;
						if (e.key === "ArrowRight") {
							nextIndex = (currentIndex + 1) % focusables.length;
						} else {
							nextIndex = (currentIndex - 1 + focusables.length) % focusables.length;
						}
						
						focusables[nextIndex]?.focus();
						focusables[nextIndex]?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" });
					} else if (e.key === "Escape") {
						// Return focus to editor on Escape
						editorView?.focus();
					}
				}}
			>
				{allButtons.map((button, index) => {
					const IconComponent = button.icon;
					const isActive = button.isActive?.() || false;
					return (
						<button
							key={index}
							type="button"
							tabIndex={0}
							className={`relative flex-shrink-0 w-8 h-8 flex items-center justify-center rounded transition-colors ${
								isActive
									? "bg-blue-500 text-white hover:bg-blue-600"
									: "hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
							}`}
							onClick={executeCommand(button.command)}
							title={`${button.label} ${button.shortcut ? `(${button.shortcut})` : ""}${button.keyTip ? ` [Alt+${button.keyTip}]` : ""}`}
						>
							<IconComponent size={16} />
							{/* KeyTip badge */}
							{altKeyHeld && button.keyTip && (
								<span className="absolute -top-1 -right-1 min-w-[14px] h-[14px] flex items-center justify-center bg-amber-400 text-gray-900 text-[9px] font-bold rounded shadow-sm border border-amber-500 px-0.5 z-50">
									{button.keyTip}
								</span>
							)}
						</button>
					);
				})}

				{/* Separator */}
				<div className="flex-shrink-0 w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />

				{/* Text Color Picker */}
				<div className="relative" ref={textColorRef}>
					<button
						type="button"
						tabIndex={0}
						className="relative w-8 h-8 flex flex-col items-center justify-center rounded transition-colors hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
						onClick={() => setShowColorPicker(showColorPicker === "text" ? null : "text")}
						title={`Text Color${currentTextColor ? ` (${currentTextColor})` : ""} (Alt+T)`}
					>
						<Palette size={14} className="mb-0.5" />
						<div 
							className="w-4 h-1 rounded-sm border border-gray-400 dark:border-gray-500"
							style={{ backgroundColor: currentTextColor || "transparent" }}
						/>
						{altKeyHeld && (
							<span className="absolute -top-1 -right-1 min-w-[14px] h-[14px] px-0.5 flex items-center justify-center bg-amber-400 text-[9px] font-bold text-amber-900 rounded shadow-sm">
								T
							</span>
						)}
					</button>
					{showColorPicker === "text" && colorPickerPos && (
						<div 
							className="fixed p-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded shadow-lg z-[100] min-w-[140px]"
							style={{ top: colorPickerPos.top, left: colorPickerPos.left }}
						>
							<ColorGrid
								colors={PRESET_COLORS}
								onSelectColor={(color) => {
									applyMarkWithAttrs(schema.marks.textColor, { color });
									setShowColorPicker(null);
								}}
								onRemoveColor={() => {
									removeMark(schema.marks.textColor);
									setShowColorPicker(null);
								}}
								removeLabel="Remove color"
							/>
						</div>
					)}
				</div>

				{/* Highlight Color Picker */}
				<div className="relative" ref={highlightRef}>
					<button
						type="button"
						tabIndex={0}
						className="relative w-8 h-8 flex flex-col items-center justify-center rounded transition-colors hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
						onClick={() => setShowColorPicker(showColorPicker === "highlight" ? null : "highlight")}
						title={`Highlight${currentHighlightColor ? ` (${currentHighlightColor})` : ""} (Alt+H)`}
					>
						<Highlighter size={14} className="mb-0.5" />
						<div 
							className="w-4 h-1 rounded-sm border border-gray-400 dark:border-gray-500"
							style={{ backgroundColor: currentHighlightColor || "transparent" }}
						/>
						{altKeyHeld && (
							<span className="absolute -top-1 -right-1 min-w-[14px] h-[14px] px-0.5 flex items-center justify-center bg-amber-400 text-[9px] font-bold text-amber-900 rounded shadow-sm">
								H
							</span>
						)}
					</button>
					{showColorPicker === "highlight" && colorPickerPos && (
						<div 
							className="fixed p-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded shadow-lg z-[100] min-w-[140px]"
							style={{ top: colorPickerPos.top, left: colorPickerPos.left }}
						>
							<ColorGrid
								colors={HIGHLIGHT_COLORS}
								onSelectColor={(color) => {
									applyMarkWithAttrs(schema.marks.highlight, { color });
									setShowColorPicker(null);
								}}
								onRemoveColor={() => {
									removeMark(schema.marks.highlight);
									setShowColorPicker(null);
								}}
								removeLabel="Remove highlight"
							/>
						</div>
					)}
				</div>

				{/* Separator */}
				<div className="flex-shrink-0 w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />

				{/* Clear Custom Formatting */}
				<button
					type="button"
					tabIndex={0}
					className="relative flex-shrink-0 w-8 h-8 flex items-center justify-center rounded transition-colors hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
					onClick={clearCustomFormatting}
					title="Clear Custom Formatting (Alt+R)"
				>
					<RemoveFormatting size={16} />
					{altKeyHeld && (
						<span className="absolute -top-1 -right-1 min-w-[14px] h-[14px] px-0.5 flex items-center justify-center bg-amber-400 text-[9px] font-bold text-amber-900 rounded shadow-sm">
							R
						</span>
					)}
				</button>

				{/* Font Size Dropdown */}
				<FontSizeDropdown
					schema={schema}
					editorView={editorView}
					isMarkActive={isMarkActive}
					applyMarkWithAttrs={applyMarkWithAttrs}
					removeMark={removeMark}
					altKeyHeld={altKeyHeld}
					keyTip="Z"
					inputRef={fontSizeInputRef}
				/>

				{/* Font Family Dropdown */}
				<FontFamilyDropdown
					schema={schema}
					editorView={editorView}
					isMarkActive={isMarkActive}
					applyMarkWithAttrs={applyMarkWithAttrs}
					removeMark={removeMark}
					altKeyHeld={altKeyHeld}
					keyTip="F"
					inputRef={fontFamilyInputRef}
				/>
			</div>

			{/* Right scroll arrow */}
			{canScrollRight && (
				<button
					type="button"
					tabIndex={0}
					className="flex-shrink-0 w-6 h-9 flex items-center justify-center bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 transition-colors z-10"
					onClick={() => scroll("right")}
					title="Scroll right"
				>
					<ChevronRight size={14} />
				</button>
			)}
		</div>
	);
}

// Font Size Dropdown Component
interface FontDropdownProps {
	schema: any;
	editorView: EditorView | null;
	isMarkActive: (markType: MarkType) => boolean;
	applyMarkWithAttrs: (markType: MarkType, attrs: Record<string, any>) => void;
	removeMark: (markType: MarkType) => void;
	altKeyHeld?: boolean;
	keyTip?: string;
	inputRef?: React.RefObject<HTMLInputElement | null>;
}

function FontSizeDropdown({ schema, editorView, applyMarkWithAttrs, removeMark, altKeyHeld, keyTip, inputRef: externalInputRef }: FontDropdownProps) {
	const [isOpen, setIsOpen] = useState(false);
	const [selectedIndex, setSelectedIndex] = useState(0);
	const [dropdownPos, setDropdownPos] = useState<{ top: number; left: number } | null>(null);
	const containerRef = useRef<HTMLDivElement>(null);
	const dropdownRef = useRef<HTMLDivElement>(null);
	const internalInputRef = useRef<HTMLInputElement>(null);
	const inputRef = externalInputRef || internalInputRef;
	const settings = useAtomValue(editorSettingsAtom);
	const baseFontSize = settings?.fontSize ?? 14;

	// Get current font size scale from selection
	const getCurrentScale = useCallback((): number | null => {
		if (!editorView) return null;
		const { $from, empty } = editorView.state.selection;
		const marks = empty ? editorView.state.storedMarks || $from.marks() : [];
		const fontSizeMark = marks.find((m: any) => m.type === schema.marks.fontSize);
		const size = fontSizeMark?.attrs?.size;
		if (!size) return null;
		if (size.endsWith("em")) {
			return parseFloat(size);
		} else if (size.endsWith("px")) {
			return parseFloat(size) / baseFontSize;
		}
		return null;
	}, [editorView, schema, baseFontSize]);

	const currentScale = getCurrentScale();
	const displaySize = currentScale !== null 
		? Math.round(currentScale * baseFontSize) 
		: baseFontSize;

	// All items: scales + reset option
	const allItems = [...FONT_SIZE_SCALES, "reset"] as const;
	const totalItems = allItems.length;

	// Scroll selected item into view
	useEffect(() => {
		if (isOpen && dropdownRef.current) {
			const selectedEl = dropdownRef.current.querySelector(`[data-index="${selectedIndex}"]`);
			selectedEl?.scrollIntoView({ block: "nearest" });
		}
	}, [isOpen, selectedIndex]);

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (!isOpen) {
			if (e.key === "ArrowDown" || e.key === "ArrowUp" || e.key === "Enter" || e.key === " ") {
				setIsOpen(true);
				// Find current scale in list or default to 0
				const currentIdx = FONT_SIZE_SCALES.findIndex(s => Math.abs(s - (currentScale || 1)) < 0.01);
				setSelectedIndex(currentIdx >= 0 ? currentIdx : 0);
				e.preventDefault();
			}
			return;
		}

		switch (e.key) {
			case "ArrowDown":
				e.preventDefault();
				setSelectedIndex((prev) => Math.min(prev + 1, totalItems - 1));
				break;
			case "ArrowUp":
				e.preventDefault();
				setSelectedIndex((prev) => Math.max(prev - 1, 0));
				break;
			case "Enter":
			case " ":
				e.preventDefault();
				if (selectedIndex === FONT_SIZE_SCALES.length) {
					// Reset option
					removeMark(schema.marks.fontSize);
				} else {
					applyMarkWithAttrs(schema.marks.fontSize, { size: `${FONT_SIZE_SCALES[selectedIndex]}em` });
				}
				setIsOpen(false);
				editorView?.focus();
				break;
			case "Escape":
			case "Tab":
				setIsOpen(false);
				if (e.key === "Escape") e.preventDefault();
				break;
		}
	};

	// Close on outside click
	useEffect(() => {
		const handleClickOutside = (e: MouseEvent) => {
			if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
				setIsOpen(false);
			}
		};
		if (isOpen) {
			document.addEventListener("mousedown", handleClickOutside);
			return () => document.removeEventListener("mousedown", handleClickOutside);
		}
		return undefined;
	}, [isOpen]);

	// Calculate dropdown position
	useEffect(() => {
		if (isOpen && containerRef.current) {
			const rect = containerRef.current.getBoundingClientRect();
			setDropdownPos({ top: rect.bottom + 4, left: rect.left });
		} else {
			setDropdownPos(null);
		}
	}, [isOpen]);

	return (
		<div className="relative flex-shrink-0" ref={containerRef}>
			{altKeyHeld && keyTip && (
				<span className="absolute -top-1 -right-1 min-w-[14px] h-[14px] px-0.5 flex items-center justify-center bg-amber-400 text-[9px] font-bold text-amber-900 rounded shadow-sm z-10">
					{keyTip}
				</span>
			)}
			<button
				ref={inputRef as React.RefObject<HTMLButtonElement>}
				type="button"
				className={`flex items-center h-7 px-2 gap-1 rounded border bg-white dark:bg-gray-700 transition-colors min-w-[60px] text-xs text-gray-700 dark:text-gray-300 ${
					isOpen ? "border-blue-500 ring-1 ring-blue-500" : "border-gray-300 dark:border-gray-600 hover:border-blue-500"
				}`}
				onClick={() => setIsOpen(!isOpen)}
				onKeyDown={handleKeyDown}
				title={`Font Size${keyTip ? ` (Alt+${keyTip})` : ""}`}
			>
				<span className="flex-1 text-center">{displaySize}</span>
				{isOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
			</button>
			{isOpen && dropdownPos && (
				<div 
					ref={dropdownRef}
					className="fixed bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded shadow-lg z-[100] min-w-[90px] max-h-[200px] overflow-y-auto"
					style={{ top: dropdownPos.top, left: dropdownPos.left }}
				>
					{FONT_SIZE_SCALES.map((scale, index) => {
						const effectivePx = Math.round(scale * baseFontSize);
						const isCurrentlySelected = currentScale !== null && Math.abs(currentScale - scale) < 0.01;
						return (
							<button
								key={scale}
								type="button"
								data-index={index}
								className={`w-full flex items-center justify-between px-2 py-1 text-xs text-gray-700 dark:text-gray-300 ${
									selectedIndex === index ? "bg-blue-100 dark:bg-blue-900" : "hover:bg-gray-100 dark:hover:bg-gray-700"
								} ${isCurrentlySelected ? "font-semibold" : ""}`}
								onClick={() => {
									applyMarkWithAttrs(schema.marks.fontSize, { size: `${scale}em` });
									setIsOpen(false);
									editorView?.focus();
								}}
								onMouseEnter={() => setSelectedIndex(index)}
							>
								<span>{effectivePx}</span>
								<span className="text-[10px] text-gray-400 ml-1">{scale}×</span>
							</button>
						);
					})}
					<button
						type="button"
						data-index={FONT_SIZE_SCALES.length}
						className={`w-full text-[10px] text-gray-600 dark:text-gray-400 py-1.5 border-t border-gray-200 dark:border-gray-700 ${
							selectedIndex === FONT_SIZE_SCALES.length ? "bg-blue-100 dark:bg-blue-900" : "hover:bg-gray-100 dark:hover:bg-gray-700"
						}`}
						onClick={() => {
							removeMark(schema.marks.fontSize);
							setIsOpen(false);
							editorView?.focus();
						}}
						onMouseEnter={() => setSelectedIndex(FONT_SIZE_SCALES.length)}
					>
						Reset ({baseFontSize})
					</button>
				</div>
			)}
		</div>
	);
}

function FontFamilyDropdown({ schema, editorView, applyMarkWithAttrs, removeMark, altKeyHeld, keyTip, inputRef: externalInputRef }: FontDropdownProps) {
	const [isOpen, setIsOpen] = useState(false);
	const [selectedIndex, setSelectedIndex] = useState(0);
	const [dropdownPos, setDropdownPos] = useState<{ top: number; left: number } | null>(null);
	const containerRef = useRef<HTMLDivElement>(null);
	const dropdownRef = useRef<HTMLDivElement>(null);
	const internalInputRef = useRef<HTMLInputElement>(null);
	const inputRef = externalInputRef || internalInputRef;

	// Get current font family from selection
	const getCurrentFontFamily = useCallback(() => {
		if (!editorView) return "System Default";
		const { $from, empty } = editorView.state.selection;
		const marks = empty ? editorView.state.storedMarks || $from.marks() : [];
		const fontFamilyMark = marks.find((m: any) => m.type === schema.marks.fontFamily);
		if (!fontFamilyMark) return "System Default";
		const family = fontFamilyMark.attrs?.family;
		const found = FONT_FAMILIES.find((f) => f.value === family);
		return found?.label || "Custom";
	}, [editorView, schema]);

	const currentFamily = getCurrentFontFamily();
	const totalItems = FONT_FAMILIES.length + 1; // +1 for reset

	// Scroll selected item into view
	useEffect(() => {
		if (isOpen && dropdownRef.current) {
			const selectedEl = dropdownRef.current.querySelector(`[data-index="${selectedIndex}"]`);
			selectedEl?.scrollIntoView({ block: "nearest" });
		}
	}, [isOpen, selectedIndex]);

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (!isOpen) {
			if (e.key === "ArrowDown" || e.key === "ArrowUp" || e.key === "Enter" || e.key === " ") {
				setIsOpen(true);
				// Find current family in list or default to 0
				const currentIdx = FONT_FAMILIES.findIndex(f => f.label === currentFamily);
				setSelectedIndex(currentIdx >= 0 ? currentIdx : 0);
				e.preventDefault();
			}
			return;
		}

		switch (e.key) {
			case "ArrowDown":
				e.preventDefault();
				setSelectedIndex((prev) => Math.min(prev + 1, totalItems - 1));
				break;
			case "ArrowUp":
				e.preventDefault();
				setSelectedIndex((prev) => Math.max(prev - 1, 0));
				break;
			case "Enter":
			case " ":
				e.preventDefault();
				if (selectedIndex === FONT_FAMILIES.length) {
					// Reset option
					removeMark(schema.marks.fontFamily);
				} else if (selectedIndex >= 0 && selectedIndex < FONT_FAMILIES.length) {
					const selectedFont = FONT_FAMILIES[selectedIndex];
					if (selectedFont) {
						applyMarkWithAttrs(schema.marks.fontFamily, { family: selectedFont.value });
					}
				}
				setIsOpen(false);
				editorView?.focus();
				break;
			case "Escape":
			case "Tab":
				setIsOpen(false);
				if (e.key === "Escape") e.preventDefault();
				break;
		}
	};

	// Close on outside click
	useEffect(() => {
		const handleClickOutside = (e: MouseEvent) => {
			if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
				setIsOpen(false);
			}
		};
		if (isOpen) {
			document.addEventListener("mousedown", handleClickOutside);
			return () => document.removeEventListener("mousedown", handleClickOutside);
		}
		return undefined;
	}, [isOpen]);

	// Calculate dropdown position
	useEffect(() => {
		if (isOpen && containerRef.current) {
			const rect = containerRef.current.getBoundingClientRect();
			setDropdownPos({ top: rect.bottom + 4, left: rect.left });
		} else {
			setDropdownPos(null);
		}
	}, [isOpen]);

	return (
		<div className="relative flex-shrink-0" ref={containerRef}>
			{altKeyHeld && keyTip && (
				<span className="absolute -top-1 -right-1 min-w-[14px] h-[14px] px-0.5 flex items-center justify-center bg-amber-400 text-[9px] font-bold text-amber-900 rounded shadow-sm z-10">
					{keyTip}
				</span>
			)}
			<button
				ref={inputRef as React.RefObject<HTMLButtonElement>}
				type="button"
				className={`flex items-center h-7 px-2 gap-1 rounded border bg-white dark:bg-gray-700 transition-colors min-w-[100px] max-w-[140px] text-xs text-gray-700 dark:text-gray-300 ${
					isOpen ? "border-blue-500 ring-1 ring-blue-500" : "border-gray-300 dark:border-gray-600 hover:border-blue-500"
				}`}
				onClick={() => setIsOpen(!isOpen)}
				onKeyDown={handleKeyDown}
				title={`Font Family${keyTip ? ` (Alt+${keyTip})` : ""}`}
			>
				<span className="flex-1 text-left truncate">{currentFamily}</span>
				{isOpen ? <ChevronUp size={12} className="flex-shrink-0" /> : <ChevronDown size={12} className="flex-shrink-0" />}
			</button>
			{isOpen && dropdownPos && (
				<div 
					ref={dropdownRef}
					className="fixed bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded shadow-lg z-[100] min-w-[140px] max-h-[200px] overflow-y-auto"
					style={{ top: dropdownPos.top, left: dropdownPos.left }}
				>
					{FONT_FAMILIES.map((font, index) => (
						<button
							key={font.value}
							type="button"
							data-index={index}
							className={`w-full flex items-center px-2 py-1 text-xs text-gray-700 dark:text-gray-300 ${
								selectedIndex === index ? "bg-blue-100 dark:bg-blue-900" : "hover:bg-gray-100 dark:hover:bg-gray-700"
							} ${currentFamily === font.label ? "font-semibold" : ""}`}
							style={{ fontFamily: font.value }}
							onClick={() => {
								applyMarkWithAttrs(schema.marks.fontFamily, { family: font.value });
								setIsOpen(false);
								editorView?.focus();
							}}
							onMouseEnter={() => setSelectedIndex(index)}
						>
							{font.label}
						</button>
					))}
					<button
						type="button"
						data-index={FONT_FAMILIES.length}
						className={`w-full text-[10px] text-gray-600 dark:text-gray-400 py-1.5 border-t border-gray-200 dark:border-gray-700 ${
							selectedIndex === FONT_FAMILIES.length ? "bg-blue-100 dark:bg-blue-900" : "hover:bg-gray-100 dark:hover:bg-gray-700"
						}`}
						onClick={() => {
							removeMark(schema.marks.fontFamily);
							setIsOpen(false);
							editorView?.focus();
						}}
						onMouseEnter={() => setSelectedIndex(FONT_FAMILIES.length)}
					>
						Reset to default
					</button>
				</div>
			)}
		</div>
	);
}
