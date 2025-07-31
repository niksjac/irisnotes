import { useState } from 'react';

export const useThemeState = () => {
	const [darkMode, setDarkMode] = useState(false);

	return {
		darkMode,
		setDarkMode,
	};
};
