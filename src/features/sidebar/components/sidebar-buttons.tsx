import { useRef, useEffect } from 'react';
import clsx from 'clsx';
import { Folder, FileText, Search, MoreHorizontal } from 'lucide-react';

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
  onSetFocusFromClick,
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
      className={clsx(
        'flex flex-col gap-4 px-4 py-4 border-r border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-800 outline-none',
        focusClasses
      )}
      tabIndex={0}
      onClick={handleClick}
    >
      <div className='flex flex-row gap-4'>
        <div className='flex flex-row gap-4'>
          <button
            className='flex items-center justify-center w-9 h-9 border-none rounded bg-transparent text-gray-600 dark:text-gray-400 cursor-pointer transition-all duration-200 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100 active:bg-gray-300 dark:active:bg-gray-600'
            onClick={onCreateNote}
            title='New Note (Ctrl+N)'
          >
            <FileText size={16} />
          </button>

          <button
            className='flex items-center justify-center w-9 h-9 border-none rounded bg-transparent text-gray-600 dark:text-gray-400 cursor-pointer transition-all duration-200 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100 active:bg-gray-300 dark:active:bg-gray-600'
            onClick={onCreateFolder}
            title='New Folder'
          >
            <Folder size={16} />
          </button>

          <button
            className='flex items-center justify-center w-9 h-9 border-none rounded bg-transparent text-gray-600 dark:text-gray-400 cursor-pointer transition-all duration-200 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100 active:bg-gray-300 dark:active:bg-gray-600'
            onClick={onFocusSearch}
            title='Focus Search (Ctrl+Shift+P)'
          >
            <Search size={16} />
          </button>
        </div>

        <div className='flex flex-row gap-4'>
          <button
            className='flex items-center justify-center w-9 h-9 border-none rounded bg-transparent text-gray-600 dark:text-gray-400 cursor-pointer transition-all duration-200 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100 active:bg-gray-300 dark:active:bg-gray-600'
            title='More Actions'
          >
            <MoreHorizontal size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
