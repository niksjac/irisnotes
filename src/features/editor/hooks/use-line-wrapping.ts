import { useState, useCallback } from 'react';

export const useLineWrapping = () => {
  const [isWrapping, setIsWrapping] = useState(false);

  const toggleLineWrapping = useCallback(() => {
    const newWrappingState = !isWrapping;
    setIsWrapping(newWrappingState);

    // Toggle CSS class on the rich editor container
    const richEditorView = document.querySelector('.rich-editor-view');
    if (richEditorView) {
      if (newWrappingState) {
        richEditorView.classList.remove('no-line-wrapping');
        richEditorView.classList.add('line-wrapping');
      } else {
        richEditorView.classList.remove('line-wrapping');
        richEditorView.classList.add('no-line-wrapping');
      }
    }
  }, [isWrapping]);

  return {
    isWrapping,
    toggleLineWrapping
  };
};