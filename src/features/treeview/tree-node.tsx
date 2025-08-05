import { ChevronRight, FileText, Folder } from 'lucide-react';

interface TreeNodeProps {
	node: {
		isInternal: boolean;
		isOpen: boolean;
		data: {
			name: string;
		};
		toggle: () => void;
	};
	style: React.CSSProperties;
	dragHandle?: (el: HTMLDivElement | null) => void;
}

export function TreeNode({ node, style, dragHandle }: TreeNodeProps) {
	const isFolder = node.isInternal;
	const isExpanded = node.isOpen;

	return (
		<div
			ref={dragHandle}
			style={style}
			className='flex items-center gap-2 py-1 px-2 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer transition-colors'
			onClick={() => node.toggle()}
		>
			{isFolder && (
				<ChevronRight
					className={`h-4 w-4 text-gray-500 dark:text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
				/>
			)}

			{!isFolder && <div className='w-4' />}

			{isFolder ? (
				<Folder className='h-4 w-4 text-blue-500 dark:text-blue-400' />
			) : (
				<FileText className='h-4 w-4 text-gray-500 dark:text-gray-400' />
			)}

			<span className='flex-1 truncate text-sm text-gray-900 dark:text-gray-100'>{node.data.name}</span>
		</div>
	);
}
