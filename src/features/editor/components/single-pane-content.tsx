import { EditorWrapper } from './editor-wrapper';
import { NotesTreeView } from '@/features/notes-tree-view';
import type { NotesTreeViewProps } from '@/features/notes-tree-view';

interface SinglePaneContentProps {
	treeProps: NotesTreeViewProps;
}

export function SinglePaneContent({ treeProps }: SinglePaneContentProps) {
	return (
		<EditorWrapper>
			<NotesTreeView {...treeProps} />
		</EditorWrapper>
	);
}
