import React from 'react';
import type { PaneId } from '@/hooks';
import type { Note } from '../../../types/database';
import { DualPaneEditor } from '../index';

interface DualPaneContentProps {
	leftNote: Note | null;
	rightNote: Note | null;
	activePaneId: PaneId;
	onNoteContentChange: (noteId: string, content: string) => void;
	onNoteTitleChange: (noteId: string, title: string) => void;
	onPaneClick: (paneId: PaneId) => void;
	toolbarVisible: boolean;
}

export const DualPaneContent = React.memo(
	({
		leftNote,
		rightNote,
		activePaneId,
		onNoteContentChange,
		onNoteTitleChange,
		onPaneClick,
		toolbarVisible,
	}: DualPaneContentProps) => (
		<DualPaneEditor
			leftNote={leftNote}
			rightNote={rightNote}
			activePaneId={activePaneId}
			onNoteContentChange={onNoteContentChange}
			onNoteTitleChange={onNoteTitleChange}
			onPaneClick={onPaneClick}
			toolbarVisible={toolbarVisible}
		/>
	)
);

DualPaneContent.displayName = 'DualPaneContent';
