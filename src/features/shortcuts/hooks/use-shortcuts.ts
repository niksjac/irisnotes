import { useEffect } from 'react';

interface UseShortcutsProps {
  onToggleSidebar: () => void;
  onToggleActivityBar: () => void;
  onToggleDualPane?: () => void;
  onReloadNote?: () => void;
  onToggleLineWrapping?: () => void;
}

export const useShortcuts = ({
  onToggleSidebar,
  onToggleActivityBar,
  onToggleDualPane,
  onReloadNote,
  onToggleLineWrapping
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
          case 'd':
            if (onToggleDualPane) {
              e.preventDefault();
              onToggleDualPane();
            }
            break;
        }
      } else if (e.altKey && e.key === 'z' && onToggleLineWrapping) {
        e.preventDefault();
        onToggleLineWrapping();
      } else if (e.key === 'F5' && onReloadNote) {
        e.preventDefault();
        onReloadNote();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onToggleSidebar, onToggleActivityBar, onToggleDualPane, onReloadNote, onToggleLineWrapping]);
};