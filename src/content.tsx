import React from 'react';
import { ConfigView } from './features/editor/components/config-view';
import { HotkeysView } from './features/editor/components/hotkeys-view';
import {
	FolderContent,
	DualPaneContent,
	SinglePaneContent,
} from './features/editor';
import { useContentState } from './hooks';

export const Content: React.FC = () => {
	const {
		configViewActive,
		hotkeysViewActive,
		selectedFolder,
		isDualPaneMode,
		folderProps,
		dualPaneProps,
		singlePaneProps,
	} = useContentState();

	if (configViewActive) return <ConfigView />;
	if (hotkeysViewActive) return <HotkeysView />;
	if (selectedFolder) return <FolderContent {...folderProps} />;
	if (isDualPaneMode) return <DualPaneContent {...dualPaneProps} />;
	return <SinglePaneContent {...singlePaneProps} />;
};
