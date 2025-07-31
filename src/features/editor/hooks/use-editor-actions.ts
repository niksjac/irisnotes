import { useSetAtom } from 'jotai';
import { useCallback } from 'react';
import { fontSizeAtom } from '../../../atoms';

export const useEditorActions = () => {
	const setFontSize = useSetAtom(fontSizeAtom);

	const increaseFontSize = useCallback(() => {
		setFontSize(prev => Math.min(prev + 2, 24));
	}, [setFontSize]);

	const decreaseFontSize = useCallback(() => {
		setFontSize(prev => Math.max(prev - 2, 10));
	}, [setFontSize]);

	const resetFontSize = useCallback(() => {
		setFontSize(14);
	}, [setFontSize]);

	return {
		increaseFontSize,
		decreaseFontSize,
		resetFontSize,
	};
};
