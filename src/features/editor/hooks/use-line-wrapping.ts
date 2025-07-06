import { useCallback } from 'react';
import { useConfig } from '../../../hooks/use-config';

export const useLineWrapping = () => {
  const { config, updateConfig, loading } = useConfig();

  const toggleLineWrapping = useCallback(() => {
    const newWrappingState = !config.editor.lineWrapping;

    console.log('Toggling line wrapping from', config.editor.lineWrapping, 'to', newWrappingState);

    // Update config - this will trigger the useEffect in RichEditor component
    updateConfig({
      editor: {
        lineWrapping: newWrappingState,
        toolbarVisible: config.editor.toolbarVisible
      }
    });
  }, [config.editor.lineWrapping, updateConfig]);

  return {
    isWrapping: config.editor.lineWrapping,
    toggleLineWrapping,
    loading
  };
};