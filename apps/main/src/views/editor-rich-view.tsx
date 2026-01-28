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
			<div className="flex-shrink-0 px-3 py-1 border-b border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-800 focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-inset">
				<input
					data-note-title
					className="w-full bg-transparent border-none text-base font-semibold text-gray-900 dark:text-gray-100 py-1 focus:outline-none"
					type="text"
					value={note.title}
					onChange={(e) => handleNoteTitleChange(note.id, e.target.value)}
					onKeyDown={(e) => {
						// Allow Ctrl+Shift hotkeys to bubble up for global handlers
						if (e.ctrlKey && e.shiftKey) {
							// Don't preventDefault - let the hotkey system handle it
							return;
						}
						// Enter key moves focus to editor
						if (e.key === "Enter") {
							e.preventDefault();
							const editorEl = document.querySelector(".ProseMirror") as HTMLElement;
							editorEl?.focus();
						}
					}}
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
					autoFocus={viewData?.cursorPosition !== undefined}
				/>
			</div>
		</div>
	);
}
