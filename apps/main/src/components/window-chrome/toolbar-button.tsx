import clsx from "clsx";
import type { LucideIcon } from "lucide-react";

export const TOOLBAR_BUTTON_CLASS = clsx(
	"relative flex items-center justify-center w-7 h-7 rounded bg-transparent cursor-pointer outline-none flex-shrink-0",
	"text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100",
	"hover:bg-gray-200 dark:hover:bg-gray-700",
	"focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-inset",
);

export const TOOLBAR_BUTTON_ACTIVE_CLASS =
	"text-gray-950 dark:text-gray-50 bg-gray-300/80 dark:bg-gray-600/75 shadow-inner";

interface ToolbarButtonProps {
	icon: LucideIcon;
	title: string;
	onClick: () => void;
	isActive?: boolean;
}

/** Icon-only toolbar command; the title doubles as tooltip and accessible name */
export function ToolbarButton({ icon: Icon, title, onClick, isActive = false }: ToolbarButtonProps) {
	return (
		<button
			type="button"
			onClick={onClick}
			title={title}
			aria-label={title}
			aria-pressed={isActive}
			tabIndex={-1}
			className={clsx(TOOLBAR_BUTTON_CLASS, isActive && TOOLBAR_BUTTON_ACTIVE_CLASS)}
		>
			<Icon size={16} />
		</button>
	);
}

/** Vertical divider between toolbar groups */
export function ToolbarSeparator() {
	return <div className="w-px h-5 mx-1 bg-gray-300 dark:bg-gray-600 flex-shrink-0" />;
}

/** Appends " (Ctrl+X)" when the action has a hotkey */
export function withHotkey(title: string, label: string) {
	return label ? `${title} (${label})` : title;
}
