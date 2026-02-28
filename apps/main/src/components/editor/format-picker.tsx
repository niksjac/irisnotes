/**
 * Floating format picker triggered by keyboard shortcuts.
 *
 * Opens near the cursor position in the editor and provides
 * keyboard-navigable selection of:
 * - Text colors (Ctrl+Shift+1)
 * - Highlight colors (Ctrl+Shift+2)
 * - Font sizes (Ctrl+Shift+3)
 * - Font families (Ctrl+Shift+4)
 */

import { useState, useEffect, useRef, useCallback } from "react";
import type { EditorView } from "prosemirror-view";
import type { MarkType } from "prosemirror-model";
import { useAtomValue } from "jotai";
import { editorSettingsAtom } from "@/atoms/settings";
import {
	PRESET_COLORS,
	HIGHLIGHT_COLORS,
	FONT_SIZE_SCALES,
	FONT_FAMILIES,
} from "./format-constants";

export type FormatPickerType = "textColor" | "highlight" | "fontSize" | "fontFamily";

interface FormatPickerProps {
	type: FormatPickerType;
	editorView: EditorView;
	schema: any;
	onClose: () => void;
}

// ============ Shared Helpers ============

function applyMark(view: EditorView, markType: MarkType, attrs: Record<string, any>) {
	const { state, dispatch } = view;
	const { from, to, empty } = state.selection;
	const mark = markType.create(attrs);
	if (empty) {
		dispatch(state.tr.addStoredMark(mark));
	} else {
		dispatch(state.tr.addMark(from, to, mark));
	}
}

function removeMark(view: EditorView, markType: MarkType) {
	const { state, dispatch } = view;
	const { from, to, empty } = state.selection;
	if (empty) {
		dispatch(state.tr.removeStoredMark(markType));
	} else {
		dispatch(state.tr.removeMark(from, to, markType));
	}
}

/**
 * Calculate fixed position for the picker, anchored near the editor cursor.
 */
function calcPickerPosition(view: EditorView, pickerWidth: number, pickerHeight: number) {
	const coords = view.coordsAtPos(view.state.selection.from);
	const vw = window.innerWidth;
	const vh = window.innerHeight;

	let top = coords.bottom + 8;
	let left = coords.left;

	// Flip above cursor if it would overflow viewport bottom
	if (top + pickerHeight > vh - 16) {
		top = coords.top - pickerHeight - 8;
	}
	// Clamp horizontally
	if (left + pickerWidth > vw - 16) {
		left = vw - pickerWidth - 16;
	}
	if (left < 16) left = 16;

	return { top, left };
}

// ============ Main Component ============

export function FormatPicker({ type, editorView, schema, onClose }: FormatPickerProps) {
	const containerRef = useRef<HTMLDivElement>(null);
	const [position, setPosition] = useState<{ top: number; left: number } | null>(null);

	// Calculate position on mount
	useEffect(() => {
		const estimatedWidth = type === "fontFamily" ? 220 : type === "fontSize" ? 120 : 180;
		const estimatedHeight = type === "fontFamily" ? 280 : type === "fontSize" ? 280 : 200;
		setPosition(calcPickerPosition(editorView, estimatedWidth, estimatedHeight));
	}, [editorView, type]);

	// Close on outside click
	useEffect(() => {
		const handleMouseDown = (e: MouseEvent) => {
			if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
				onClose();
			}
		};
		document.addEventListener("mousedown", handleMouseDown);
		return () => document.removeEventListener("mousedown", handleMouseDown);
	}, [onClose]);

	if (!position) return null;

	const pickerContent = (() => {
		switch (type) {
			case "textColor":
				return (
					<ColorPickerPanel
						colors={PRESET_COLORS}
						markType={schema.marks.textColor}
						attrKey="color"
						removeLabel="Remove text color"
						editorView={editorView}
						onClose={onClose}
					/>
				);
			case "highlight":
				return (
					<ColorPickerPanel
						colors={HIGHLIGHT_COLORS}
						markType={schema.marks.highlight}
						attrKey="color"
						removeLabel="Remove highlight"
						editorView={editorView}
						onClose={onClose}
					/>
				);
			case "fontSize":
				return (
					<FontSizePickerPanel
						schema={schema}
						editorView={editorView}
						onClose={onClose}
					/>
				);
			case "fontFamily":
				return (
					<FontFamilyPickerPanel
						schema={schema}
						editorView={editorView}
						onClose={onClose}
					/>
				);
		}
	})();

	const title = {
		textColor: "Text Color",
		highlight: "Highlight Color",
		fontSize: "Font Size",
		fontFamily: "Font Family",
	}[type];

	return (
		<div
			ref={containerRef}
			className="fixed z-[200] bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg shadow-xl"
			style={{ top: position.top, left: position.left }}
		>
			<div className="px-3 pt-2 pb-1 text-[10px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide select-none">
				{title}
			</div>
			{pickerContent}
		</div>
	);
}

// ============ Color Picker Panel ============

interface ColorPickerPanelProps {
	colors: string[];
	markType: MarkType;
	attrKey: string;
	removeLabel: string;
	editorView: EditorView;
	onClose: () => void;
}

function ColorPickerPanel({ colors, markType, attrKey, removeLabel, editorView, onClose }: ColorPickerPanelProps) {
	const [selectedIndex, setSelectedIndex] = useState(0);
	const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);
	const columns = 4;
	const totalItems = colors.length + 1; // +1 for remove button

	// Auto-focus first color
	useEffect(() => {
		buttonRefs.current[0]?.focus();
	}, []);

	const selectAndClose = useCallback((index: number) => {
		if (index === colors.length) {
			// Remove button
			removeMark(editorView, markType);
		} else {
			const color = colors[index];
			if (color) {
				applyMark(editorView, markType, { [attrKey]: color });
			}
		}
		onClose();
		editorView.focus();
	}, [colors, markType, attrKey, editorView, onClose]);

	const handleKeyDown = (e: React.KeyboardEvent) => {
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
					newIndex = Math.min(selectedIndex + columns, colors.length);
				}
				break;
			case "ArrowUp":
				e.preventDefault();
				if (selectedIndex === colors.length) {
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
			case "Enter":
			case " ":
				e.preventDefault();
				selectAndClose(selectedIndex);
				return;
			case "Escape":
				e.preventDefault();
				onClose();
				editorView.focus();
				return;
			default:
				return;
		}

		setSelectedIndex(newIndex);
		buttonRefs.current[newIndex]?.focus();
	};

	return (
		<div className="p-2" onKeyDown={handleKeyDown}>
			<div className="grid grid-cols-4 gap-1.5 mb-2" role="grid">
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
						onClick={() => selectAndClose(index)}
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
				className={`w-full text-xs py-1.5 rounded transition-colors ${
					selectedIndex === colors.length
						? "text-gray-900 dark:text-gray-100 bg-gray-100 dark:bg-gray-700"
						: "text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-750"
				}`}
				onClick={() => selectAndClose(colors.length)}
				onFocus={() => setSelectedIndex(colors.length)}
			>
				{removeLabel}
			</button>
		</div>
	);
}

// ============ Font Size Picker Panel ============

interface FontSizePickerPanelProps {
	schema: any;
	editorView: EditorView;
	onClose: () => void;
}

function FontSizePickerPanel({ schema, editorView, onClose }: FontSizePickerPanelProps) {
	const [selectedIndex, setSelectedIndex] = useState(0);
	const listRef = useRef<HTMLDivElement>(null);
	const settings = useAtomValue(editorSettingsAtom);
	const baseFontSize = settings?.fontSize ?? 14;
	const totalItems = FONT_SIZE_SCALES.length + 1; // +1 for reset

	// Get current scale from selection
	const getCurrentScale = useCallback((): number | null => {
		if (!editorView) return null;
		const { from, $from, to, empty } = editorView.state.selection;
		const marks = empty
			? editorView.state.storedMarks || $from.marks()
			: (() => {
					let found: any = null;
					editorView.state.doc.nodesBetween(from, to, (node) => {
						if (found) return false;
						if (node.isText) {
							found = node.marks.find((m: any) => m.type === schema.marks.fontSize);
							return false;
						}
						return true;
					});
					return found ? [found] : [];
			  })();
		const fontSizeMark = Array.isArray(marks)
			? marks.find((m: any) => m.type === schema.marks.fontSize)
			: null;
		const size = fontSizeMark?.attrs?.size;
		if (!size) return null;
		if (size.endsWith("em")) return Number.parseFloat(size);
		if (size.endsWith("px")) return Number.parseFloat(size) / baseFontSize;
		return null;
	}, [editorView, schema, baseFontSize]);

	// Initialize selection to current scale
	useEffect(() => {
		const current = getCurrentScale();
		if (current !== null) {
			const idx = FONT_SIZE_SCALES.findIndex((s) => Math.abs(s - current) < 0.01);
			if (idx >= 0) setSelectedIndex(idx);
		}
		// Focus into list
		listRef.current?.focus();
	}, [getCurrentScale]);

	// Scroll selected into view
	useEffect(() => {
		if (listRef.current) {
			const el = listRef.current.querySelector(`[data-index="${selectedIndex}"]`);
			el?.scrollIntoView({ block: "nearest" });
		}
	}, [selectedIndex]);

	const applySize = useCallback((index: number) => {
		if (index === FONT_SIZE_SCALES.length) {
			removeMark(editorView, schema.marks.fontSize);
		} else {
			const scale = FONT_SIZE_SCALES[index];
			if (scale !== undefined) {
				applyMark(editorView, schema.marks.fontSize, { size: `${scale}em` });
			}
		}
		onClose();
		editorView.focus();
	}, [schema, editorView, onClose]);

	const handleKeyDown = (e: React.KeyboardEvent) => {
		switch (e.key) {
			case "ArrowDown":
				e.preventDefault();
				setSelectedIndex((prev) => Math.min(prev + 1, totalItems - 1));
				break;
			case "ArrowUp":
				e.preventDefault();
				setSelectedIndex((prev) => Math.max(prev - 1, 0));
				break;
			case "Home":
				e.preventDefault();
				setSelectedIndex(0);
				break;
			case "End":
				e.preventDefault();
				setSelectedIndex(totalItems - 1);
				break;
			case "Enter":
			case " ":
				e.preventDefault();
				applySize(selectedIndex);
				return;
			case "Escape":
				e.preventDefault();
				onClose();
				editorView.focus();
				return;
		}
	};

	const currentScale = getCurrentScale();

	return (
		<div
			ref={listRef}
			className="max-h-[240px] overflow-y-auto min-w-[100px] outline-none"
			tabIndex={0}
			onKeyDown={handleKeyDown}
			role="listbox"
		>
			{FONT_SIZE_SCALES.map((scale, index) => {
				const px = Math.round(scale * baseFontSize);
				const isCurrent = currentScale !== null && Math.abs(currentScale - scale) < 0.01;
				return (
					<button
						key={scale}
						type="button"
						data-index={index}
						role="option"
						aria-selected={index === selectedIndex}
						className={`w-full flex items-center justify-between px-3 py-1 text-xs transition-colors ${
							index === selectedIndex
								? "bg-blue-100 dark:bg-blue-900/50 text-blue-900 dark:text-blue-100"
								: "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
						} ${isCurrent ? "font-semibold" : ""}`}
						onClick={() => applySize(index)}
						onMouseEnter={() => setSelectedIndex(index)}
					>
						<span>{px}px</span>
						<span className="text-[10px] text-gray-400 ml-2">{scale}&times;</span>
					</button>
				);
			})}
			<button
				type="button"
				data-index={FONT_SIZE_SCALES.length}
				role="option"
				aria-selected={selectedIndex === FONT_SIZE_SCALES.length}
				className={`w-full text-[10px] py-1.5 border-t border-gray-200 dark:border-gray-700 transition-colors ${
					selectedIndex === FONT_SIZE_SCALES.length
						? "bg-blue-100 dark:bg-blue-900/50 text-blue-900 dark:text-blue-100"
						: "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
				}`}
				onClick={() => applySize(FONT_SIZE_SCALES.length)}
				onMouseEnter={() => setSelectedIndex(FONT_SIZE_SCALES.length)}
			>
				Reset ({baseFontSize}px)
			</button>
		</div>
	);
}

// ============ Font Family Picker Panel ============

interface FontFamilyPickerPanelProps {
	schema: any;
	editorView: EditorView;
	onClose: () => void;
}

function FontFamilyPickerPanel({ schema, editorView, onClose }: FontFamilyPickerPanelProps) {
	const [selectedIndex, setSelectedIndex] = useState(0);
	const [filter, setFilter] = useState("");
	const listRef = useRef<HTMLDivElement>(null);
	const inputRef = useRef<HTMLInputElement>(null);

	const filteredFonts = filter
		? FONT_FAMILIES.filter((f) => f.label.toLowerCase().includes(filter.toLowerCase()))
		: FONT_FAMILIES;

	const totalItems = filteredFonts.length + 1; // +1 for reset

	// Auto-focus input
	useEffect(() => {
		inputRef.current?.focus();
	}, []);

	// Reset selection when filter changes
	useEffect(() => {
		setSelectedIndex(0);
	}, [filter]);

	// Scroll selected into view
	useEffect(() => {
		if (listRef.current) {
			const el = listRef.current.querySelector(`[data-index="${selectedIndex}"]`);
			el?.scrollIntoView({ block: "nearest" });
		}
	}, [selectedIndex]);

	// Get current font family
	const getCurrentFamily = useCallback((): string | null => {
		if (!editorView) return null;
		const { from, $from, to, empty } = editorView.state.selection;
		let fontFamilyMark: any = null;
		if (empty) {
			const marks = editorView.state.storedMarks || $from.marks();
			fontFamilyMark = marks.find((m: any) => m.type === schema.marks.fontFamily);
		} else {
			editorView.state.doc.nodesBetween(from, to, (node) => {
				if (fontFamilyMark) return false;
				if (node.isText) {
					fontFamilyMark = node.marks.find((m: any) => m.type === schema.marks.fontFamily);
					return false;
				}
				return true;
			});
		}
		return fontFamilyMark?.attrs?.family || null;
	}, [editorView, schema]);

	const applyFont = useCallback((index: number) => {
		if (index === filteredFonts.length) {
			removeMark(editorView, schema.marks.fontFamily);
		} else {
			const font = filteredFonts[index];
			if (font) {
				applyMark(editorView, schema.marks.fontFamily, { family: font.value });
			}
		}
		onClose();
		editorView.focus();
	}, [filteredFonts, schema, editorView, onClose]);

	const handleKeyDown = (e: React.KeyboardEvent) => {
		switch (e.key) {
			case "ArrowDown":
				e.preventDefault();
				setSelectedIndex((prev) => Math.min(prev + 1, totalItems - 1));
				break;
			case "ArrowUp":
				e.preventDefault();
				setSelectedIndex((prev) => Math.max(prev - 1, 0));
				break;
			case "Home":
				e.preventDefault();
				setSelectedIndex(0);
				break;
			case "End":
				e.preventDefault();
				setSelectedIndex(totalItems - 1);
				break;
			case "Enter":
				e.preventDefault();
				applyFont(selectedIndex);
				return;
			case "Escape":
				e.preventDefault();
				onClose();
				editorView.focus();
				return;
		}
	};

	const currentFamily = getCurrentFamily();

	return (
		<div className="min-w-[200px]" onKeyDown={handleKeyDown}>
			{/* Filter input */}
			<div className="px-2 pt-1 pb-1">
				<input
					ref={inputRef}
					type="text"
					value={filter}
					onChange={(e) => setFilter(e.target.value)}
					placeholder="Type to filter..."
					className="w-full px-2 py-1 text-xs rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
				/>
			</div>

			{/* Font list */}
			<div
				ref={listRef}
				className="max-h-[220px] overflow-y-auto"
				role="listbox"
			>
				{filteredFonts.map((font, index) => {
					const isCurrent = currentFamily === font.value;
					return (
						<button
							key={font.value}
							type="button"
							data-index={index}
							role="option"
							aria-selected={index === selectedIndex}
							className={`w-full flex items-center px-3 py-1 text-xs transition-colors ${
								index === selectedIndex
									? "bg-blue-100 dark:bg-blue-900/50 text-blue-900 dark:text-blue-100"
									: "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
							} ${isCurrent ? "font-semibold" : ""}`}
							style={{ fontFamily: font.value }}
							onClick={() => applyFont(index)}
							onMouseEnter={() => setSelectedIndex(index)}
						>
							{font.label}
						</button>
					);
				})}
				{filteredFonts.length === 0 && (
					<div className="px-3 py-2 text-xs text-gray-400 dark:text-gray-500 italic">
						No fonts match "{filter}"
					</div>
				)}
				<button
					type="button"
					data-index={filteredFonts.length}
					role="option"
					aria-selected={selectedIndex === filteredFonts.length}
					className={`w-full text-[10px] py-1.5 border-t border-gray-200 dark:border-gray-700 transition-colors ${
						selectedIndex === filteredFonts.length
							? "bg-blue-100 dark:bg-blue-900/50 text-blue-900 dark:text-blue-100"
							: "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
					}`}
					onClick={() => applyFont(filteredFonts.length)}
					onMouseEnter={() => setSelectedIndex(filteredFonts.length)}
				>
					Reset to default
				</button>
			</div>
		</div>
	);
}
