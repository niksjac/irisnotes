import type React from "react";
import { useContextMenu, useContextMenuActions } from "@/hooks";
import { ContextMenu } from "../context-menu";
import type { EditorContextData } from "@/types/context-menu";

interface EditorContainerProps {
	content?: string;
	onChange?: (content: string) => void;
	readOnly?: boolean;
	className?: string;
	children?: React.ReactNode;
	placeholder?: string;
	defaultView?: string;
	toolbarVisible?: boolean;
	noteId?: string;
}

export const EditorContainer: React.FC<EditorContainerProps> = ({
	content = "",
	onChange,
	readOnly = false,
	className = "",
	children,
	placeholder = "Start writing...",
	defaultView: _defaultView,
	toolbarVisible: _toolbarVisible,
	noteId,
}) => {
	const { contextMenu, handleContextMenu, hideContextMenu } = useContextMenu();
	const { getEditorMenuGroups } = useContextMenuActions();
	const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
		if (onChange && !readOnly) {
			onChange(e.target.value);
		}
	};

	const handleEditorContextMenu = (event: React.MouseEvent) => {
		const target = event.target as HTMLTextAreaElement;
		const hasSelection = target.selectionStart !== target.selectionEnd;
		const selectedText = hasSelection ? target.value.substring(target.selectionStart, target.selectionEnd) : undefined;

		const contextData: EditorContextData = {
			noteId,
			selectedText,
			hasSelection,
		};

		const menuGroups = getEditorMenuGroups(contextData);
		handleContextMenu(event, {
			targetId: noteId,
			targetType: "editor",
			menuGroups,
		});
	};

	return (
		<>
			<div className={`flex flex-col h-full ${className}`}>
				{children}
				<textarea
					value={content}
					onChange={handleChange}
					onContextMenu={handleEditorContextMenu}
					readOnly={readOnly}
					className="flex-1 w-full p-4 border-0 resize-none focus:outline-none bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
					placeholder={placeholder}
				/>
			</div>
			<ContextMenu data={contextMenu} onClose={hideContextMenu} />
		</>
	);
};
