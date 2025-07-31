import type { NotesTreeViewProps } from '@/features/notes-tree-view';
import { NotesTreeView } from '@/features/notes-tree-view';
import { EditorWrapper } from './editor-wrapper';

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
