import { useCallback } from 'react';
import { useSetAtom } from 'jotai';
import { fontSizeAtom, isWrappingAtom } from '../../../atoms';

export const useEditorActions = () => {
  const setFontSize = useSetAtom(fontSizeAtom);
  const setIsWrapping = useSetAtom(isWrappingAtom);

  const increaseFontSize = useCallback(() => {
    setFontSize(prev => Math.min(prev + 2, 24));
  }, [setFontSize]);

  const decreaseFontSize = useCallback(() => {
    setFontSize(prev => Math.max(prev - 2, 10));
  }, [setFontSize]);

  const resetFontSize = useCallback(() => {
    setFontSize(14);
  }, [setFontSize]);

  const toggleLineWrapping = useCallback(() => {
    setIsWrapping(prev => !prev);
  }, [setIsWrapping]);

  return {
    increaseFontSize,
    decreaseFontSize,
    resetFontSize,
    toggleLineWrapping,
  };
};