import React from 'react';
import { ConfigView } from './features/editor/components/config-view';
import { HotkeysView } from './features/editor/components/hotkeys-view';
import { Folder, DualPaneContent, SinglePaneContent } from './features/editor';
import { useContentState } from './hooks';
import type { ViewType } from '@/atoms';

export const Content: React.FC = () => {
	const { currentView, folderProps, dualPaneProps, singlePaneProps } = useContentState();

	const viewMapping: Record<ViewType, React.ReactElement> = {
		'config-view': <ConfigView />,
		'hotkeys-view': <HotkeysView />,
		'folder-view': <Folder {...folderProps} />,
		'dual-pane-view': <DualPaneContent {...dualPaneProps} />,
		'single-pane-view': <SinglePaneContent {...singlePaneProps} />,
	};

	return viewMapping[currentView];
};
