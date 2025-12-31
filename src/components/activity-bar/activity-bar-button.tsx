import clsx from "clsx";
import type { LucideIcon } from "lucide-react";

interface ActivityBarButtonProps {
	icon: LucideIcon;
	isActive: boolean;
	onClick: () => void;
	title: string;
	iconSize?: number;
	shortcutKey?: string;
}

export function ActivityBarButton({
	icon: Icon,
	isActive,
	onClick,
	title,
	iconSize = 18,
	shortcutKey,
}: ActivityBarButtonProps) {
	// Component-level color constants
	const COLORS = {
		text: "text-gray-600 dark:text-gray-400",
		textHover: "hover:text-gray-900 dark:hover:text-gray-100",
		textActive: "text-blue-500",
	};

	const buttonClasses = clsx(
		"relative flex items-center justify-center border-none rounded-none bg-transparent cursor-pointer transition-all duration-200 text-lg font-semibold p-0",
		// Mobile: smaller buttons in horizontal layout
		"w-8 h-8 md:w-6 md:h-6",
		COLORS.text,
		COLORS.textHover,
		"hover:scale-110",
		{
			[`${COLORS.textActive} scale-110`]: isActive,
		}
	);

	return (
		<button className={buttonClasses} onClick={onClick} title={title} tabIndex={-1}>
			<Icon size={iconSize} className="md:w-5 md:h-5" />
			{shortcutKey && (
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
