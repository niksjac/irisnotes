import type { FC } from "react";
import type { Tab } from "@/types";

interface TabProps {
	tab: Tab;
	isActive: boolean;
	onSelect: (tabId: string) => void;
	onClose?: (tabId: string) => void;
}

export const TabComponent: FC<TabProps> = ({ tab, isActive, onSelect, onClose }) => {
	const handleClick = () => {
		onSelect(tab.id);
	};

	const handleClose = (e: React.MouseEvent) => {
		e.stopPropagation();
		if (onClose && tab.canClose !== false) {
			onClose(tab.id);
		}
	};

	return (
		<div
			className={`
				flex items-center px-3 py-2 border-r border-gray-200 cursor-pointer
				min-w-0 max-w-xs relative group
				${isActive
					? 'bg-white border-b-2 border-b-blue-500'
					: 'bg-gray-50 hover:bg-gray-100'
				}
			`}
			onClick={handleClick}
		>
			{/* Tab title */}
			<span
				className={`
					text-sm truncate flex-1
					${isActive ? 'text-gray-900' : 'text-gray-600'}
					${tab.isDirty ? 'italic' : ''}
				`}
				title={tab.title}
			>
				{tab.title}
				{tab.isDirty && ' •'}
			</span>

			{/* Close button */}
			{tab.canClose !== false && (
				<button
					className="ml-2 w-4 h-4 flex items-center justify-center rounded text-gray-400 hover:text-gray-600 hover:bg-gray-200 opacity-0 group-hover:opacity-100 transition-opacity"
					onClick={handleClose}
					title="Close tab"
				>
					<svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
						<path d="M6 4.586L10.293.293a1 1 0 011.414 1.414L7.414 6l4.293 4.293a1 1 0 01-1.414 1.414L6 7.414l-4.293 4.293a1 1 0 01-1.414-1.414L4.586 6 .293 1.707A1 1 0 011.707.293L6 4.586z"/>
					</svg>
				</button>
			)}
		</div>
	);
};
