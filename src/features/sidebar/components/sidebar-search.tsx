import { useRef, useEffect } from "react";
import clsx from "clsx";

interface SidebarSearchProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  placeholder?: string;
  // Focus management props
  focusClasses?: Record<string, boolean>;
  onRegisterElement?: (ref: HTMLElement | null) => void;
  onSetFocusFromClick?: () => void;
}

export function SidebarSearch({
  searchQuery,
  onSearchChange,
  placeholder = "Search notes...",
  focusClasses = {},
  onRegisterElement,
  onSetFocusFromClick
}: SidebarSearchProps) {
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Register with focus management
  useEffect(() => {
    if (onRegisterElement && searchRef.current) {
      onRegisterElement(searchRef.current);
    }
  }, [onRegisterElement]);

  // Focus the input when this component is focused via focus management
  useEffect(() => {
    if (focusClasses['focus-current'] && inputRef.current) {
      // Use a minimal delay to ensure smooth transitions
      requestAnimationFrame(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      });
    }
  }, [focusClasses]);

  const handleClick = () => {
    if (onSetFocusFromClick) {
      onSetFocusFromClick();
    }
    // Focus management will handle the input focus
  };

  return (
    <div
      ref={searchRef}
      className={clsx("sidebar-search", "tree-search", focusClasses)}
      tabIndex={0}
      onClick={handleClick}
    >
      <input
        ref={inputRef}
        type="text"
        placeholder={placeholder}
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        onClick={(e) => e.stopPropagation()}
        className="tree-search-input"
      />
    </div>
  );
}