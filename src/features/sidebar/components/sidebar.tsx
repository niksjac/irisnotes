import type React from 'react';
import { useNotesInitialization, useNotesStorage } from '../../notes/hooks';
import { TreeView } from '../../treeview/tree-view';

export const Sidebar: React.FC = () => {
	const { isInitialized } = useNotesStorage();

	// Initialize notes
	useNotesInitialization();

	if (!isInitialized) {
		return (
			<div className='flex items-center justify-center h-full'>
				<div className='text-center'>
					<div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2'></div>
					<p className='text-sm text-gray-500'>Loading notes...</p>
				</div>
			</div>
		);
	}

	return (
		<div className='flex flex-col h-full bg-white dark:bg-gray-900 __1'>
			<TreeView />
		</div>
	);
};
