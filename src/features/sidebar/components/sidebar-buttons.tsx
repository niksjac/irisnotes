import { useRef, useEffect } from "react";
import clsx from "clsx";
import { Folder, FileText, Search, MoreHorizontal } from "lucide-react";

interface SidebarButtonsProps {
  onCreateNote: () => void;
  onCreateFolder: () => void;
  onFocusSearch: () => void;
  // Focus management props
  focusClasses?: Record<string, boolean>;
  onRegisterElement?: (ref: HTMLElement | null) => void;
  onSetFocusFromClick?: () => void;
}

export function SidebarButtons({
  onCreateNote,
  onCreateFolder,
  onFocusSearch,
  focusClasses = {},
  onRegisterElement,
  onSetFocusFromClick
}: SidebarButtonsProps) {
  const buttonsRef = useRef<HTMLDivElement>(null);

  // Register with focus management
  useEffect(() => {
    if (onRegisterElement && buttonsRef.current) {
      onRegisterElement(buttonsRef.current);
    }
  }, [onRegisterElement]);

  const handleClick = (e: React.MouseEvent) => {
    // Only set focus if clicking on the container, not on buttons
    if (e.target === e.currentTarget && onSetFocusFromClick) {
      onSetFocusFromClick();
    }
  };

  return (
    <div
      ref={buttonsRef}
      className={clsx("sidebar-buttons", focusClasses)}
      tabIndex={0}
      onClick={handleClick}
    >
      <div className="sidebar-buttons-content">
        <div className="sidebar-buttons-group">
          <button
            className="sidebar-button"
            onClick={onCreateNote}
            title="New Note (Ctrl+N)"
          >
            <FileText size={16} />
          </button>

          <button
            className="sidebar-button"
            onClick={onCreateFolder}
            title="New Folder"
          >
            <Folder size={16} />
          </button>

          <button
            className="sidebar-button"
            onClick={onFocusSearch}
            title="Focus Search (Ctrl+Shift+P)"
          >
            <Search size={16} />
          </button>
        </div>

        <div className="sidebar-buttons-group">
          <button
            className="sidebar-button"
            title="More Actions"
          >
            <MoreHorizontal size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}