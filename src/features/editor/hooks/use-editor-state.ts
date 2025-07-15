import { useFontSize } from './use-font-size';
import { useLineWrapping } from './use-line-wrapping';

export const useEditorState = () => {
  // Use existing focused hooks which already manage the atoms
  const fontSizeHook = useFontSize();
  const lineWrappingHook = useLineWrapping();

  return {
    // Font size from existing hook
    ...fontSizeHook,

    // Line wrapping from existing hook
    ...lineWrappingHook,
  };
};