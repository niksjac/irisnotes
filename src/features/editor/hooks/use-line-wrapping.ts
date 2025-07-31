import { useAtom } from 'jotai';
import { useCallback, useEffect, useRef } from 'react';
import { isWrappingAtom } from '../../../atoms';
import { useConfig } from '../../../hooks/use-config';

export const useLineWrapping = () => {
	const [isWrapping, setIsWrapping] = useAtom(isWrappingAtom);
	const { config, loading } = useConfig();
	const initializedRef = useRef(false);

	// Initialize atom from config on startup only (not when atom changes)
	useEffect(() => {
		if (!loading && !initializedRef.current) {
			setIsWrapping(config.editor.lineWrapping);
			initializedRef.current = true;
		}
	}, [config.editor.lineWrapping, loading, setIsWrapping]);

	const toggleLineWrapping = useCallback(() => {
		setIsWrapping(prev => !prev); // Immediate UI update
	}, [setIsWrapping]);

	return {
		isWrapping,
		toggleLineWrapping,
		loading,
	};
};
