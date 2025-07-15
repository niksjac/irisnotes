import { useState } from 'react';
import { appConfigDir } from "@tauri-apps/api/path";
import { readTextFile, exists } from "@tauri-apps/plugin-fs";

export const useTheme = () => {
  const [darkMode, setDarkMode] = useState(false);

  const loadUserTheme = async () => {
    try {
      const configDir = await appConfigDir();
      const themePath = `${configDir}/theme.css`;

      if (await exists(themePath)) {
        const themeCSS = await readTextFile(themePath);

        // Remove existing user theme
        const existingStyle = document.getElementById('user-theme-styles');
        if (existingStyle) {
          existingStyle.remove();
        }

        // Inject user theme
        const styleElement = document.createElement('style');
        styleElement.id = 'user-theme-styles';
        styleElement.textContent = themeCSS;
        document.head.appendChild(styleElement);


      }
    } catch (error) {
      console.error("Failed to load user theme:", error);
    }
  };

  const toggleDarkMode = () => {
    setDarkMode(prev => {
      const newMode = !prev;
      document.documentElement.setAttribute('data-theme', newMode ? 'dark' : 'light');
      return newMode;
    });
  };

  return {
    darkMode,
    loadUserTheme,
    toggleDarkMode
  };
};