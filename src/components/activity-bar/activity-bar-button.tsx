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
	shortcutKey?: string;
}

export function ActivityBarButton({
	icon: Icon,
	isActive,
	onClick,
	title,
	label,
	expanded = false,
	iconSize = 18,
	shortcutKey,
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
			{shortcutKey && !expanded && (
				<svg
					className="absolute bottom-0 right-0 translate-x-1/4 translate-y-1/4"
					width="12"
					height="12"
					viewBox="0 0 12 12"
				>
					<circle cx="6" cy="6" r="6" fill="#3b82f6" />
					<text
						x="6"
						y="6"
						textAnchor="middle"
						dominantBaseline="central"
						fill="white"
						fontSize="8"
						fontWeight="bold"
					>
						{shortcutKey}
					</text>
				</svg>
			)}
		</button>
	);
}
