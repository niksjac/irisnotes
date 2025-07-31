import { useFontSize } from './use-font-size';

export const useEditorState = () => {
	// Use existing focused hooks which already manage the atoms
	const fontSizeHook = useFontSize();

	return {
		// Font size from existing hook
		...fontSizeHook,
	};
};
