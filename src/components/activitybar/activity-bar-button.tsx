import clsx from 'clsx';
import type { LucideIcon } from 'lucide-react';

interface ActivityBarButtonProps {
	icon: LucideIcon;
	isActive: boolean;
	onClick: () => void;
	title: string;
	iconSize?: number;
}

export function ActivityBarButton({ icon: Icon, isActive, onClick, title, iconSize = 18 }: ActivityBarButtonProps) {
	// Component-level color constants
	const COLORS = {
		text: 'text-gray-600 dark:text-gray-400',
		textHover: 'hover:text-gray-900 dark:hover:text-gray-100',
		textActive: 'text-blue-500',
	};

	const buttonClasses = clsx(
		'flex items-center justify-center border-none rounded-none bg-transparent cursor-pointer transition-all duration-200 text-lg font-semibold p-0',
		// Mobile: smaller buttons in horizontal layout
		'w-8 h-8 md:w-6 md:h-6',
		COLORS.text,
		COLORS.textHover,
		'hover:scale-110',
		{
			[`${COLORS.textActive} scale-110`]: isActive,
		}
	);

	return (
		<button
			className={buttonClasses}
			onClick={onClick}
			title={title}
		>
			<Icon
				size={iconSize}
				className='md:w-5 md:h-5'
			/>
		</button>
	);
}
