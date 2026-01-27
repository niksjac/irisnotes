import { useAtom } from "jotai";
import { useCallback, useEffect, useRef } from "react";
import { toolbarVisibleAtom } from "@/atoms";
import { useConfig } from "@/hooks/use-config";

export const useEditorLayout = () => {
	const { config, updateConfig } = useConfig();
	const [toolbarVisible, setToolbarVisible] = useAtom(toolbarVisibleAtom);
	const initializedRef = useRef(false);
	const pendingSaveRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	// Sync atom from config ONLY on initial mount
	useEffect(() => {
		if (!initializedRef.current) {
			setToolbarVisible(config.editor.toolbarVisible);
			initializedRef.current = true;
		}
	}, [config.editor.toolbarVisible, setToolbarVisible]);

	const toggleToolbar = useCallback(() => {
		const newVisibility = !toolbarVisible;
		// Update atom immediately for instant UI response
		setToolbarVisible(newVisibility);
		
		// Debounce config save to avoid blocking
		if (pendingSaveRef.current) {
			clearTimeout(pendingSaveRef.current);
		}
		pendingSaveRef.current = setTimeout(() => {
			void updateConfig({
				editor: {
					...config.editor,
					toolbarVisible: newVisibility,
				},
			});
		}, 100);
	}, [toolbarVisible, config.editor, updateConfig, setToolbarVisible]);

	return {
		toolbarVisible,
		toggleToolbar,
	};
};
