/**
 * ZoomIndicator Component
 * 
 * Displays the current zoom level as a percentage.
 * Shows briefly when zoom changes, then fades out.
 */

import { useEffect, useState, useRef } from "react";
import { useAtomValue } from "jotai";
import { editorSettingsAtom } from "@/atoms/settings";

export function ZoomIndicator() {
	const settings = useAtomValue(editorSettingsAtom);
	const zoom = settings?.zoom ?? 1;
	const [visible, setVisible] = useState(false);
	const [displayZoom, setDisplayZoom] = useState(zoom);
	const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const initialRender = useRef(true);

	useEffect(() => {
		// Skip showing on initial render
		if (initialRender.current) {
			initialRender.current = false;
			setDisplayZoom(zoom);
			return;
		}

		// Update display and show indicator
		setDisplayZoom(zoom);
		setVisible(true);

		// Clear existing timeout
		if (timeoutRef.current) {
			clearTimeout(timeoutRef.current);
		}

		// Hide after 1.5 seconds
		timeoutRef.current = setTimeout(() => {
			setVisible(false);
		}, 1500);

		return () => {
			if (timeoutRef.current) {
				clearTimeout(timeoutRef.current);
			}
		};
	}, [zoom]);

	const percentage = Math.round(displayZoom * 100);

	return (
		<div
			className={`
				absolute bottom-4 right-4 z-50
				px-3 py-1.5 rounded-md
				bg-gray-800/90 dark:bg-gray-700/90
				text-white text-sm font-medium
				shadow-lg backdrop-blur-sm
				transition-opacity duration-300
				${visible ? "opacity-100" : "opacity-0 pointer-events-none"}
			`}
		>
			{percentage}%
		</div>
	);
}
