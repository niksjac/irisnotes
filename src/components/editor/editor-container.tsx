import type React from "react";
import { useRightClickMenu, useRightClickMenuActions } from "@/hooks";
import { RightClickMenu } from "../right-click-menu";
import type { EditorRightClickData } from "@/types/right-click-menu";

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
	const { rightClickMenu, handleRightClickMenu, hideRightClickMenu } = useRightClickMenu();
	const { getEditorMenuGroups } = useRightClickMenuActions();
	const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
		if (onChange && !readOnly) {
			onChange(e.target.value);
		}
	};

	const handleEditorRightClick = (event: React.MouseEvent) => {
		const target = event.target as HTMLTextAreaElement;
		const hasSelection = target.selectionStart !== target.selectionEnd;
		const selectedText = hasSelection ? target.value.substring(target.selectionStart, target.selectionEnd) : undefined;

		const rightClickData: EditorRightClickData = {
			noteId,
			selectedText,
			hasSelection,
		};

		const menuGroups = getEditorMenuGroups(rightClickData);
		handleRightClickMenu(event, {
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
					onContextMenu={handleEditorRightClick}
					readOnly={readOnly}
					className="flex-1 w-full p-4 border-0 resize-none focus:outline-none bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
					placeholder={placeholder}
				/>
			</div>
			<RightClickMenu data={rightClickMenu} onClose={hideRightClickMenu} />
		</>
	);
};
