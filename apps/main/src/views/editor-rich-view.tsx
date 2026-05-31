import { useState } from "react";
import { useAtomValue } from "jotai";
import { itemsAtom } from "@/atoms/items";
import { NoteVersionHistoryDialog } from "@/components/dialogs";
import { EditorContainer, NoteMetadataBar, NoteTitleBar } from "@/components/editor";
import { useItems } from "@/hooks";
import { useEditorLayout } from "@/hooks/use-editor-layout";

interface EditorRichViewProps {
	viewData?: { noteId?: string; cursorPosition?: number };
}

export function EditorRichView({ viewData }: EditorRichViewProps) {
	const items = useAtomValue(itemsAtom);
	const { updateItemContent, updateItemTitle } = useItems();
	const { toolbarVisible, titleBarVisible, metadataBarVisible } = useEditorLayout();
	const [historyOpen, setHistoryOpen] = useState(false);

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
			<NoteVersionHistoryDialog
				isOpen={historyOpen}
				note={note}
				onClose={() => setHistoryOpen(false)}
			/>
			{/* Rich Editor (toolbar renders inside, above title) */}
			<div className="flex-1 overflow-hidden relative flex flex-col">
				<EditorContainer
					content={note.content}
					onChange={(content) => handleNoteContentChange(note.id, content)}
					defaultView="rich"
					initialCursorPosition={viewData?.cursorPosition}
					toolbarVisible={toolbarVisible}
					autoFocus={true}
					titleBar={
						titleBarVisible || metadataBarVisible ? (
							<>
								{titleBarVisible && (
									<NoteTitleBar
										noteId={note.id}
										title={note.title}
										onTitleChange={handleNoteTitleChange}
										onOpenHistory={() => setHistoryOpen(true)}
									/>
								)}
								{metadataBarVisible && (
									<NoteMetadataBar
										note={note}
										onOpenHistory={() => setHistoryOpen(true)}
									/>
								)}
							</>
						) : undefined
					}
				/>
			</div>
		</div>
	);
}
