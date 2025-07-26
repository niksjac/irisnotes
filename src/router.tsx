import React from 'react';
import { ConfigView } from './features/editor/components/config-view';
import { HotkeysView } from './features/editor/components/hotkeys-view';
import {
	FolderContent,
	DualPaneContent,
	SinglePaneContent,
} from './features/editor';
import { useAppRouting, type AppRoute, type PaneId } from './hooks';

interface RouterProps {
	selectedFolderId?: string | null;
	// Props for DualPaneContent
	dualPaneProps?: {
		leftNote: any;
		rightNote: any;
		activePaneId: PaneId;
		onNoteContentChange: (noteId: string, content: string) => void;
		onNoteTitleChange: (noteId: string, title: string) => void;
		onPaneClick: (paneId: PaneId) => void;
		toolbarVisible: boolean;
	};

	// Props for SinglePaneContent
	singlePaneProps?: {
		selectedNote: any;
		onTitleChange: (noteId: string, title: string) => void;
		onContentChange: (noteId: string, content: string) => void;
		onCreateNote: () => void;
		onCreateFolder: () => void;
		onFocusSearch: () => void;
		toolbarVisible: boolean;
		focusClasses: any;
		onRegisterElement: () => void;
		onSetFocusFromClick: () => void;
	};

	// Props for FolderContent
	folderProps?:
		| {
				selectedFolder: any;
				notes: any[];
				categories: any[];
				noteCategories: any[];
				onNoteSelect: (note: any) => void;
				onFolderSelect: (folderId: string) => void;
				onCreateNote: () => void;
				onCreateFolder: () => void;
		  }
		| undefined;
}

const renderRoute = (route: AppRoute, props: RouterProps) => {
	switch (route.type) {
		case 'config':
			return <ConfigView />;

		case 'hotkeys':
			return <HotkeysView />;

		case 'folder':
			if (!props.folderProps) {
				console.warn('Folder route selected but no folderProps provided');
				return <div>Loading folder...</div>;
			}
			return <FolderContent {...props.folderProps} />;

		case 'dual-pane':
			if (!props.dualPaneProps) {
				console.warn('Dual pane route selected but no dualPaneProps provided');
				return <div>Loading dual pane...</div>;
			}
			return <DualPaneContent {...props.dualPaneProps} />;

		case 'single-pane':
			if (!props.singlePaneProps) {
				console.warn(
					'Single pane route selected but no singlePaneProps provided'
				);
				return <div>Loading single pane...</div>;
			}
			return <SinglePaneContent {...props.singlePaneProps} />;

		default:
			return <div>Unknown route</div>;
	}
};

export const Router: React.FC<RouterProps> = props => {
	const { currentRoute } = useAppRouting({
		selectedFolderId: props.selectedFolderId,
	});
	return renderRoute(currentRoute, props);
};
