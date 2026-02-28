import { EditorView } from "prosemirror-view";
import { toggleMark, setBlockType, wrapIn, lift } from "prosemirror-commands";
import { wrapInList, liftListItem } from "prosemirror-schema-list";
import { useState, useEffect, useRef, useCallback } from "react";
import type { MarkType, NodeType } from "prosemirror-model";
import { useAtomValue } from "jotai";
import { editorSettingsAtom } from "@/atoms/settings";
import {
	PRESET_COLORS,
	HIGHLIGHT_COLORS,
	FONT_SIZE_SCALES,
	FONT_FAMILIES,
} from "./format-constants";
import {
	Bold,
	Italic,
	Code,
	List,
	ListOrdered,
	Quote,
	ChevronDown,
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
	const toolbarRef = useRef<HTMLDivElement>(null);
	const textColorRef = useRef<HTMLDivElement>(null);
	const highlightRef = useRef<HTMLDivElement>(null);
	const fontSizeInputRef = useRef<HTMLInputElement>(null);
	const fontFamilyInputRef = useRef<HTMLInputElement>(null);

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
		const { from, $from, to, empty } = editorView.state.selection;
		if (empty) {
			const marks = editorView.state.storedMarks || $from.marks();
			const colorMark = marks.find((m: any) => m.type === schema.marks.textColor);
			return colorMark?.attrs?.color || null;
		}
		let found: string | null = null;
		editorView.state.doc.nodesBetween(from, to, (node) => {
			if (found) return false;
			if (node.isText) {
				const mark = node.marks.find((m: any) => m.type === schema.marks.textColor);
				if (mark) found = mark.attrs?.color || null;
				return false;
			}
			return true;
		});
		return found;
	}, [editorView, schema]);

	// Get current highlight color from selection
	const getCurrentHighlightColor = useCallback((): string | null => {
		if (!editorView || !schema.marks.highlight) return null;
		const { from, $from, to, empty } = editorView.state.selection;
		if (empty) {
			const marks = editorView.state.storedMarks || $from.marks();
			const highlightMark = marks.find((m: any) => m.type === schema.marks.highlight);
			return highlightMark?.attrs?.color || null;
		}
		let found: string | null = null;
		editorView.state.doc.nodesBetween(from, to, (node) => {
			if (found) return false;
			if (node.isText) {
				const mark = node.marks.find((m: any) => m.type === schema.marks.highlight);
				if (mark) found = mark.attrs?.color || null;
				return false;
			}
			return true;
		});
		return found;
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

				// Lists - with toggle behavior
				{
					icon: List,
					label: "Bullet List",
					shortcut: "Alt+L",
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

	// NOTE: Alt+key toolbar shortcuts temporarily disabled to free up key combinations.

	// Don't render if required props are missing
	if (!editorView || !schema) return null;

	return (
		<div
			ref={toolbarRef}
			data-editor-toolbar
			className="relative flex items-center flex-wrap bg-gray-100 dark:bg-gray-800 border-b border-gray-300 dark:border-gray-700 min-w-0 px-1 py-1 gap-0.5"
			onKeyDown={(e) => {
				if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
					e.preventDefault();
					const container = toolbarRef.current;
					if (!container) return;
					const focusables = container.querySelectorAll<HTMLElement>('button, input, [tabindex="0"]');
					const currentIndex = Array.from(focusables).findIndex(el => el === document.activeElement);
					if (currentIndex === -1) return;
					const nextIndex = e.key === "ArrowRight"
						? (currentIndex + 1) % focusables.length
						: (currentIndex - 1 + focusables.length) % focusables.length;
					focusables[nextIndex]?.focus();
				} else if (e.key === "Escape") {
					editorView?.focus();
				}
			}}
		>
			{/* Text formatting group */}
			<div className="flex items-center gap-0.5">
				{allButtons.slice(0, 5).map((button, index) => {
					const IconComponent = button.icon;
					const isActive = button.isActive?.() || false;
					return (
						<button
							key={index}
							type="button"
							tabIndex={0}
							className={`relative flex-shrink-0 w-7 h-7 flex items-center justify-center rounded transition-colors outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-inset ${
								isActive
									? "bg-blue-500 text-white hover:bg-blue-600"
									: "hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
							}`}
							onClick={executeCommand(button.command)}
							title={`${button.label}${button.shortcut ? ` (${button.shortcut})` : ""}`}
						>
							<IconComponent size={15} />
						</button>
					);
				})}
			</div>

			<div className="w-px h-5 bg-gray-300 dark:bg-gray-600" />

			{/* Block formatting group */}
			<div className="flex items-center gap-0.5">
				{allButtons.slice(5).map((button, index) => {
					const IconComponent = button.icon;
					const isActive = button.isActive?.() || false;
					return (
						<button
							key={index + 5}
							type="button"
							tabIndex={0}
							className={`relative flex-shrink-0 w-7 h-7 flex items-center justify-center rounded transition-colors outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-inset ${
								isActive
									? "bg-blue-500 text-white hover:bg-blue-600"
									: "hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
							}`}
							onClick={executeCommand(button.command)}
							title={`${button.label}${button.shortcut ? ` (${button.shortcut})` : ""}`}
						>
							<IconComponent size={15} />
						</button>
					);
				})}
			</div>

			<div className="w-px h-5 bg-gray-300 dark:bg-gray-600" />

			{/* Colors & clear formatting group */}
			<div className="flex items-center gap-0.5">
				{/* Text Color Picker */}
				<div className="relative" ref={textColorRef}>
					<button
						type="button"
						tabIndex={0}
						className="relative w-7 h-7 flex flex-col items-center justify-center rounded transition-colors outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-inset hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
						onClick={() => setShowColorPicker(showColorPicker === "text" ? null : "text")}
						title={`Text Color${currentTextColor ? ` (${currentTextColor})` : ""}`}
					>
						<Palette size={13} className="mb-0.5" />
						<div 
							className="w-3.5 h-0.5 rounded-sm"
							style={{ backgroundColor: currentTextColor || "currentColor" }}
						/>
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
						className="relative w-7 h-7 flex flex-col items-center justify-center rounded transition-colors outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-inset hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
						onClick={() => setShowColorPicker(showColorPicker === "highlight" ? null : "highlight")}
						title={`Highlight${currentHighlightColor ? ` (${currentHighlightColor})` : ""}`}
					>
						<Highlighter size={13} className="mb-0.5" />
						<div 
							className="w-3.5 h-0.5 rounded-sm"
							style={{ backgroundColor: currentHighlightColor || "currentColor" }}
						/>
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

				{/* Clear Custom Formatting */}
				<button
					type="button"
					tabIndex={0}
					className="relative flex-shrink-0 w-7 h-7 flex items-center justify-center rounded transition-colors outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-inset hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
					onClick={clearCustomFormatting}
					title="Clear Custom Formatting"
				>
					<RemoveFormatting size={15} />
				</button>
			</div>

			<div className="w-px h-5 bg-gray-300 dark:bg-gray-600" />

			{/* Font controls group */}
			<div className="flex items-center gap-1">
				<FontSizeDropdown
					schema={schema}
					editorView={editorView}
					isMarkActive={isMarkActive}
					applyMarkWithAttrs={applyMarkWithAttrs}
					removeMark={removeMark}
					inputRef={fontSizeInputRef}
				/>

				<FontFamilyDropdown
					schema={schema}
					editorView={editorView}
					isMarkActive={isMarkActive}
					applyMarkWithAttrs={applyMarkWithAttrs}
					removeMark={removeMark}
					inputRef={fontFamilyInputRef}
				/>
			</div>
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
	inputRef?: React.RefObject<HTMLInputElement | null>;
}

function FontSizeDropdown({ schema, editorView, applyMarkWithAttrs, removeMark, inputRef: externalInputRef }: FontDropdownProps) {
	const [isOpen, setIsOpen] = useState(false);
	const [selectedIndex, setSelectedIndex] = useState(0);
	const [dropdownPos, setDropdownPos] = useState<{ top: number; left: number } | null>(null);
	const [, setTick] = useState(0);
	const containerRef = useRef<HTMLDivElement>(null);
	const dropdownRef = useRef<HTMLDivElement>(null);
	const internalInputRef = useRef<HTMLInputElement>(null);
	const inputRef = externalInputRef || internalInputRef;
	const settings = useAtomValue(editorSettingsAtom);
	const baseFontSize = settings?.fontSize ?? 14;

	// Re-render when editor state changes
	useEffect(() => {
		if (!editorView) return;
		const update = () => setTick((t) => t + 1);
		const interval = setInterval(update, 100);
		return () => clearInterval(interval);
	}, [editorView]);

	// Get current font size scale from selection
	const getCurrentScale = useCallback((): number | null => {
		if (!editorView) return null;
		const { from, $from, to, empty } = editorView.state.selection;
		let marks;
		if (empty) {
			marks = editorView.state.storedMarks || $from.marks();
		} else {
			// For non-empty selection, find the mark on the first text character in range
			let found: any = null;
			editorView.state.doc.nodesBetween(from, to, (node) => {
				if (found) return false;
				if (node.isText) {
					const mark = node.marks.find((m: any) => m.type === schema.marks.fontSize);
					if (mark) found = mark;
					return false;
				}
				return true;
			});
			const size = found?.attrs?.size;
			if (!size) return null;
			if (size.endsWith("em")) return parseFloat(size);
			if (size.endsWith("px")) return parseFloat(size) / baseFontSize;
			return null;
		}
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
			<button
				ref={inputRef as React.RefObject<HTMLButtonElement>}
				type="button"
				className={`flex items-center h-6 px-1.5 gap-0.5 rounded transition-colors min-w-[42px] text-[11px] text-gray-700 dark:text-gray-300 ${
					isOpen ? "bg-gray-200 dark:bg-gray-600" : "hover:bg-gray-200 dark:hover:bg-gray-700"
				}`}
				onClick={() => setIsOpen(!isOpen)}
				onKeyDown={handleKeyDown}
				title="Font Size"
			>
				<span className="flex-1 text-center tabular-nums">{displaySize}</span>
				<ChevronDown size={10} className={`flex-shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`} />
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

function FontFamilyDropdown({ schema, editorView, applyMarkWithAttrs, removeMark, inputRef: externalInputRef }: FontDropdownProps) {
	const [isOpen, setIsOpen] = useState(false);
	const [selectedIndex, setSelectedIndex] = useState(0);
	const [dropdownPos, setDropdownPos] = useState<{ top: number; left: number } | null>(null);
	const [, setTick] = useState(0);
	const containerRef = useRef<HTMLDivElement>(null);
	const dropdownRef = useRef<HTMLDivElement>(null);
	const internalInputRef = useRef<HTMLInputElement>(null);
	const inputRef = externalInputRef || internalInputRef;

	// Re-render when editor state changes
	useEffect(() => {
		if (!editorView) return;
		const update = () => setTick((t) => t + 1);
		const interval = setInterval(update, 100);
		return () => clearInterval(interval);
	}, [editorView]);

	// Get current font family from selection
	const getCurrentFontFamily = useCallback(() => {
		if (!editorView) return "System Default";
		const { from, $from, to, empty } = editorView.state.selection;
		let fontFamilyMark: any = null;
		if (empty) {
			const marks = editorView.state.storedMarks || $from.marks();
			fontFamilyMark = marks.find((m: any) => m.type === schema.marks.fontFamily);
		} else {
			// For non-empty selection, find the mark on the first text character in range
			editorView.state.doc.nodesBetween(from, to, (node) => {
				if (fontFamilyMark) return false;
				if (node.isText) {
					const mark = node.marks.find((m: any) => m.type === schema.marks.fontFamily);
					if (mark) fontFamilyMark = mark;
					return false;
				}
				return true;
			});
		}
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
			<button
				ref={inputRef as React.RefObject<HTMLButtonElement>}
				type="button"
				className={`flex items-center h-6 px-1.5 gap-0.5 rounded transition-colors text-[11px] text-gray-700 dark:text-gray-300 whitespace-nowrap ${
					isOpen ? "bg-gray-200 dark:bg-gray-600" : "hover:bg-gray-200 dark:hover:bg-gray-700"
				}`}
				onClick={() => setIsOpen(!isOpen)}
				onKeyDown={handleKeyDown}
				title="Font Family"
			>
				<span className="text-left">{currentFamily}</span>
				<ChevronDown size={10} className={`flex-shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`} />
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
