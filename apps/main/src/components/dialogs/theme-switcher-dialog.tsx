import { createPortal } from "react-dom";
import { useEffect, useRef, useState, type FC } from "react";
import { Check, Palette } from "lucide-react";
import { useAtom } from "jotai";
import { themeSwitcherOpenAtom } from "@/atoms";
import { useTheme } from "@/hooks";
import { THEMES } from "@/config/themes";
import type { ThemeName } from "@/config/themes";

export const ThemeSwitcherDialog: FC = () => {
	const [isOpen, setIsOpen] = useAtom(themeSwitcherOpenAtom);
	const { themeName, setTheme } = useTheme();
	const dialogRef = useRef<HTMLDivElement>(null);
	const listRef = useRef<HTMLDivElement>(null);

	// Start selection on current theme
	const [selectedIndex, setSelectedIndex] = useState(() =>
		Math.max(0, THEMES.findIndex((t) => t.id === themeName))
	);

	// Reset selection when dialog opens
	useEffect(() => {
		if (isOpen) {
			setSelectedIndex(Math.max(0, THEMES.findIndex((t) => t.id === themeName)));
		}
	}, [isOpen, themeName]);

	// Scroll selected into view
	useEffect(() => {
		if (listRef.current) {
			const el = listRef.current.querySelector(`[data-idx="${selectedIndex}"]`);
			el?.scrollIntoView({ block: "nearest" });
		}
	}, [selectedIndex]);

	const handleClose = () => setIsOpen(false);

	const handleSelect = (id: ThemeName) => {
		setTheme(id);
		handleClose();
	};

	// Keyboard navigation
	useEffect(() => {
		if (!isOpen) return;

		const handleKeyDown = (e: KeyboardEvent) => {
			switch (e.key) {
				case "Escape":
					e.preventDefault();
					handleClose();
					break;
				case "ArrowDown":
					e.preventDefault();
					setSelectedIndex((prev) => Math.min(prev + 1, THEMES.length - 1));
					break;
				case "ArrowUp":
					e.preventDefault();
					setSelectedIndex((prev) => Math.max(prev - 1, 0));
					break;
				case "Enter": {
					e.preventDefault();
					const theme = THEMES[selectedIndex];
					if (theme) handleSelect(theme.id);
					break;
				}
			}
		};

		document.addEventListener("keydown", handleKeyDown);
		return () => document.removeEventListener("keydown", handleKeyDown);
	}, [isOpen, selectedIndex]);

	// Click outside to close
	useEffect(() => {
		if (!isOpen) return;

		const handleClickOutside = (e: MouseEvent) => {
			if (dialogRef.current && !dialogRef.current.contains(e.target as Node)) {
				handleClose();
			}
		};

		const id = setTimeout(
			() => document.addEventListener("mousedown", handleClickOutside),
			0,
		);
		return () => {
			clearTimeout(id);
			document.removeEventListener("mousedown", handleClickOutside);
		};
	}, [isOpen]);

	if (!isOpen) return null;

	const renderThemeItem = (theme: typeof THEMES[number], index: number) => {
		const isSelected = index === selectedIndex;
		const isActive = theme.id === themeName;
		return (
			<button
				key={theme.id}
				data-idx={index}
				onClick={() => handleSelect(theme.id)}
				onMouseEnter={() => setSelectedIndex(index)}
				className={`w-full text-left px-3 py-1.5 flex items-center gap-3 transition-colors ${
					isSelected
						? "bg-blue-600 dark:bg-blue-600"
						: "hover:bg-gray-100 dark:hover:bg-gray-700/60"
				}`}
			>
				{/* Colour swatch */}
				<span
					className="w-3 h-3 flex-shrink-0"
					style={{ background: theme.swatch.accent }}
				/>

				{/* Theme name with dark/light indicator */}
				<span
					className={`flex-1 text-sm ${
						isSelected
							? "text-white"
							: "text-gray-900 dark:text-gray-100"
					}`}
				>
					{theme.label}
					<span className={`ml-1.5 text-xs ${isSelected ? "text-white/70" : "text-gray-400"}`}>
						{theme.isDark ? "dark" : "light"}
					</span>
				</span>

				{/* Active indicator */}
				{isActive && (
					<Check
						className={`w-4 h-4 flex-shrink-0 ${isSelected ? "text-white" : "text-blue-500"}`}
					/>
				)}
			</button>
		);
	};

	const content = (
		<div className="fixed inset-0 z-50 flex items-start justify-center pt-[8vh] bg-black/40">
			<div
				ref={dialogRef}
				className="w-full max-w-[400px] bg-white dark:bg-gray-800 rounded-md shadow-2xl border border-gray-300 dark:border-gray-600 overflow-hidden"
			>
				{/* Header */}
				<div className="flex items-center gap-2.5 px-3 py-2.5 border-b border-gray-200 dark:border-gray-700">
					<Palette className="w-4 h-4 text-gray-400 flex-shrink-0" />
					<span className="text-sm text-gray-500 dark:text-gray-400">
						Select Color Theme
					</span>
					<kbd className="ml-auto text-[10px] text-gray-400 dark:text-gray-500 border border-gray-300 dark:border-gray-600 rounded px-1">
						Ctrl+K
					</kbd>
				</div>

				{/* Theme list */}
				<div ref={listRef} className="max-h-96 overflow-y-auto py-1">
					{THEMES.map((theme, index) => renderThemeItem(theme, index))}
				</div>
			</div>
		</div>
	);

	return createPortal(content, document.body);
};
