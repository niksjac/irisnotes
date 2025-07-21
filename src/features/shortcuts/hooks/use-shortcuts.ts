import { useEffect } from 'react';

interface UseShortcutsProps {
  onToggleSidebar: () => void;
  onToggleActivityBar: () => void;
  onToggleDualPane?: () => void;
  onReloadNote?: () => void;
  onToggleLineWrapping?: () => void;
  onIncreaseFontSize?: () => void;
  onDecreaseFontSize?: () => void;
}

export const useShortcuts = ({
  onToggleSidebar,
  onToggleActivityBar,
  onToggleDualPane,
  onReloadNote,
  onToggleLineWrapping,
  onIncreaseFontSize,
  onDecreaseFontSize,
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
          case '+':
          case '=': // Handle both + and = keys (= is unshifted + on most keyboards)
            if (onIncreaseFontSize) {
              e.preventDefault();
              onIncreaseFontSize();
            }
            break;
          case '-':
          case '_': // Handle both - and _ keys
            if (onDecreaseFontSize) {
              e.preventDefault();
              onDecreaseFontSize();
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
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [
    onToggleSidebar,
    onToggleActivityBar,
    onToggleDualPane,
    onReloadNote,
    onToggleLineWrapping,
    onIncreaseFontSize,
    onDecreaseFontSize,
  ]);
};
