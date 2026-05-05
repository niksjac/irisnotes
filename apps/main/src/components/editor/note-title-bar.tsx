import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from "react";

interface NoteTitleBarProps {
	noteId: string;
	title: string;
	onTitleChange: (noteId: string, title: string) => void | Promise<unknown>;
	onFocusEditor?: () => void;
}

function focusOpenEditor() {
	const prosemirror = document.querySelector(".ProseMirror") as HTMLElement | null;
	if (prosemirror) {
		prosemirror.focus();
		return;
	}

	const codemirror = document.querySelector(".cm-editor .cm-content") as HTMLElement | null;
	codemirror?.focus();
}

export function NoteTitleBar({
	noteId,
	title,
	onTitleChange,
	onFocusEditor = focusOpenEditor,
}: NoteTitleBarProps) {
	const [draftTitle, setDraftTitle] = useState(title);
	const committedTitleRef = useRef(title);
	const draftTitleRef = useRef(title);
	const isFocusedRef = useRef(false);

	useEffect(() => {
		committedTitleRef.current = title;

		if (!isFocusedRef.current) {
			setDraftTitle(title);
			draftTitleRef.current = title;
		}
	}, [title]);

	const commitDraftTitle = useCallback(() => {
		const nextTitle = draftTitleRef.current;
		if (nextTitle === committedTitleRef.current) return;

		committedTitleRef.current = nextTitle;
		void onTitleChange(noteId, nextTitle);
	}, [noteId, onTitleChange]);

	const restoreCommittedTitle = useCallback(() => {
		const committedTitle = committedTitleRef.current;
		setDraftTitle(committedTitle);
		draftTitleRef.current = committedTitle;
	}, []);

	const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
		if (event.ctrlKey && event.shiftKey) return;

		if (event.key === "Enter" && !event.altKey && !event.metaKey && !event.ctrlKey && !event.shiftKey) {
			event.preventDefault();
			commitDraftTitle();
			event.currentTarget.blur();
			onFocusEditor();
			return;
		}

		if (event.key === "Escape") {
			event.preventDefault();
			restoreCommittedTitle();
			event.currentTarget.blur();
			onFocusEditor();
		}
	};

	return (
		<div className="flex-shrink-0 px-3 py-1 border-b border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-800 focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-inset">
			<input
				data-note-title
				className="w-full bg-transparent border-none text-base font-semibold text-gray-900 dark:text-gray-100 py-1 focus:outline-none"
				type="text"
				value={draftTitle}
				onFocus={() => {
					isFocusedRef.current = true;
				}}
				onBlur={() => {
					isFocusedRef.current = false;
					commitDraftTitle();
				}}
				onChange={(event) => {
					const nextTitle = event.target.value;
					setDraftTitle(nextTitle);
					draftTitleRef.current = nextTitle;
				}}
				onKeyDown={handleKeyDown}
				placeholder="Untitled Note"
			/>
		</div>
	);
}
