import { useState, useEffect } from "react";

/**
 * Modern hook using matchMedia API instead of resize events
 * More performant and aligned with CSS breakpoints
 */
export function useMediaQuery(query: string): boolean {
	const [matches, setMatches] = useState(() => {
		if (typeof window !== "undefined") {
			return window.matchMedia(query).matches;
		}
		return false;
	});

	useEffect(() => {
		const mediaQuery = window.matchMedia(query);

		// Modern event listener (not resize events)
		const handleChange = (event: MediaQueryListEvent) => {
			setMatches(event.matches);
		};

		mediaQuery.addEventListener("change", handleChange);
		return () => mediaQuery.removeEventListener("change", handleChange);
	}, [query]);

	return matches;
}

// Convenience hooks for common breakpoints
export const useIsMobile = () => useMediaQuery("(max-width: 767px)");
export const useIsTablet = () =>
	useMediaQuery("(min-width: 768px) and (max-width: 1023px)");
export const useIsDesktop = () => useMediaQuery("(min-width: 1024px)");
