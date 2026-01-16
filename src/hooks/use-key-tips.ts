import { useEffect, useRef } from "react";
import { atom, useAtom } from "jotai";

// Global atom to track Alt key state (for visual KeyTips display)
export const altKeyHeldAtom = atom<boolean>(false);

// Delay before showing KeyTips (ms) - allows quick Alt+key combos without visual distraction
const KEYTIP_SHOW_DELAY = 400;

/**
 * Hook to manage KeyTips (Access Keys) functionality.
 * When Alt is held down for a short delay, shows key hints on buttons.
 * Pressing a key while Alt is held triggers the associated action.
 */
export function useKeyTips() {
	const [altKeyHeld, setAltKeyHeld] = useAtom(altKeyHeldAtom);
	const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			// Track Alt key being held (but not Alt+Tab or other system combos)
			if (e.key === "Alt" && !e.ctrlKey && !e.metaKey) {
				// Start a timer - only show KeyTips after a delay
				if (!timeoutRef.current) {
					timeoutRef.current = setTimeout(() => {
						setAltKeyHeld(true);
					}, KEYTIP_SHOW_DELAY);
				}
			}
			// If any other key is pressed while Alt is down, cancel the timer
			// (user is doing Alt+key combo, not trying to see KeyTips)
			if (e.altKey && e.key !== "Alt") {
				if (timeoutRef.current) {
					clearTimeout(timeoutRef.current);
					timeoutRef.current = null;
				}
				setAltKeyHeld(false);
			}
		};

		const handleKeyUp = (e: KeyboardEvent) => {
			if (e.key === "Alt") {
				// Clear the timer if Alt is released before delay
				if (timeoutRef.current) {
					clearTimeout(timeoutRef.current);
					timeoutRef.current = null;
				}
				setAltKeyHeld(false);
			}
		};

		// Also release when window loses focus
		const handleBlur = () => {
			if (timeoutRef.current) {
				clearTimeout(timeoutRef.current);
				timeoutRef.current = null;
			}
			setAltKeyHeld(false);
		};

		window.addEventListener("keydown", handleKeyDown);
		window.addEventListener("keyup", handleKeyUp);
		window.addEventListener("blur", handleBlur);

		return () => {
			if (timeoutRef.current) {
				clearTimeout(timeoutRef.current);
			}
			window.removeEventListener("keydown", handleKeyDown);
			window.removeEventListener("keyup", handleKeyUp);
			window.removeEventListener("blur", handleBlur);
		};
	}, [setAltKeyHeld]);

	return { altKeyHeld };
}

/**
 * Hook to register keytip actions and handle Alt+key presses.
 * @param actions - Array of { key, action, label } objects
 */
export function useKeyTipActions(
	actions: Array<{ key: string; action: () => void; label?: string }>
) {
	const [altKeyHeld] = useAtom(altKeyHeldAtom);

	useEffect(() => {
		if (!altKeyHeld) return;

		const handleKeyDown = (e: KeyboardEvent) => {
			// Only handle if Alt is still held
			if (!e.altKey) return;

			const keyLower = e.key.toLowerCase();
			const action = actions.find((a) => a.key.toLowerCase() === keyLower);

			if (action) {
				e.preventDefault();
				e.stopPropagation();
				action.action();
			}
		};

		window.addEventListener("keydown", handleKeyDown, true);
		return () => window.removeEventListener("keydown", handleKeyDown, true);
	}, [altKeyHeld, actions]);

	return { altKeyHeld };
}
