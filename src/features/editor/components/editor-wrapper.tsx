import { useRef, useEffect } from "react";
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

  // Register with focus management
  useEffect(() => {
    if (onRegisterElement && editorRef.current) {
      onRegisterElement(editorRef.current);
    }
  }, [onRegisterElement]);

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