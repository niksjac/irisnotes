import { useAtomValue } from "jotai";
import { itemsAtom } from "@/atoms/items";
import { EditorContainer } from "@/components";
import { useItems } from "@/hooks";
import { useEditorLayout } from "@/hooks/use-editor-layout";

interface EditorRichViewProps {
	viewData?: { noteId?: string; cursorPosition?: number };
}

export function EditorRichView({ viewData }: EditorRichViewProps) {
	const items = useAtomValue(itemsAtom);
	const { updateItemContent, updateItemTitle } = useItems();
	const { toolbarVisible } = useEditorLayout();

	// Get the note from viewData or fall back to selectedNote
	const note = viewData?.noteId
		? items.find((item) => item.id === viewData.noteId && item.type === "note")
		: null;

	const handleNoteContentChange = (noteId: string, content: string) => {
		updateItemContent(noteId, content);
	};

	const handleNoteTitleChange = (noteId: string, title: string) => {
		updateItemTitle(noteId, title);
	};

	if (!note) {
		return (
			<div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400 italic">
				<p>No note selected</p>
			</div>
		);
	}

	return (
		<div className="flex flex-col h-full bg-white dark:bg-gray-900">
			{/* Note Title */}
			<div className="flex-shrink-0 p-4 border-b border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-800">
				<input
					className="w-full bg-transparent border-none text-lg font-semibold text-gray-900 dark:text-gray-100 py-2 focus:outline-none focus:border-b-2 focus:border-blue-500"
					type="text"
					value={note.title}
					onChange={(e) => handleNoteTitleChange(note.id, e.target.value)}
					placeholder="Untitled Note"
				/>
			</div>

			{/* Rich Editor */}
			<div className="flex-1 overflow-hidden relative">
				<EditorContainer
					content={note.content}
					onChange={(content) => handleNoteContentChange(note.id, content)}
					defaultView="rich"
					initialCursorPosition={viewData?.cursorPosition}
					toolbarVisible={toolbarVisible}
				/>
			</div>
		</div>
	);
}
