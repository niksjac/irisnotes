import { useCallback, useRef } from 'react';
import { cn } from '@/shared/utils/cn';

interface EditorWrapperProps {
	children: React.ReactNode;
	className?: string;
}

export function EditorWrapper({ children, className }: EditorWrapperProps) {
	const editorRef = useRef<HTMLDivElement>(null);

	// Method to focus editor content - fallback approach
	const focusEditorContent = useCallback(() => {
		if (!editorRef.current) return;

		// Try multiple approaches to find and focus the editor
		const approaches = [
			// 1. Try ProseMirror editor
			() => {
				const proseMirrorEditor = editorRef.current!.querySelector('.ProseMirror') as HTMLElement;
				if (proseMirrorEditor) {
					proseMirrorEditor.focus();
					return true;
				}
				return false;
			},

			// 2. Try CodeMirror editor
			() => {
				const codeMirrorEditor = editorRef.current!.querySelector('.cm-editor') as HTMLElement;
				if (codeMirrorEditor) {
					const cmView = (codeMirrorEditor as any).cmView;
					if (cmView) {
						cmView.focus();
						return true;
					}

					// Fallback: focus content area
					const contentArea = codeMirrorEditor.querySelector('.cm-content') as HTMLElement;
					if (contentArea) {
						contentArea.focus();
						return true;
					}
				}
				return false;
			},

			// 3. Try any focusable element inside editor
			() => {
				const focusableElements = editorRef.current!.querySelectorAll(
					'input, textarea, [contenteditable], [tabindex]:not([tabindex="-1"])'
				);
				if (focusableElements.length > 0) {
					(focusableElements[0] as HTMLElement).focus();
					return true;
				}
				return false;
			},

			// 4. Final fallback: focus wrapper itself
			() => {
				editorRef.current!.focus();
				return true;
			},
		];

		// Try each approach until one succeeds
		for (const approach of approaches) {
			try {
				if (approach()) {
					return;
				}
			} catch (error) {
				console.warn('Focus approach failed:', error);
			}
		}
	}, []);

	const handleClick = () => {
		focusEditorContent();
	};

	return (
		<div
			ref={editorRef}
			className={cn('editor-wrapper', className)}
			tabIndex={0}
			onClick={handleClick}
		>
			{children}
		</div>
	);
}
