import type React from "react";
import { useRef } from "react";
import type { EditorView } from "prosemirror-view";
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
	titleBar?: React.ReactNode;
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
	titleBar,
}) => {
	const containerRef = useRef<HTMLDivElement>(null);
	const editorViewRef = useRef<EditorView | null>(null);
	const { rightClickMenu, handleRightClickMenu, showRightClickMenu, hideRightClickMenu } =
		useRightClickMenu();
	const { getEditorMenuGroups } = useRightClickMenuActions();
	
	// Enable Ctrl+scroll wheel zoom
	useEditorZoom(containerRef);

	const handleEditorRightClick = (event: React.MouseEvent) => {
		const view = defaultView === "source" ? null : editorViewRef.current;
		const rightClickData: EditorRightClickData = {
			noteId,
			selectedText: undefined,
			hasSelection: view ? !view.state.selection.empty : false,
			editorView: view && view.editable ? view : undefined,
		};

		const menuGroups = getEditorMenuGroups(rightClickData);
		// The Menu key reports no pointer position: open the menu at the caret
		if (view && event.clientX === 0 && event.clientY === 0) {
			event.preventDefault();
			event.stopPropagation();
			const caret = view.coordsAtPos(view.state.selection.head);
			showRightClickMenu({
				targetId: noteId,
				targetType: "editor",
				menuGroups,
				position: { x: caret.left, y: caret.bottom },
			});
			return;
		}
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
						titleBar={titleBar}
						onViewChange={(view) => {
							editorViewRef.current = view;
						}}
					/>
				)}
				<ZoomIndicator />
			</div>
			<RightClickMenu data={rightClickMenu} onClose={hideRightClickMenu} />
		</>
	);
};
