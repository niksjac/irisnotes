import { useState, useCallback, useRef, useEffect } from "react";
import clsx from "clsx";
import "./resizable-sidebar.css";

interface ResizableSidebarProps {
  isCollapsed: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  children: React.ReactNode;
  minWidth?: number;
  maxWidth?: number;
  defaultWidth?: number;
}

export function ResizableSidebar({
  isCollapsed,
  onCollapsedChange,
  children,
  minWidth = 200,
  maxWidth = 600,
  defaultWidth = 300,
}: ResizableSidebarProps) {
  const [width, setWidth] = useState(defaultWidth);
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const resizerRef = useRef<HTMLDivElement>(null);
  const currentWidthRef = useRef(defaultWidth);
  const startXRef = useRef(0);
  const startWidthRef = useRef(0);
  const wasCollapsedRef = useRef(isCollapsed);

  // When toggling from collapsed, restore default width
  useEffect(() => {
    if (wasCollapsedRef.current && !isCollapsed) {
      setWidth(defaultWidth);
      currentWidthRef.current = defaultWidth;
    }
    wasCollapsedRef.current = isCollapsed;
  }, [isCollapsed, defaultWidth]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    startXRef.current = e.clientX;
    startWidthRef.current = width;
    currentWidthRef.current = width;
  }, [width]);

          const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isResizing || !sidebarRef.current) return;

      const deltaX = e.clientX - startXRef.current;
      const newWidth = startWidthRef.current + deltaX;

      // Allow dragging to very small widths and up to maxWidth
      if (newWidth >= 0 && newWidth <= maxWidth) {
        currentWidthRef.current = newWidth;
        // Update DOM directly for smooth resizing and remove minWidth constraint
        sidebarRef.current.style.width = `${newWidth}px`;
        sidebarRef.current.style.minWidth = '0px';
      }
    },
    [isResizing, maxWidth]
  );

    const handleMouseUp = useCallback(() => {
    setIsResizing(false);
    const finalWidth = currentWidthRef.current;

    // Restore the minWidth CSS property
    if (sidebarRef.current) {
      sidebarRef.current.style.minWidth = '';
    }

    // Auto-collapse only if dragged past the activity bar (to 0 width or less)
    if (finalWidth <= 0) {
      onCollapsedChange?.(true);
    } else {
      // Update React state when drag ends, but enforce minimum width for usability
      setWidth(Math.max(finalWidth, minWidth));
    }
  }, [onCollapsedChange, minWidth]);

  useEffect(() => {
    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";

      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
      };
    }
  }, [isResizing, handleMouseMove, handleMouseUp]);

  return (
    <div
      ref={sidebarRef}
      className={clsx("resizable-sidebar", {
        collapsed: isCollapsed,
        resizing: isResizing
      })}
      style={{
        width: isCollapsed ? 0 : width,
        minWidth: isCollapsed ? 0 : minWidth,
        maxWidth: isCollapsed ? 0 : maxWidth,
      }}
    >
      <div className="sidebar-content">
        {children}
      </div>

      {!isCollapsed && (
        <div
          ref={resizerRef}
          className="sidebar-resizer"
          onMouseDown={handleMouseDown}
        />
      )}
    </div>
  );
}