import { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import * as Icons from "lucide-react";
import { useAtomValue } from "jotai";
import { hotkeysAtom } from "@/atoms/hotkeys";
import { formatHotkeyKey } from "@/utils/format-hotkey-key";
import { useLayoutToggles } from "@/hooks/use-layout-toggles";
import type { HotkeyMapping } from "@/types";
import { TOOLBAR_BUTTON_CLASS, TOOLBAR_BUTTON_ACTIVE_CLASS } from "./toolbar-button";

interface MenuAction {
	id: keyof HotkeyMapping;
	label: string;
	icon: Icons.LucideIcon;
	run: () => void;
}

interface LayoutMenuProps {
	/** Extra commands listed below the layout toggles */
	actions: MenuAction[];
}

/**
 * "More" popover at the end of the toolbar: show/hide toggles for every part
 * of the window (with their Ctrl+number keys), then a few app commands.
 * Toggles keep the menu open so several can be changed in one go.
 */
export function LayoutMenu({ actions }: LayoutMenuProps) {
	const [open, setOpen] = useState(false);
	const containerRef = useRef<HTMLDivElement>(null);
	const toggles = useLayoutToggles();
	const hotkeys = useAtomValue(hotkeysAtom);
	const keyLabel = (id: keyof HotkeyMapping) => {
		const key = hotkeys[id]?.key;
		return key ? formatHotkeyKey(key) : "";
	};

	useEffect(() => {
		if (!open) return;
		const onMouseDown = (e: MouseEvent) => {
			if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
		};
		const onKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Escape") {
				e.stopPropagation();
				setOpen(false);
			}
		};
		window.addEventListener("mousedown", onMouseDown);
		window.addEventListener("keydown", onKeyDown, true);
		return () => {
			window.removeEventListener("mousedown", onMouseDown);
			window.removeEventListener("keydown", onKeyDown, true);
		};
	}, [open]);

	const rowClass =
		"w-full flex items-center gap-2 px-3 h-7 text-xs text-left text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer";

	return (
		<div ref={containerRef} className="relative">
			<button
				type="button"
				onClick={() => setOpen((v) => !v)}
				title="More — show or hide parts of the window"
				aria-label="More"
				aria-expanded={open}
				tabIndex={-1}
				className={clsx(TOOLBAR_BUTTON_CLASS, open && TOOLBAR_BUTTON_ACTIVE_CLASS)}
			>
				<Icons.Ellipsis size={16} />
			</button>

			{open && (
				<div
					role="menu"
					className="absolute right-0 top-full mt-1 w-72 z-50 py-1 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg"
				>
					{toggles.map((t) => (
						<button
							key={t.id}
							type="button"
							role="menuitemcheckbox"
							aria-checked={t.visible}
							onClick={t.toggle}
							className={rowClass}
						>
							<t.icon size={14} className="flex-shrink-0 text-gray-500 dark:text-gray-400" />
							<span className="flex-1 truncate">{t.label}</span>
							<span className="text-[11px] text-gray-400 dark:text-gray-500 tabular-nums">{keyLabel(t.id)}</span>
							<Icons.Check size={14} className={clsx("flex-shrink-0", t.visible ? "text-blue-600 dark:text-blue-400" : "invisible")} />
						</button>
					))}
					<div className="my-1 border-t border-gray-200 dark:border-gray-700" />
					{actions.map((a) => (
						<button
							key={a.id}
							type="button"
							role="menuitem"
							onClick={() => {
								setOpen(false);
								a.run();
							}}
							className={rowClass}
						>
							<a.icon size={14} className="flex-shrink-0 text-gray-500 dark:text-gray-400" />
							<span className="flex-1 truncate">{a.label}</span>
							<span className="text-[11px] text-gray-400 dark:text-gray-500 tabular-nums">{keyLabel(a.id)}</span>
							<span className="w-3.5 flex-shrink-0" />
						</button>
					))}
				</div>
			)}
		</div>
	);
}
