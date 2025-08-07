import { ChevronRight, FileText, Folder } from 'lucide-react';

interface TreeNodeProps {
	node: {
		isInternal: boolean;
		isOpen: boolean;
		isFocused: boolean;
		isSelected: boolean;
		isDragging: boolean;
		data: {
			name: string;
			type?: 'category' | 'note';
		};
		toggle: () => void;
	};
	style: React.CSSProperties;
	dragHandle?: (el: HTMLDivElement | null) => void;
}

export function TreeNode({ node, style, dragHandle }: TreeNodeProps) {
	const isFolder = node.isInternal;
	const isExpanded = node.isOpen;
	const nodeType = node.data.type;
	const isCategory = nodeType === 'category';

	// Create dynamic className based on node state
	const getNodeClassName = () => {
		const baseClasses = 'flex items-center gap-2 h-9 px-2 cursor-pointer transition-colors';

		if (node.isSelected) {
			return `${baseClasses} bg-blue-100 dark:bg-blue-900/50 text-blue-900 dark:text-blue-100`;
		}

		if (node.isFocused) {
			return `${baseClasses} bg-gray-200 dark:bg-gray-700 ring-2 ring-blue-500 ring-inset`;
		}

		if (node.isDragging) {
			return `${baseClasses} opacity-50 bg-gray-100 dark:bg-gray-800`;
		}

		return `${baseClasses} hover:bg-gray-100 dark:hover:bg-gray-800`;
	};

	return (
		<div
			ref={dragHandle}
			style={style}
			className={getNodeClassName()}
			onClick={() => node.toggle()}
		>
			{isFolder && (
				<ChevronRight
					className={`h-4 w-4 text-gray-500 dark:text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
				/>
			)}

			{!isFolder && <div className='w-4' />}

			{isCategory || isFolder ? (
				<Folder className='h-4 w-4 text-blue-500 dark:text-blue-400' />
			) : (
				<FileText className='h-4 w-4 text-gray-600 dark:text-gray-300' />
			)}

			<span className='flex-1 truncate text-sm text-gray-900 dark:text-gray-100'>{node.data.name}</span>
		</div>
	);
}
