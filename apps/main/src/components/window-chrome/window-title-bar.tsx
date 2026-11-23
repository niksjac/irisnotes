import { useMemo } from "react";
import clsx from "clsx";
import { useAtomValue, useSetAtom } from "jotai";
import * as Icons from "lucide-react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import {
	windowTitleBarVisibleAtom,
	paneStateAtom,
	pane0TabsAtom,
	pane1TabsAtom,
	pane0ActiveTabAtom,
	pane1ActiveTabAtom,
} from "@/atoms";
import { openBrandingTabAtom } from "@/atoms/panes";
import { brandingSettingsAtom, getBrandingLogo } from "@/atoms/settings";
import { useLayoutToggles, type LayoutToggle } from "@/hooks/use-layout-toggles";
import { useHotkeyLabel } from "@/hooks/use-hotkey-label";
import { withHotkey } from "./toolbar-button";

/**
 * Window title bar (the window has no system decorations): app logo on the
 * left (opens About), the focused pane's tab title in the center, then
 * show/hide buttons for each part of the window (same list and order as the
 * More menu) and close on the right. The bar, its side areas and the title are
 * drag areas; double-click toggles maximize.
 */
export function WindowTitleBar() {
	const visible = useAtomValue(windowTitleBarVisibleAtom);
	const branding = useAtomValue(brandingSettingsAtom);
	const openAbout = useSetAtom(openBrandingTabAtom);
	const toggles = useLayoutToggles();

	const paneState = useAtomValue(paneStateAtom);
	const pane0Tabs = useAtomValue(pane0TabsAtom);
	const pane1Tabs = useAtomValue(pane1TabsAtom);
	const pane0ActiveTab = useAtomValue(pane0ActiveTabAtom);
	const pane1ActiveTab = useAtomValue(pane1ActiveTabAtom);

	const title = useMemo(() => {
		const active0 = pane0Tabs.find((t) => t.id === pane0ActiveTab);
		const active1 = pane1Tabs.find((t) => t.id === pane1ActiveTab);
		const focused = paneState.count === 2 && paneState.activePane === 1 ? active1 : active0;
		return (focused ?? active0 ?? active1)?.title || "IrisNotes";
	}, [paneState, pane0Tabs, pane1Tabs, pane0ActiveTab, pane1ActiveTab]);

	if (!visible) return null;

	return (
		<div
			data-tauri-drag-region
			className="flex-shrink-0 h-8 px-1 flex items-center gap-1 bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 select-none"
		>
			<div data-tauri-drag-region className="flex-1 basis-0 min-w-0 flex items-center">
				<button
					type="button"
					onClick={() => openAbout()}
					title="About IrisNotes"
					aria-label="About IrisNotes"
					tabIndex={-1}
					className="relative flex items-center justify-center w-7 h-7 rounded hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer"
				>
					<img src={getBrandingLogo(branding).file} alt="" className="w-5 h-5 object-contain" />
					{import.meta.env.DEV && (
						<span className="absolute bottom-0 right-[-2px] bg-red-500 text-white font-bold leading-none rounded-sm text-[6px] px-[2px] py-[1px]">
							DEV
						</span>
					)}
				</button>
			</div>

			<div
				data-tauri-drag-region
				className="min-w-0 truncate text-center text-xs font-medium text-gray-700 dark:text-gray-300 cursor-default"
				title={title}
			>
				{title}
			</div>

			<div data-tauri-drag-region className="flex-1 basis-0 min-w-fit flex items-center justify-end gap-0.5">
				{toggles.map((t) => (
					<LayoutToggleButton key={t.id} toggle={t} />
				))}
				<div className="w-px h-4 mx-1 bg-gray-300 dark:bg-gray-600 flex-shrink-0" />
				<button
					type="button"
					onClick={() => void getCurrentWindow().close()}
					title="Close"
					aria-label="Close window"
					tabIndex={-1}
					className="flex items-center justify-center w-7 h-7 rounded text-gray-500 dark:text-gray-400 hover:bg-red-500 hover:text-white cursor-pointer flex-shrink-0"
				>
					<Icons.X size={15} />
				</button>
			</div>
		</div>
	);
}

/** Small show/hide button for one part of the window; pressed while it's shown */
function LayoutToggleButton({ toggle: t }: { toggle: LayoutToggle }) {
	const title = withHotkey(`${t.visible ? "Hide" : "Show"} ${t.label.toLowerCase()}`, useHotkeyLabel(t.id));
	return (
		<button
			type="button"
			onClick={t.toggle}
			title={title}
			aria-label={title}
			aria-pressed={t.visible}
			tabIndex={-1}
			className={clsx(
				"flex items-center justify-center w-6 h-6 rounded flex-shrink-0 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700",
				t.visible
					? "text-gray-800 dark:text-gray-100"
					: "text-gray-400/70 dark:text-gray-500/70",
			)}
		>
			<t.icon size={14} />
		</button>
	);
}
