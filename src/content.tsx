import React from 'react';
import { ConfigView, HotkeysView, FolderView, EditorRichView, EditorSourceView, WelcomeView } from './views';
import { useContentState } from './hooks';
import { useAtomValue } from 'jotai';
import { currentViewAtom, leftPaneCurrentViewAtom, rightPaneCurrentViewAtom } from '@/atoms';
import type { ViewType, PaneId } from '@/atoms';

interface ContentProps {
	paneId?: PaneId;
}

export const Content: React.FC<ContentProps> = ({ paneId }) => {
	// Select the appropriate view atom based on pane
	const viewAtom =
		paneId === 'left' ? leftPaneCurrentViewAtom : paneId === 'right' ? rightPaneCurrentViewAtom : currentViewAtom;

	const currentView = useAtomValue(viewAtom);
	const { folderProps, editorProps, welcomeProps } = useContentState(paneId);

	const viewMapping: Record<ViewType, React.ReactElement> = {
		'config-view': <ConfigView />,
		'hotkeys-view': <HotkeysView />,
		'folder-view': <FolderView {...folderProps} />,
		'editor-rich-view': <EditorRichView {...editorProps} />,
		'editor-source-view': <EditorSourceView {...editorProps} />,
		'welcome-view': <WelcomeView {...welcomeProps} />,
	};

	return viewMapping[currentView];
};
