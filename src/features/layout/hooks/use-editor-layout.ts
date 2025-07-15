import { useCallback } from 'react';
import { useSetAtom } from 'jotai';
import { toolbarVisibleAtom } from '../../../atoms';
import { useConfig } from '../../../hooks/use-config';

export const useEditorLayout = () => {
  const { config, updateConfig } = useConfig();
  const setToolbarVisible = useSetAtom(toolbarVisibleAtom);

  const toggleToolbar = useCallback(() => {
    const newVisibility = !config.editor.toolbarVisible;
    updateConfig({
      editor: {
        ...config.editor,
        toolbarVisible: newVisibility
      }
    });
    setToolbarVisible(newVisibility);
  }, [config.editor, updateConfig, setToolbarVisible]);

  return {
    toolbarVisible: config.editor.toolbarVisible,
    toggleToolbar,
  };
};