import { EditorView } from "prosemirror-view";
import { toggleMark, setBlockType, wrapIn, lift } from "prosemirror-commands";
import { wrapInList, liftListItem } from "prosemirror-schema-list";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import type { MarkType, NodeType } from "prosemirror-model";
import { useAtom, useAtomValue } from "jotai";
import { editorSettingsAtom } from "@/atoms/settings";
import { EDITOR_SETTINGS_CONSTRAINTS } from "@/types/editor-settings";
import { setTextAlign, setTableAlign, setCellContentAlign, fitColumnWidths } from "./format-commands";
import { isInTable, addRowAfter, addColumnAfter, deleteRow, deleteColumn, deleteTable, setCellAttr, CellSelection } from "prosemirror-tables";
import {
	PRESET_COLORS,
	HIGHLIGHT_COLORS,
	FONT_SIZE_SCALES,
	FONT_FAMILIES,
	getFontsByGroup,
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
	BoxSelect,
	ALargeSmall,
	SquareCode,
	AlignLeft,
	AlignCenter,
	AlignRight,
	Columns3,
	Plus,
	Minus,
	Trash2,
	Shrink,
	PaintBucket,
	Grid3x3,
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

// Compact cell color picker for table toolbar
const CELL_COLORS = [
	"#ef4444", "#f97316", "#eab308", "#22c55e",
	"#3b82f6", "#8b5cf6", "#ec4899", "#14b8a6",
	"#fca5a5", "#fdba74", "#fde047", "#86efac",
	"#93c5fd", "#c4b5fd", "#f9a8d4", "#99f6e4",
];

interface CellColorPickerProps {
	icon: any;
	label: string;
	currentColor: string | null;
	onSelectColor: (color: string) => void;
	onRemoveColor: () => void;
}

function CellColorPicker({ icon: Icon, label, currentColor, onSelectColor, onRemoveColor }: CellColorPickerProps) {
	const [open, setOpen] = useState(false);
	const [pickerPos, setPickerPos] = useState<{ top: number; left: number } | null>(null);
	const btnRef = useRef<HTMLButtonElement>(null);
	const panelRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (!open) return;
		if (btnRef.current) {
			const rect = btnRef.current.getBoundingClientRect();
			setPickerPos({ top: rect.bottom + 4, left: rect.left });
		}
		const handleClick = (e: MouseEvent) => {
			if (panelRef.current && !panelRef.current.contains(e.target as Node) && !btnRef.current?.contains(e.target as Node)) {
				setOpen(false);
			}
		};
		const handleEsc = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
		document.addEventListener("mousedown", handleClick);
		document.addEventListener("keydown", handleEsc);
		return () => { document.removeEventListener("mousedown", handleClick); document.removeEventListener("keydown", handleEsc); };
	}, [open]);

	return (
		<>
			<button
				ref={btnRef}
				type="button"
				tabIndex={0}
				className="relative flex-shrink-0 w-7 h-7 flex flex-col items-center justify-center rounded transition-colors outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-inset hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
				onClick={() => setOpen((v) => !v)}
				title={`${label}${currentColor ? ` (${currentColor})` : ""}`}
			>
				<Icon size={13} className="mb-0.5" />
				<div className="w-3.5 h-0.5 rounded-sm" style={{ backgroundColor: currentColor || "currentColor" }} />
			</button>
			{open && pickerPos && (
				<div
					ref={panelRef}
					className="fixed p-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded shadow-lg z-[100]"
					style={{ top: pickerPos.top, left: pickerPos.left }}
				>
					<div className="grid grid-cols-4 gap-1.5 mb-2">
						{CELL_COLORS.map((color) => (
							<button
								key={color}
								type="button"
								className={`w-6 h-6 rounded border-2 cursor-pointer transition-all ${currentColor === color ? "border-blue-500 ring-1 ring-blue-300 scale-110" : "border-gray-300 dark:border-gray-600 hover:border-blue-400 hover:scale-110"}`}
								style={{ backgroundColor: color }}
								onClick={() => { onSelectColor(color); setOpen(false); }}
								title={color}
							/>
						))}
					</div>
					<button
						type="button"
						className="w-full text-[10px] py-1 text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 border-t border-gray-200 dark:border-gray-700"
						onClick={() => { onRemoveColor(); setOpen(false); }}
					>
						Remove
					</button>
				</div>
			)}
		</>
	);
}

// ── Floating table toolbar ──
// Appears above the active table when cursor is inside one.
function TableFloatingToolbar({ editorView }: { editorView: EditorView }) {
	const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
	const toolbarRef = useRef<HTMLDivElement>(null);

	// Position the floating toolbar above the table wrapper
	useEffect(() => {
		const { $from } = editorView.state.selection;
		// Find the table node position
		let tablePos = -1;
		for (let d = $from.depth; d > 0; d--) {
			if ($from.node(d).type.name === "table") {
				tablePos = $from.before(d);
				break;
			}
		}
		if (tablePos < 0) { setPos(null); return; }

		const domNode = editorView.nodeDOM(tablePos);
		if (!domNode) { setPos(null); return; }
		const el = domNode instanceof HTMLElement ? domNode : (domNode as any).parentElement;
		if (!el) { setPos(null); return; }
		// The tableWrapper div is the parent of the <table>
		const wrapper = el.closest(".tableWrapper") || el;
		const rect = wrapper.getBoundingClientRect();
		const toolbarH = 36; // approximate height
		setPos({
			top: rect.top - toolbarH - 4,
			left: rect.left,
		});
	}, [editorView, editorView.state.selection]);

	if (!pos) return null;

	const tableBtn = (opts: { icon: any; label: string; shortcut?: string; onClick: () => void; active?: boolean; destructive?: boolean }) => (
		<button
			type="button"
			tabIndex={0}
			className={`relative flex-shrink-0 w-7 h-7 flex items-center justify-center rounded transition-colors outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-inset ${
				opts.active
					? "bg-blue-500 text-white hover:bg-blue-600"
					: opts.destructive
						? "hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400"
						: "hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
			}`}
			onClick={() => { opts.onClick(); editorView.focus(); }}
			title={`${opts.label}${opts.shortcut ? ` (${opts.shortcut})` : ""}`}
		>
			<opts.icon size={15} />
		</button>
	);

	// Read current cell's text alignment
	const getCellTextAlign = () => {
		const { $from } = editorView.state.selection;
		for (let d = $from.depth; d > 0; d--) {
			if ($from.node(d).type.name === "paragraph") {
				return $from.node(d).attrs.textAlign || null;
			}
		}
		return null;
	};
	const cellAlign = getCellTextAlign();

	// Read current cell's attributes
	const getCellAttr = (attr: string) => {
		const { selection } = editorView.state;
		if (selection instanceof CellSelection) {
			let val: string | null = null;
			selection.forEachCell((node) => {
				if (val === null) val = node.attrs[attr] || null;
			});
			return val;
		}
		const { $from } = selection;
		for (let d = $from.depth; d > 0; d--) {
			const n = $from.node(d);
			if (n.type.name === "table_cell" || n.type.name === "table_header") {
				return n.attrs[attr] || null;
			}
		}
		return null;
	};
	const cellBg = getCellAttr("background");
	const cellBorder = getCellAttr("borderColor");
	const cellBorderWidth = getCellAttr("borderWidth");
	const cellPadding = getCellAttr("cellPadding");

	return createPortal(
		<div
			ref={toolbarRef}
			className="fixed z-[90] flex items-center gap-0.5 px-1.5 py-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg"
			style={{ top: pos.top, left: pos.left }}
			onMouseDown={(e) => e.preventDefault()} // prevent stealing focus from editor
		>
			<span className="text-[10px] text-blue-600 dark:text-blue-400 px-0.5 font-medium select-none">TABLE</span>

			{/* Cell text alignment */}
			{tableBtn({ icon: AlignLeft, label: "Cell Align Left", onClick: () => setCellContentAlign(null)(editorView.state, editorView.dispatch), active: cellAlign === null })}
			{tableBtn({ icon: AlignCenter, label: "Cell Align Center", onClick: () => setCellContentAlign("center")(editorView.state, editorView.dispatch), active: cellAlign === "center" })}
			{tableBtn({ icon: AlignRight, label: "Cell Align Right", onClick: () => setCellContentAlign("right")(editorView.state, editorView.dispatch), active: cellAlign === "right" })}

			<div className="w-px h-4 bg-gray-300 dark:bg-gray-600" />

			{/* Cell background color */}
			<CellColorPicker
				icon={PaintBucket}
				label="Cell Background"
				currentColor={cellBg}
				onSelectColor={(color) => { setCellAttr("background", color)(editorView.state, editorView.dispatch); editorView.focus(); }}
				onRemoveColor={() => { setCellAttr("background", null)(editorView.state, editorView.dispatch); editorView.focus(); }}
			/>

			{/* Cell border color */}
			<CellColorPicker
				icon={Grid3x3}
				label="Cell Border"
				currentColor={cellBorder}
				onSelectColor={(color) => { setCellAttr("borderColor", color)(editorView.state, editorView.dispatch); editorView.focus(); }}
				onRemoveColor={() => { setCellAttr("borderColor", null)(editorView.state, editorView.dispatch); editorView.focus(); }}
			/>

			{/* Border thickness */}
			<select
				className="h-6 text-[10px] bg-transparent border border-gray-300 dark:border-gray-600 rounded px-0.5 text-gray-700 dark:text-gray-300 outline-none"
				value={cellBorderWidth || ""}
				onChange={(e) => {
					const v = e.target.value || null;
					setCellAttr("borderWidth", v)(editorView.state, editorView.dispatch);
					editorView.focus();
				}}
				title="Border Thickness"
			>
				<option value="">Border</option>
				<option value="0">None</option>
				<option value="1">1px</option>
				<option value="2">2px</option>
				<option value="3">3px</option>
			</select>

			{/* Cell padding */}
			<select
				className="h-6 text-[10px] bg-transparent border border-gray-300 dark:border-gray-600 rounded px-0.5 text-gray-700 dark:text-gray-300 outline-none"
				value={cellPadding || ""}
				onChange={(e) => {
					const v = e.target.value || null;
					setCellAttr("cellPadding", v)(editorView.state, editorView.dispatch);
					editorView.focus();
				}}
				title="Cell Padding"
			>
				<option value="">Padding</option>
				<option value="2">2px</option>
				<option value="4">4px</option>
				<option value="8">8px</option>
				<option value="12">12px</option>
				<option value="16">16px</option>
			</select>

			<div className="w-px h-4 bg-gray-300 dark:bg-gray-600" />

			{/* Add/remove rows */}
			{tableBtn({ icon: Plus, label: "Add Row After", shortcut: "Ctrl+Enter", onClick: () => addRowAfter(editorView.state, editorView.dispatch) })}
			{tableBtn({ icon: Minus, label: "Delete Row", shortcut: "Shift+Delete", onClick: () => deleteRow(editorView.state, editorView.dispatch), destructive: true })}

			<div className="w-px h-4 bg-gray-300 dark:bg-gray-600" />

			{/* Add/remove columns */}
			{tableBtn({ icon: Columns3, label: "Add Column After", shortcut: "Ctrl+Alt+Enter", onClick: () => addColumnAfter(editorView.state, editorView.dispatch) })}
			{tableBtn({ icon: Minus, label: "Delete Column", shortcut: "Ctrl+Shift+Delete", onClick: () => deleteColumn(editorView.state, editorView.dispatch), destructive: true })}

			<div className="w-px h-4 bg-gray-300 dark:bg-gray-600" />

			{/* Fit columns & delete table */}
			{tableBtn({ icon: Shrink, label: "Fit Column Widths", shortcut: "Ctrl+Shift+W", onClick: () => fitColumnWidths(editorView.state, editorView.dispatch, editorView) })}
			{tableBtn({ icon: Trash2, label: "Delete Table", onClick: () => deleteTable(editorView.state, editorView.dispatch), destructive: true })}
		</div>,
		document.body,
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

	// Editor settings for spacing controls
	const [editorSettings, setEditorSettings] = useAtom(editorSettingsAtom);
	const [boxDebug, setBoxDebug] = useState(false);

	// Sync box-model debug class directly onto the ProseMirror DOM element
	useEffect(() => {
		const dom = editorView?.dom as HTMLElement | undefined;
		if (!dom) return;
		if (boxDebug) {
			dom.classList.add("pm-box-debug");
		} else {
			dom.classList.remove("pm-box-debug");
		}
		// Clean up when toolbar unmounts
		return () => dom.classList.remove("pm-box-debug");
	}, [editorView, boxDebug]);

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
					icon: SquareCode,
					label: "Code Section",
					shortcut: "Ctrl+Shift+`",
					command: (state: any, dispatch: any) => {
						if (isBlockActive(schema.nodes.code_section)) {
							return lift(state, dispatch);
						}
						return wrapIn(schema.nodes.code_section)(state, dispatch);
					},
					isActive: () => isBlockActive(schema.nodes.code_section),
					className: "toolbar-code-section",
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

			{/* Alignment group — table position when in table, text alignment otherwise */}
			<div className="flex items-center gap-0.5">
				{([
					{ align: null, icon: AlignLeft, label: "Align Left", shortcut: "" },
					{ align: "center" as const, icon: AlignCenter, label: "Align Center", shortcut: "Ctrl+Shift+E" },
					{ align: "right" as const, icon: AlignRight, label: "Align Right", shortcut: "Ctrl+Shift+R" },
				]).map(({ align, icon: Icon, label, shortcut }) => {
					const inTbl = editorView ? isInTable(editorView.state) : false;
					const currentAlign = (() => {
						if (!editorView) return null;
						const { $from } = editorView.state.selection;
						if (inTbl) {
							for (let d = $from.depth; d > 0; d--) {
								if ($from.node(d).type.name === "table") {
									return $from.node(d).attrs.textAlign || null;
								}
							}
						}
						for (let d = $from.depth; d > 0; d--) {
							if ($from.node(d).type.name === "paragraph") {
								return $from.node(d).attrs.textAlign || null;
							}
						}
						return null;
					})();
					const isActive = currentAlign === align;
					const cmd = inTbl ? setTableAlign(align) : setTextAlign(align);
					return (
						<button
							key={label}
							type="button"
							tabIndex={0}
							className={`relative flex-shrink-0 w-7 h-7 flex items-center justify-center rounded transition-colors outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-inset ${
								isActive
									? "bg-blue-500 text-white hover:bg-blue-600"
									: "hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
							}`}
							onClick={executeCommand(cmd)}
							title={`${inTbl ? "Table " : ""}${label}${shortcut ? ` (${shortcut})` : ""}`}
						>
							<Icon size={15} />
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

			<div className="w-px h-5 bg-gray-300 dark:bg-gray-600" />

			{/* Spacing controls group */}
			<div className="flex items-center gap-0.5">
				<SpacingDropdown
					label="Line Height"
					value={editorSettings?.lineHeight ?? 1.6}
					onChange={(v) => setEditorSettings((prev) => ({ ...prev!, lineHeight: v }))}
					presets={[1.2, 1.4, 1.5, 1.6, 1.8, 2.0, 2.5]}
					format={(v) => v.toFixed(1)}
					defaultValue={1.6}
					step={EDITOR_SETTINGS_CONSTRAINTS.lineHeight.step}
					min={EDITOR_SETTINGS_CONSTRAINTS.lineHeight.min}
					max={EDITOR_SETTINGS_CONSTRAINTS.lineHeight.max}
					icon="↕"
				/>
				<SpacingDropdown
					label="Letter Spacing"
					value={editorSettings?.letterSpacing ?? 0}
					onChange={(v) => setEditorSettings((prev) => ({ ...prev!, letterSpacing: v }))}
					presets={[-0.05, 0, 0.02, 0.05, 0.1, 0.15, 0.2]}
					format={(v) => v === 0 ? "0" : `${v > 0 ? "+" : ""}${v.toFixed(2)}`}
					defaultValue={0}
					step={EDITOR_SETTINGS_CONSTRAINTS.letterSpacing.step}
					min={EDITOR_SETTINGS_CONSTRAINTS.letterSpacing.min}
					max={EDITOR_SETTINGS_CONSTRAINTS.letterSpacing.max}
					icon="↔"
				/>
				<SpacingDropdown
					label="Paragraph Spacing"
					value={editorSettings?.paragraphSpacing ?? 0.5}
					onChange={(v) => setEditorSettings((prev) => ({ ...prev!, paragraphSpacing: v }))}
					presets={[0, 0.3, 0.5, 0.8, 1.0, 1.5]}
					format={(v) => `${v.toFixed(1)}em`}
					defaultValue={0.5}
					step={EDITOR_SETTINGS_CONSTRAINTS.paragraphSpacing.step}
					min={EDITOR_SETTINGS_CONSTRAINTS.paragraphSpacing.min}
					max={EDITOR_SETTINGS_CONSTRAINTS.paragraphSpacing.max}
					icon="¶"
				/>
				<SpacingDropdown
					label="Editor Padding"
					value={editorSettings?.editorPadding ?? 16}
					onChange={(v) => setEditorSettings((prev) => ({ ...prev!, editorPadding: v }))}
					presets={[8, 12, 16, 24, 32, 48, 64]}
					format={(v) => `${v}px`}
					defaultValue={16}
					step={EDITOR_SETTINGS_CONSTRAINTS.editorPadding.step}
					min={EDITOR_SETTINGS_CONSTRAINTS.editorPadding.min}
					max={EDITOR_SETTINGS_CONSTRAINTS.editorPadding.max}
					icon="⬚"
				/>
			</div>

			<div className="w-px h-5 bg-gray-300 dark:bg-gray-600" />

			{/* Box model debug toggle */}
			<button
				type="button"
				className={`relative flex-shrink-0 w-7 h-7 flex items-center justify-center rounded transition-colors outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-inset ${
					boxDebug
						? "bg-amber-200 dark:bg-amber-700 text-amber-800 dark:text-amber-200"
						: "hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
				}`}
				onClick={() => setBoxDebug((v) => !v)}
				title="Toggle box model inspector"
			>
				<BoxSelect size={14} />
			</button>

			{/* Floating table toolbar — rendered via portal above the active table */}
			{editorView && isInTable(editorView.state) && (
				<TableFloatingToolbar editorView={editorView} />
			)}
		</div>
	);
}

// Spacing Dropdown Component (dropdown-style for global editor settings, like FontSizeDropdown)
interface SpacingDropdownProps {
	label: string;
	value: number;
	onChange: (value: number) => void;
	presets: number[];
	format: (value: number) => string;
	defaultValue: number;
	step: number;
	min: number;
	max: number;
	icon: string;
}

function SpacingDropdown({ label, value, onChange, presets, format, defaultValue, step, min, max, icon }: SpacingDropdownProps) {
	const [isOpen, setIsOpen] = useState(false);
	const [selectedIndex, setSelectedIndex] = useState(0);
	const [dropdownPos, setDropdownPos] = useState<{ top: number; left: number } | null>(null);
	const containerRef = useRef<HTMLDivElement>(null);
	const dropdownRef = useRef<HTMLDivElement>(null);

	const clamp = (v: number) => Math.round(Math.max(min, Math.min(max, v)) * 1000) / 1000;

	const allItems = [...presets, "reset"] as const;

	const openDropdown = useCallback(() => {
		if (containerRef.current) {
			const rect = containerRef.current.getBoundingClientRect();
			setDropdownPos({ top: rect.bottom + 4, left: rect.left });
		}
		const idx = presets.findIndex((p) => Math.abs(p - value) < step * 0.5);
		setSelectedIndex(idx >= 0 ? idx : 0);
		setIsOpen(true);
	}, [presets, value, step]);

	useEffect(() => {
		if (!isOpen) return;
		const handler = (e: MouseEvent) => {
			if (
				containerRef.current && !containerRef.current.contains(e.target as Node) &&
				!(dropdownRef.current && dropdownRef.current.contains(e.target as Node))
			) {
				setIsOpen(false);
			}
		};
		document.addEventListener("mousedown", handler);
		return () => document.removeEventListener("mousedown", handler);
	}, [isOpen]);

	useEffect(() => {
		if (isOpen && dropdownRef.current) {
			const el = dropdownRef.current.querySelector(`[data-index="${selectedIndex}"]`);
			el?.scrollIntoView({ block: "nearest" });
		}
	}, [isOpen, selectedIndex]);

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (!isOpen) {
			if (e.key === "ArrowDown" || e.key === "ArrowUp" || e.key === "Enter" || e.key === " ") {
				e.preventDefault();
				openDropdown();
			} else if (e.key === "ArrowRight") {
				e.preventDefault();
				onChange(clamp(value + step));
			} else if (e.key === "ArrowLeft") {
				e.preventDefault();
				onChange(clamp(value - step));
			}
			return;
		}
		switch (e.key) {
			case "ArrowDown":
				e.preventDefault();
				setSelectedIndex((i) => Math.min(i + 1, allItems.length - 1));
				break;
			case "ArrowUp":
				e.preventDefault();
				setSelectedIndex((i) => Math.max(i - 1, 0));
				break;
			case "Enter":
			case " ": {
				e.preventDefault();
				const item = allItems[selectedIndex];
				if (item === "reset") {
					onChange(defaultValue);
				} else if (typeof item === "number") {
					onChange(item);
				}
				setIsOpen(false);
				break;
			}
			case "Escape":
			case "Tab":
				setIsOpen(false);
				if (e.key === "Escape") {
					e.preventDefault();
					e.stopPropagation(); // Prevent toolbar's Escape handler from stealing focus
				}
				break;
		}
	};

	return (
		<div className="relative flex-shrink-0" ref={containerRef}>
			<button
				type="button"
				className={`flex-shrink-0 flex items-center gap-0.5 h-6 px-1 rounded transition-colors outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-inset ${
					isOpen ? "bg-gray-200 dark:bg-gray-600" : "hover:bg-gray-200 dark:hover:bg-gray-700"
				} text-gray-700 dark:text-gray-300`}
				onClick={() => (isOpen ? setIsOpen(false) : openDropdown())}
				onKeyDown={handleKeyDown}
				title={`${label}: ${format(value)}`}
			>
				<span className="text-[11px] leading-none select-none flex-shrink-0">{icon}</span>
				<span className="text-[10px] tabular-nums leading-none min-w-[22px] text-center">{format(value)}</span>
				<ChevronDown size={7} className={`flex-shrink-0 opacity-40 transition-transform ${isOpen ? "rotate-180" : ""}`} />
			</button>
			{isOpen && dropdownPos && (
				<div
					ref={dropdownRef}
					className="fixed bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded shadow-lg z-[100] min-w-[100px] max-h-[200px] overflow-y-auto"
					style={{ top: dropdownPos.top, left: dropdownPos.left }}
				>
					{presets.map((preset, index) => {
						const isCurrentValue = Math.abs(preset - value) < step * 0.5;
						return (
							<button
								key={preset}
								type="button"
								data-index={index}
								className={`w-full text-left px-3 py-1.5 text-xs tabular-nums ${
									selectedIndex === index
										? "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300"
										: "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
								} ${isCurrentValue ? "font-semibold" : ""}`}
								onClick={() => { onChange(preset); setIsOpen(false); }}
								onMouseEnter={() => setSelectedIndex(index)}
							>
								{format(preset)}
							</button>
						);
					})}
					<div className="border-t border-gray-200 dark:border-gray-600" />
					<button
						type="button"
						data-index={presets.length}
						className={`w-full text-left px-3 py-1.5 text-[10px] text-gray-500 dark:text-gray-400 ${
							selectedIndex === presets.length
								? "bg-blue-100 dark:bg-blue-900"
								: "hover:bg-gray-100 dark:hover:bg-gray-700"
						}`}
						onClick={() => { onChange(defaultValue); setIsOpen(false); }}
						onMouseEnter={() => setSelectedIndex(presets.length)}
					>
						Reset ({format(defaultValue)})
					</button>
				</div>
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
				if (e.key === "Escape") {
					e.preventDefault();
					e.stopPropagation(); // Prevent toolbar's Escape handler from stealing focus
				}
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
				className={`flex-shrink-0 flex items-center gap-0.5 h-6 px-1 rounded transition-colors outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-inset ${
					isOpen ? "bg-gray-200 dark:bg-gray-600" : "hover:bg-gray-200 dark:hover:bg-gray-700"
				} text-gray-700 dark:text-gray-300`}
				onClick={() => setIsOpen(!isOpen)}
				onKeyDown={handleKeyDown}
				title={`Font Size: ${displaySize}px`}
			>
				<ALargeSmall size={13} className="flex-shrink-0" />
				<span className="text-[10px] tabular-nums leading-none min-w-[18px] text-center">{displaySize}</span>
				<ChevronDown size={7} className={`flex-shrink-0 text-gray-500 dark:text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
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

	// Build flat list of items: group headers (non-selectable) + font entries + reset
	const groupedFonts = getFontsByGroup();
	const flatItems = useMemo(() => {
		const items: { type: "header"; label: string; group: string }[] | { type: "font"; font: typeof FONT_FAMILIES[number]; flatIndex: number }[] | { type: "reset"; flatIndex: number }[] = [];
		let selectableIndex = 0;
		for (const g of groupedFonts) {
			(items as any[]).push({ type: "header", label: g.label, group: g.group });
			for (const font of g.fonts) {
				(items as any[]).push({ type: "font", font, flatIndex: selectableIndex });
				selectableIndex++;
			}
		}
		(items as any[]).push({ type: "reset", flatIndex: selectableIndex });
		return items as ({ type: "header"; label: string; group: string } | { type: "font"; font: typeof FONT_FAMILIES[number]; flatIndex: number } | { type: "reset"; flatIndex: number })[];
	}, [groupedFonts]);

	const selectableCount = FONT_FAMILIES.length + 1; // fonts + reset

	// Get current font family from selection
	const getCurrentFontFamily = useCallback(() => {
		if (!editorView) return "Default";
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
		if (!fontFamilyMark) return "Default";
		const family = fontFamilyMark.attrs?.family;
		const found = FONT_FAMILIES.find((f) => f.value === family);
		// Show first font name in stack for unknown fonts (e.g. pasted content)
		const firstFontName = (family as string)?.split(",")[0]?.trim().replace(/["']/g, "") || "Custom";
		return found?.label || firstFontName;
	}, [editorView, schema]);

	const currentFamily = getCurrentFontFamily();

	// Scroll selected item into view
	useEffect(() => {
		if (isOpen && dropdownRef.current) {
			const selectedEl = dropdownRef.current.querySelector(`[data-selectable-index="${selectedIndex}"]`);
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
				setSelectedIndex((prev) => Math.min(prev + 1, selectableCount - 1));
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
				if (e.key === "Escape") {
					e.preventDefault();
					e.stopPropagation(); // Prevent toolbar's Escape handler from stealing focus
				}
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
					className="fixed bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded shadow-lg z-[100] min-w-[180px] max-h-[280px] overflow-y-auto"
					style={{ top: dropdownPos.top, left: dropdownPos.left }}
				>
					{flatItems.map((item, idx) => {
						if (item.type === "header") {
							return (
								<div
									key={`header-${item.group}`}
									className={`px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 select-none ${
										idx > 0 ? "border-t border-gray-200 dark:border-gray-700 mt-0.5" : ""
									}`}
								>
									{item.label}
								</div>
							);
						}
						if (item.type === "font") {
							const isMono = item.font.group === "monospace";
							return (
								<button
									key={item.font.value}
									type="button"
									data-selectable-index={item.flatIndex}
									className={`w-full flex items-center justify-between px-2 py-1 text-xs text-gray-700 dark:text-gray-300 ${
										selectedIndex === item.flatIndex ? "bg-blue-100 dark:bg-blue-900" : "hover:bg-gray-100 dark:hover:bg-gray-700"
									} ${currentFamily === item.font.label ? "font-semibold" : ""}`}
									style={{ fontFamily: item.font.value }}
									onClick={() => {
										applyMarkWithAttrs(schema.marks.fontFamily, { family: item.font.value });
										setIsOpen(false);
										editorView?.focus();
									}}
									onMouseEnter={() => setSelectedIndex(item.flatIndex)}
								>
									<span>{item.font.label}</span>
									{isMono && (
										<span className="ml-1.5 text-[9px] px-1 py-0 rounded bg-gray-200 dark:bg-gray-600 text-gray-500 dark:text-gray-400 font-normal font-sans leading-tight">
											mono
										</span>
									)}
								</button>
							);
						}
						// reset item
						return (
							<button
								key="reset"
								type="button"
								data-selectable-index={item.flatIndex}
								className={`w-full text-[10px] text-gray-600 dark:text-gray-400 py-1.5 border-t border-gray-200 dark:border-gray-700 ${
									selectedIndex === item.flatIndex ? "bg-blue-100 dark:bg-blue-900" : "hover:bg-gray-100 dark:hover:bg-gray-700"
								}`}
								onClick={() => {
									removeMark(schema.marks.fontFamily);
									setIsOpen(false);
									editorView?.focus();
								}}
								onMouseEnter={() => setSelectedIndex(item.flatIndex)}
							>
								Reset to default
							</button>
						);
					})}
				</div>
			)}
		</div>
	);
}
