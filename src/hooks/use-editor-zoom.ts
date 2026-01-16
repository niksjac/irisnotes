/**
 * useEditorZoom Hook
 *
 * Handles Ctrl+scroll wheel zoom and Ctrl+Plus/Minus for the editor.
 * Integrates with the existing editor settings zoom system.
 */

import { useEffect, useCallback, useRef } from "react";
import { useAtom } from "jotai";
import { editorSettingsAtom } from "@/atoms/settings";
import { EDITOR_SETTINGS_CONSTRAINTS, applyEditorSettings } from "@/types/editor-settings";

const { zoom: zoomConstraints } = EDITOR_SETTINGS_CONSTRAINTS;

/**
 * Hook to handle Ctrl+scroll wheel zoom on the editor
 * @param containerRef - Ref to the editor container element
 */
export function useEditorZoom(containerRef: React.RefObject<HTMLElement | null>) {
	const [settings, setSettings] = useAtom(editorSettingsAtom);
	const settingsRef = useRef(settings);
	
	// Keep ref in sync
	useEffect(() => {
		settingsRef.current = settings;
	}, [settings]);

	const adjustZoom = useCallback((delta: number) => {
		const currentSettings = settingsRef.current;
		const currentZoom = currentSettings?.zoom ?? 1;
		
		// Calculate new zoom, clamped to constraints
		const newZoom = Math.round(
			Math.min(zoomConstraints.max, Math.max(zoomConstraints.min, currentZoom + delta)) * 10
		) / 10; // Round to 1 decimal place
		
		if (newZoom !== currentZoom) {
			const newSettings = { ...currentSettings, zoom: newZoom };
			setSettings(newSettings);
			applyEditorSettings(newSettings);
		}
	}, [setSettings]);

	const handleWheel = useCallback((e: WheelEvent) => {
		// Only zoom when Ctrl is held
		if (!e.ctrlKey) return;
		
		e.preventDefault();
		
		// deltaY is positive when scrolling down (zoom out), negative when up (zoom in)
		const delta = e.deltaY > 0 ? -zoomConstraints.step : zoomConstraints.step;
		adjustZoom(delta);
	}, [adjustZoom]);

	const handleKeyDown = useCallback((e: KeyboardEvent) => {
		// Only handle Ctrl+Plus/Minus
		if (!e.ctrlKey) return;
		
		// Handle various key codes for plus/minus
		// Plus: Equal (with shift), NumpadAdd, or just Equal
		// Minus: Minus, NumpadSubtract
		// Zero: Digit0, Numpad0 (reset to 100%)
		let delta = 0;
		let isReset = false;
		
		if (e.key === "+" || e.key === "=" || e.code === "NumpadAdd") {
			delta = zoomConstraints.step;
		} else if (e.key === "-" || e.code === "NumpadSubtract") {
			delta = -zoomConstraints.step;
		} else if (e.key === "0" || e.code === "Numpad0") {
			isReset = true;
		}
		
		if (delta !== 0) {
			e.preventDefault();
			adjustZoom(delta);
		} else if (isReset) {
			e.preventDefault();
			const currentSettings = settingsRef.current;
			const newSettings = { ...currentSettings, zoom: 1 };
			setSettings(newSettings);
			applyEditorSettings(newSettings);
		}
	}, [adjustZoom, setSettings]);

	useEffect(() => {
		const container = containerRef.current;
		if (!container) return;

		// Use passive: false so we can preventDefault
		container.addEventListener("wheel", handleWheel, { passive: false });
		
		return () => {
			container.removeEventListener("wheel", handleWheel);
		};
	}, [containerRef, handleWheel]);

	// Global keyboard listener for zoom shortcuts
	useEffect(() => {
		document.addEventListener("keydown", handleKeyDown);
		
		return () => {
			document.removeEventListener("keydown", handleKeyDown);
		};
	}, [handleKeyDown]);
}

/**
 * Hook to handle Ctrl+scroll wheel zoom, with direct element binding
 * Returns a ref to attach to the container
 */
export function useEditorZoomRef() {
	const containerRef = useRef<HTMLDivElement>(null);
	useEditorZoom(containerRef);
	return containerRef;
}
