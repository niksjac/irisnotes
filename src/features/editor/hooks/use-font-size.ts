import { useState, useCallback, useEffect } from 'react';

interface FontSizeConfig {
  baseFontSize: number;
  minFontSize: number;
  maxFontSize: number;
  increment: number;
}

const DEFAULT_CONFIG: FontSizeConfig = {
  baseFontSize: 14, // Default base font size in px
  minFontSize: 8,   // Minimum font size
  maxFontSize: 32,  // Maximum font size
  increment: 2      // Increment step
};

export const useFontSize = (config: Partial<FontSizeConfig> = {}) => {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };

  const [fontSize, setFontSize] = useState(finalConfig.baseFontSize);

  // Calculate relative sizes for headers
  const getFontSizes = useCallback(() => {
    const base = fontSize;
    return {
      base,
      h1: Math.round(base * 2.0),    // 2x base size for H1
      h2: Math.round(base * 1.5),    // 1.5x base size for H2
      h3: Math.round(base * 1.25),   // 1.25x base size for H3
      h4: Math.round(base * 1.1),    // 1.1x base size for H4
      h5: base,                      // Same as base for H5
      h6: Math.round(base * 0.9),    // 0.9x base size for H6
      small: Math.round(base * 0.875), // Smaller text
      code: Math.round(base * 0.9)   // Code text slightly smaller
    };
  }, [fontSize]);

  // Increase font size
  const increaseFontSize = useCallback(() => {
    setFontSize(prev => {
      const newSize = prev + finalConfig.increment;
      return Math.min(newSize, finalConfig.maxFontSize);
    });
  }, [finalConfig.increment, finalConfig.maxFontSize]);

  // Decrease font size
  const decreaseFontSize = useCallback(() => {
    setFontSize(prev => {
      const newSize = prev - finalConfig.increment;
      return Math.max(newSize, finalConfig.minFontSize);
    });
  }, [finalConfig.increment, finalConfig.minFontSize]);

  // Reset to base font size
  const resetFontSize = useCallback(() => {
    setFontSize(finalConfig.baseFontSize);
  }, [finalConfig.baseFontSize]);

  // Set specific font size (with bounds checking)
  const setSpecificFontSize = useCallback((size: number) => {
    const clampedSize = Math.max(
      finalConfig.minFontSize,
      Math.min(size, finalConfig.maxFontSize)
    );
    setFontSize(clampedSize);
  }, [finalConfig.minFontSize, finalConfig.maxFontSize]);

  // Apply font sizes to CSS custom properties
  useEffect(() => {
    const sizes = getFontSizes();
    const root = document.documentElement;

    // Set CSS custom properties for editor-specific font sizes
    root.style.setProperty('--editor-font-size', `${sizes.base}px`);
    root.style.setProperty('--editor-font-size-h1', `${sizes.h1}px`);
    root.style.setProperty('--editor-font-size-h2', `${sizes.h2}px`);
    root.style.setProperty('--editor-font-size-h3', `${sizes.h3}px`);
    root.style.setProperty('--editor-font-size-h4', `${sizes.h4}px`);
    root.style.setProperty('--editor-font-size-h5', `${sizes.h5}px`);
    root.style.setProperty('--editor-font-size-h6', `${sizes.h6}px`);
    root.style.setProperty('--editor-font-size-small', `${sizes.small}px`);
    root.style.setProperty('--editor-font-size-code', `${sizes.code}px`);
  }, [getFontSizes]);

  return {
    fontSize,
    fontSizes: getFontSizes(),
    increaseFontSize,
    decreaseFontSize,
    resetFontSize,
    setSpecificFontSize,
    canIncrease: fontSize < finalConfig.maxFontSize,
    canDecrease: fontSize > finalConfig.minFontSize,
    isAtDefault: fontSize === finalConfig.baseFontSize,
    config: finalConfig
  };
};