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
  onDecreaseFontSize
}: UseShortcutsProps) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Debug logging to help troubleshoot
      if (e.altKey && e.key === 'z') {
        console.log('🔥 Alt+Z detected in useShortcuts!', {
          altKey: e.altKey,
          key: e.key,
          target: e.target,
          onToggleLineWrapping: !!onToggleLineWrapping
        });
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === '+' || e.key === '=' || e.key === '-')) {
        console.log('🔥 Font size shortcut detected!', {
          ctrlKey: e.ctrlKey,
          metaKey: e.metaKey,
          key: e.key,
          target: e.target,
          onIncreaseFontSize: !!onIncreaseFontSize,
          onDecreaseFontSize: !!onDecreaseFontSize
        });
      }

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
              console.log('✅ Executing increase font size');
              onIncreaseFontSize();
            }
            break;
          case '-':
          case '_': // Handle both - and _ keys
            if (onDecreaseFontSize) {
              e.preventDefault();
              console.log('✅ Executing decrease font size');
              onDecreaseFontSize();
            }
            break;
        }
      } else if (e.altKey && e.key === 'z' && onToggleLineWrapping) {
        e.preventDefault();
        console.log('✅ Executing toggle line wrapping');
        onToggleLineWrapping();
      } else if (e.key === 'F5' && onReloadNote) {
        e.preventDefault();
        onReloadNote();
      }
    };

    console.log('🎯 useShortcuts registered event listener');
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      console.log('🎯 useShortcuts removing event listener');
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onToggleSidebar, onToggleActivityBar, onToggleDualPane, onReloadNote, onToggleLineWrapping, onIncreaseFontSize, onDecreaseFontSize]);
};