import { useEffect } from 'react';

interface UseShortcutsProps {
  onToggleSidebar: () => void;
  onToggleActivityBar: () => void;
  onReloadNote?: () => void;
}

export const useShortcuts = ({
  onToggleSidebar,
  onToggleActivityBar,
  onReloadNote
}: UseShortcutsProps) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'b':
            e.preventDefault();
            onToggleSidebar();
            break;
          case 'j':
            e.preventDefault();
            onToggleActivityBar();
            break;
        }
      } else if (e.key === 'F5' && onReloadNote) {
        e.preventDefault();
        onReloadNote();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onToggleSidebar, onToggleActivityBar, onReloadNote]);
};