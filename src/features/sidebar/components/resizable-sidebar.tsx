import { useState, useRef, useCallback, useEffect } from 'react';
import clsx from 'clsx';

// ==================== COMPONENT INTERFACE ====================

interface ResizableSidebarProps {
  isCollapsed: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  children: React.ReactNode;
  minWidth?: number;
  maxWidth?: number;
  defaultWidth?: number;
  autoCollapseOnResize?: boolean;
}

export function ResizableSidebar({
  isCollapsed,
  onCollapsedChange,
  children,
  minWidth = 200,
  maxWidth = 600,
  defaultWidth = 300,
  autoCollapseOnResize = true,
}: ResizableSidebarProps) {
  // ==================== STATE MANAGEMENT ====================

  const [width, setWidth] = useState(defaultWidth);
  const [isDragging, setIsDragging] = useState(false);
  const startX = useRef(0);
  const startWidth = useRef(0);

  // ==================== EVENT HANDLERS ====================

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault(); // Prevent text selection from starting
      setIsDragging(true);
      startX.current = e.clientX;
      startWidth.current = width;

      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
      // Also prevent selection on the document element
      document.documentElement.style.userSelect = 'none';
    },
    [width]
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging) return;

      const deltaX = e.clientX - startX.current;
      const newWidth = startWidth.current + deltaX;

      // Apply min/max constraints
      const constrainedWidth = Math.max(minWidth, Math.min(maxWidth, newWidth));
      setWidth(constrainedWidth);

      // Auto-collapse if dragged very small (only if enabled)
      if (autoCollapseOnResize && newWidth < minWidth / 2) {
        onCollapsedChange?.(true);
      }
    },
    [isDragging, minWidth, maxWidth, autoCollapseOnResize, onCollapsedChange]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
    document.documentElement.style.userSelect = '';
  }, []);

  // ==================== GLOBAL EVENT LISTENERS ====================

  // Add global mouse events when dragging
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
    return undefined;
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // ==================== RENDERING ====================

  // Handle collapsed state
  if (isCollapsed) {
    return <div className='w-0 h-full flex-shrink-0 overflow-hidden' />;
  }

  // Main component structure with resize handle
  return (
    <div
      className={clsx(
        'h-full relative bg-gray-100 dark:bg-gray-800 border-r border-gray-300 dark:border-gray-600 flex-shrink-0 overflow-hidden',
        'hover:border-r-blue-500 transition-colors',
        isDragging && 'border-r-blue-500'
      )}
      style={{ width }}
    >
      <div className='h-full overflow-hidden flex flex-col'>{children}</div>

      {/* Draggable resize handle - covers the entire right edge */}
      <div
        className={clsx(
          'absolute top-0 right-0 w-1 h-full cursor-col-resize',
          'hover:bg-blue-500 hover:bg-opacity-50 transition-colors',
          isDragging && 'bg-blue-500 bg-opacity-50'
        )}
        onMouseDown={handleMouseDown}
      />
    </div>
  );
}
