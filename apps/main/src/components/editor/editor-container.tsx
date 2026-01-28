import type React from "react";
import { useRef } from "react";
import { useRightClickMenu, useRightClickMenuActions, useEditorZoom } from "@/hooks";
import { RightClickMenu } from "../right-click-menu";
import type { EditorRightClickData } from "@/types/right-click-menu";
import { CodeMirrorEditor } from "./codemirror-editor";
import { ProseMirrorEditor } from "./prosemirror-editor";
import { ZoomIndicator } from "./zoom-indicator";

interface EditorContainerProps {
	content?: string;
	onChange?: (content: string) => void;
	readOnly?: boolean;
	className?: string;
	children?: React.ReactNode;
	defaultView?: string;
	noteId?: string;
	initialCursorPosition?: number;
	toolbarVisible?: boolean;
	autoFocus?: boolean;
}

export const EditorContainer: React.FC<EditorContainerProps> = ({
	content = "",
	onChange,
	readOnly = false,
	className = "",
	children,
	defaultView = "rich",
	noteId,
	initialCursorPosition,
	toolbarVisible = false,
	autoFocus = false,
}) => {
	const containerRef = useRef<HTMLDivElement>(null);
	const { rightClickMenu, handleRightClickMenu, hideRightClickMenu } =
		useRightClickMenu();
	const { getEditorMenuGroups } = useRightClickMenuActions();
	
	// Enable Ctrl+scroll wheel zoom
	useEditorZoom(containerRef);

	const handleEditorRightClick = (event: React.MouseEvent) => {
		const rightClickData: EditorRightClickData = {
			noteId,
			selectedText: undefined,
			hasSelection: false,
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
			<div
				ref={containerRef}
				className={`editor-container relative flex flex-col h-full ${className}`}
				onContextMenu={handleEditorRightClick}
			>
				{children}
				{defaultView === "source" ? (
					<CodeMirrorEditor
						content={content}
						onChange={onChange}
						readOnly={readOnly}
						initialCursorPosition={initialCursorPosition}
						autoFocus={autoFocus}
					/>
				) : (
					<ProseMirrorEditor
						content={content}
						onChange={onChange}
						readOnly={readOnly}
						initialCursorPosition={initialCursorPosition}
						toolbarVisible={toolbarVisible}
						autoFocus={autoFocus}
					/>
				)}
				<ZoomIndicator />
			</div>
			<RightClickMenu data={rightClickMenu} onClose={hideRightClickMenu} />
		</>
	);
};
