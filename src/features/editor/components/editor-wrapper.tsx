import React, { useRef, useEffect, useCallback } from "react";
import clsx from "clsx";

interface EditorWrapperProps {
  children: React.ReactNode;
  // Focus management props
  focusClasses?: Record<string, boolean>;
  onRegisterElement?: (ref: HTMLElement | null) => void;
  onSetFocusFromClick?: () => void;
}

export function EditorWrapper({
  children,
  focusClasses = {},
  onRegisterElement,
  onSetFocusFromClick
}: EditorWrapperProps) {
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
          // Don't automatically position cursor - let it stay where user placed it
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
      }
    ];

    // Try each approach until one succeeds
    for (const approach of approaches) {
      try {
        if (approach()) {
          console.log('Editor focused successfully');
          return;
        }
      } catch (error) {
        console.warn('Focus approach failed:', error);
      }
    }
  }, []);

  // Register with focus management
  useEffect(() => {
    if (onRegisterElement && editorRef.current) {
      onRegisterElement(editorRef.current);
    }
  }, [onRegisterElement]);

  // Focus the actual editor when wrapper receives focus-current class
  useEffect(() => {
    if (focusClasses['focus-current']) {
      // Small delay to ensure editor is fully rendered
      setTimeout(() => {
        focusEditorContent();
      }, 50);
    }
  }, [focusClasses, focusEditorContent]);

  const handleClick = () => {
    if (onSetFocusFromClick) {
      onSetFocusFromClick();
    }
  };

  return (
    <div
      ref={editorRef}
      className={clsx("editor-wrapper", focusClasses)}
      tabIndex={0}
      onClick={handleClick}
    >
      {children}
    </div>
  );
}