import { useAtomValue } from 'jotai';
import type React from 'react';
import type { PaneId, ViewType } from '@/atoms';
import { currentViewAtom, leftPaneCurrentViewAtom, rightPaneCurrentViewAtom } from '@/atoms';
import { ConfigView, EditorRichView, EditorSourceView, FolderView, HotkeysView, WelcomeView } from './views';

interface ContentProps {
	paneId?: PaneId;
}

export const Content: React.FC<ContentProps> = ({ paneId }) => {
	// Select the appropriate view atom based on pane
	const getViewAtom = () => {
		switch (paneId) {
			case 'left':
				return leftPaneCurrentViewAtom;
			case 'right':
				return rightPaneCurrentViewAtom;
			default:
				return currentViewAtom;
		}
	};

	const currentView = useAtomValue(getViewAtom());

	const viewMapping: Record<ViewType, React.ReactElement> = {
		'config-view': <ConfigView />,
		'hotkeys-view': <HotkeysView />,
		'folder-view': <FolderView paneId={paneId} />,
		'editor-rich-view': <EditorRichView paneId={paneId} />,
		'editor-source-view': <EditorSourceView paneId={paneId} />,
		'welcome-view': <WelcomeView paneId={paneId} />,
	};

	return viewMapping[currentView];
};
