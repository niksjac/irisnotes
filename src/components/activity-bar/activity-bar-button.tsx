import clsx from "clsx";
import type { LucideIcon } from "lucide-react";

interface ActivityBarButtonProps {
	icon: LucideIcon;
	isActive: boolean;
	onClick: () => void;
	title: string;
	label?: string;
	expanded?: boolean;
	iconSize?: number;
	keyTip?: string;
	showKeyTip?: boolean;
}

export function ActivityBarButton({
	icon: Icon,
	isActive,
	onClick,
	title,
	label,
	expanded = false,
	iconSize = 18,
	keyTip,
	showKeyTip = false,
}: ActivityBarButtonProps) {
	// Component-level color constants
	const COLORS = {
		text: "text-gray-600 dark:text-gray-400",
		textHover: "hover:text-gray-900 dark:hover:text-gray-100",
		textActive: "text-blue-500",
	};

	// Mobile: always icon-only style
	// Desktop: use expanded prop to determine style
	const buttonClasses = clsx(
		"relative flex items-center border-none rounded-none bg-transparent cursor-pointer transition-all duration-200 font-medium p-0",
		// Mobile: always compact icon-only
		"justify-center w-8 h-8",
		// Desktop: depends on expanded state
		expanded
			? "md:justify-start md:gap-2 md:w-full md:px-2 md:h-7"
			: "md:w-6 md:h-6",
		COLORS.text,
		COLORS.textHover,
		// Scale effect only when not expanded (desktop) and always on mobile
		"hover:scale-110 md:hover:scale-100",
		!expanded && "md:hover:scale-110",
		expanded && "md:hover:bg-gray-200 md:dark:hover:bg-gray-700 md:rounded",
		{
			[`${COLORS.textActive} scale-110 md:scale-100`]: isActive,
			[`${COLORS.textActive} md:scale-110`]: isActive && !expanded,
			"md:bg-blue-100 md:dark:bg-blue-900/30": isActive && expanded,
		}
	);

	return (
		<button className={buttonClasses} onClick={onClick} title={title} tabIndex={-1}>
			<Icon size={iconSize} className="md:w-5 md:h-5 flex-shrink-0" />
			{/* Label only visible on desktop when expanded */}
			{expanded && label && (
				<span className="hidden md:inline text-xs truncate">{label}</span>
			)}
			{/* KeyTip badge - shown when Alt is held */}
			{showKeyTip && keyTip && (
				<span className="absolute -top-1 -right-1 md:-top-0.5 md:-right-0.5 min-w-[14px] h-[14px] flex items-center justify-center bg-amber-400 text-gray-900 text-[9px] font-bold rounded shadow-sm border border-amber-500 px-0.5 z-50">
					{keyTip}
				</span>
			)}
		</button>
	);
}
